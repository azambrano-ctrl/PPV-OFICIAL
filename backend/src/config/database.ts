const { Pool } = require('pg');
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Test connection on startup
pool.on('connect', () => {
    console.log('✅ Database connected successfully');
});

pool.on('error', (err: any) => {
    console.error('❌ Unexpected database error on idle client:', err);
    // Don't exit process, let the pool handle reconnection or other clients continue
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
