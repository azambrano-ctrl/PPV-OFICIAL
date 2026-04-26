const Mux = require('@mux/mux-node').default;
require('dotenv').config();

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

async function checkStatus() {
    try {
        console.log('🔍 Diagnosticando estado del stream Mux...\n');

        // 1. Verificar Stream
        const streamId = 'GKVX4Lb8or72lmibk92pc2ZMLM8qMMHmnyG9DiqA00hk'; // ID del stream anterior
        const stream = await mux.video.liveStreams.retrieve(streamId);

        console.log('📡 ESTADO DEL STREAM:');
        console.log(`Status: ${stream.status.toUpperCase()}`);
        console.log(`Live: ${stream.is_live ? 'SÍ' : 'NO'}`);
        console.log(`Active Asset ID: ${stream.active_asset_id || 'Ninguno'}`);
        console.log(`Recent Asset IDs: ${stream.recent_asset_ids?.join(', ') || 'Ninguno'}`);
        console.log('');

        // 2. Verificar Playback ID
        const playbackId = '012ifhrlm01FLMAB1pUEjBR88tRdNQacMuUeQ00RDrbjck';
        const playbackUrl = `https://stream.mux.com/${playbackId}.m3u8`;

        console.log('▶️ CONFIGURACIÓN DE REPRODUCCIÓN:');
        console.log(`Playback ID: ${playbackId}`);
        console.log(`URL: ${playbackUrl}`);

        // Verificar Policy
        const pidObj = stream.playback_ids.find(p => p.id === playbackId);
        if (pidObj) {
            console.log(`Policy: ${pidObj.policy.toUpperCase()}`); // public o signed
        } else {
            console.log('⚠️ El Playback ID no coincide con este stream');
        }
        console.log('');

        // 3. Verificar Accesibilidad (test de request)
        console.log('🌍 TEST DE ACCESIBILIDAD:');
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(playbackUrl, { signal: controller.signal });
            clearTimeout(timeout);

            console.log(`Código HTTP: ${response.status} ${response.statusText}`);
            if (response.ok) {
                console.log('✅ El manifiesto HLS es accesible y válido.');
            } else {
                console.log('❌ El servidor devuelve error.');
            }
        } catch (e) {
            console.log(`❌ Error de conexión: ${e.message}`);
        }

    } catch (error) {
        console.error('❌ Error general:', error.message);
    }
}

checkStatus();
