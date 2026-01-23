const { Pool } = require('pg');
const Mux = require('@mux/mux-node').default;
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

async function updateWithLiveStream() {
    try {
        console.log('🔍 Buscando stream EN VIVO en Mux...\n');

        // Obtener todos los streams
        const listResponse = await mux.video.liveStreams.list();
        const liveStreams = Array.isArray(listResponse) ? listResponse : (listResponse.data || []);

        console.log(`Encontrados ${liveStreams.length} stream(s)\n`);

        // Buscar el stream activo
        const activeStream = liveStreams.find(s => s.status === 'active');

        if (!activeStream) {
            console.log('❌ No hay ningún stream activo en este momento');
            console.log('\nStreams disponibles:');
            liveStreams.forEach(s => {
                console.log(`  - ID: ${s.id}`);
                console.log(`    Status: ${s.status}`);
                console.log(`    Stream Key: ${s.stream_key}`);
                console.log('');
            });
            process.exit(1);
        }

        console.log('✅ Stream EN VIVO encontrado:');
        console.log('Stream ID:', activeStream.id);
        console.log('Status:', activeStream.status);
        console.log('Stream Key:', activeStream.stream_key);
        console.log('');

        // Obtener Playback ID
        const playbackIds = activeStream.playback_ids || activeStream.playbackIds || [];

        if (playbackIds.length === 0) {
            console.log('⚠️  El stream no tiene Playback IDs. Creando uno...\n');

            const createResponse = await mux.video.liveStreams.createPlaybackId(
                activeStream.id,
                { policy: 'public' }
            );

            playbackIds.push(createResponse);
            console.log('✅ Playback ID creado\n');
        }

        const playbackId = playbackIds[0].id;
        console.log('Playback ID:', playbackId);
        console.log('');

        // Actualizar evento en la base de datos
        console.log('🔧 Actualizando evento con stream EN VIVO...\n');

        const result = await pool.query(`
            UPDATE events 
            SET stream_key = $1
            WHERE title = 'TFL 014 REDENCION'
            RETURNING id, title, stream_key, status
        `, [playbackId]);

        if (result.rows.length > 0) {
            const event = result.rows[0];
            console.log('✅ Evento actualizado correctamente\n');
            console.log('='.repeat(60));
            console.log('Título:', event.title);
            console.log('Status:', event.status);
            console.log('Playback ID:', event.stream_key);
            console.log('');
            console.log('🎬 URL de reproducción:');
            console.log(`   https://stream.mux.com/${event.stream_key}.m3u8`);
            console.log('='.repeat(60));
            console.log('\n✅ ¡Stream EN VIVO conectado!');
            console.log('\n📝 Próximos pasos:');
            console.log('1. Recarga la aplicación web');
            console.log('2. Navega al evento "TFL 014 REDENCION"');
            console.log('3. ¡Deberías ver tu transmisión en vivo!\n');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response?.data) {
            console.error('Detalles:', JSON.stringify(error.response.data, null, 2));
        }
    } finally {
        await pool.end();
    }
}

updateWithLiveStream();
