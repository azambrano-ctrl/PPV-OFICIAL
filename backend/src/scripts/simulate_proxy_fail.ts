
import axios from 'axios';
import dotenv from 'dotenv';
import { closePool } from '../config/database';
import { getEventById } from '../services/eventService';


dotenv.config();

async function simulateProxy() {
    console.log('--- SIMULACIÓN DE PROXY DE STREAMING ---');

    // 1. Obtener el evento que falla (el del screenshot o el último)
    const eventId = "a736bbca-89fd-4622-bb8c-4a2ed528a8ac"; // ID de la prueba
    const event = await getEventById(eventId);

    if (!event) {
        console.log('❌ Evento no encontrado');
        await closePool();
        return;
    }

    console.log(`✅ Evento: ${event.title}`);

    let streamTargetUrl = '';
    if (event.stream_url && event.stream_url.startsWith('http')) {
        streamTargetUrl = event.stream_url;
    } else if (event.stream_key && event.stream_key.startsWith('http')) {
        streamTargetUrl = event.stream_key;
    }

    if (!streamTargetUrl) {
        console.log('❌ No hay URL de stream para proxiar');
        await closePool();
        return;
    }

    console.log(`📺 Intentando proxiar URL: ${streamTargetUrl}`);

    try {
        const headers: any = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        };

        // Simular lo que hace el proxy real
        const response = await axios.get(streamTargetUrl, {
            responseType: 'stream',
            headers,
            timeout: 5000,
            validateStatus: (status) => status >= 200 && status < 300 || status === 206
        });

        console.log('✅ Proxy exitoso (Upstream respondió correctamente)');
        console.log(`Status Payload: ${response.status}`);
    } catch (error: any) {
        console.error('🔥 ERROR EN EL PROXY (Esto causa el 500):', error.message);
        if (error.response) {
            console.error(`Status Upstream: ${error.response.status}`);
        } else {
            console.error('Detalle del error:', error);
        }
    }

    await closePool();
}

simulateProxy().catch(console.error);
