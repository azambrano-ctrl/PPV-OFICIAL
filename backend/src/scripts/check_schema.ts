
import dotenv from 'dotenv';
import { query, closePool } from '../config/database';

dotenv.config();

async function runDebug() {
    console.log('--- VERIFICACIÓN DE DATOS ---');

    try {
        console.log('1. Verificando tabla stream_tokens...');
        try {
            const res = await query('SELECT * FROM stream_tokens LIMIT 1');
            console.log('✅ Tabla stream_tokens EXISTE. Filas:', res.rowCount);
        } catch (e: any) {
            console.log('❌ Tabla stream_tokens error:', e.message);
        }

        console.log('\n2. Verificando usuarios y sesiones...');
        try {
            const res = await query('SELECT id, email, role, current_session_id FROM users LIMIT 3');
            console.log('✅ Usuarios encontrados:', res.rowCount);
            console.log(JSON.stringify(res.rows, null, 2));
        } catch (e: any) {
            console.log('❌ Error consultando usuarios:', e.message);
        }

    } catch (error: any) {
        console.error('❌ Error general:', error.message);
    }

    console.log('\n--- FIN DE VERIFICACIÓN ---');
    await closePool();
}

runDebug().catch(console.error);
