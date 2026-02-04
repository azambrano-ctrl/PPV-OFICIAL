
import dotenv from 'dotenv';
import { query, closePool } from '../config/database';
import { getEventById } from '../services/eventService';
import { generateStreamToken, verifyStreamToken } from '../middleware/auth';

dotenv.config();

async function runDebug() {
    console.log('--- INICIO DE DEPURACIÓN DE STREAMING V2 ---');

    try {
        const events = await query('SELECT * FROM events ORDER BY created_at DESC LIMIT 1');
        if (events.rows.length === 0) {
            console.log('⚠️ No se encontraron eventos.');
            await closePool();
            return;
        }

        const event = events.rows[0];
        const eventId = event.id;
        console.log(`✅ Evento: ${event.title} (ID: ${eventId})`);
        console.log(`   Status: ${event.status}`);
        console.log(`   Stream Key: "${event.stream_key}"`);
        console.log(`   Stream URL: "${event.stream_url}"`);
        console.log(`   Price: ${event.price}`);

        // Prueba de token
        const mockUserId = '00000000-0000-0000-0000-000000000000';
        const token = generateStreamToken(mockUserId, eventId);
        console.log(`\n🔑 Token generado para usuario mock: ${token.substring(0, 15)}...`);

        try {
            const decoded = verifyStreamToken(token);
            console.log('✅ Verificación de token: EXITOSA');
            console.log('   Decoded eventId:', decoded.eventId);
        } catch (tokenErr: any) {
            console.error('❌ Verificación de token: FALLIDA -', tokenErr.message);
        }

        // Lógica de URL que se usa en streaming.ts
        let streamUrlFinal = '';
        if (event.stream_url && event.stream_url.startsWith('http')) {
            streamUrlFinal = event.stream_url;
        } else if (event.stream_key && event.stream_key.startsWith('http')) {
            streamUrlFinal = event.stream_key;
        }

        console.log(`\n📺 URL de Stream resuelta: "${streamUrlFinal || 'NINGUNA'}"`);

        if (streamUrlFinal.startsWith('http:')) {
            console.log('⚠️ Stream INSEGURO (HTTP). Se requiere proxy.');
        }

    } catch (error: any) {
        console.error('❌ Error general:', error.message);
    }

    console.log('\n--- FIN DE DEPURACIÓN ---');
    await closePool();
}

runDebug().catch(console.error);
