const { Pool } = require('pg');
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: process.env.DATABASE_SSL_CERT ? true : false,
            ca: process.env.DATABASE_SSL_CERT || undefined }
        : false,
    // Conservative pool for 512MB Render free tier
    max: process.env.NODE_ENV === 'production' ? 5 : 10,
    min: 1,
    idleTimeoutMillis: 15000,       // Reclaim idle connections faster
    connectionTimeoutMillis: 3000,  // Fail fast instead of queuing forever
    statement_timeout: 15000,       // Kill stuck queries after 15s
    application_name: 'ppv-backend',
});

pool.on('connect', () => {
    console.log('✅ Database connected');
});

pool.on('error', (err: any) => {
    console.error('❌ Unexpected database pool error:', err);
});

// Log pool exhaustion warnings
pool.on('acquire', () => {
    const total = pool.totalCount;
    const idle = pool.idleCount;
    const waiting = pool.waitingCount;
    if (waiting > 2) {
        console.warn(`⚠️ DB pool pressure: total=${total} idle=${idle} waiting=${waiting}`);
    }
});

/**
 * Execute a query with automatic connection handling
 */
export const query = async (text: string, params?: any[]) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

/**
 * Get a client from the pool for transactions
 */
export const getClient = async (): Promise<any> => {
    const client = await pool.connect();
    return client;
};

/**
 * Execute a transaction with automatic rollback on error
 */
export const transaction = async <T>(
    callback: (client: any) => Promise<T>
): Promise<T> => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Close all database connections
 */
export const closePool = async () => {
    await pool.end();
    console.log('Database pool closed');
};

export default pool;
