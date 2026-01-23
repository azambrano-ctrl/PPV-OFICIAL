import { query } from '../config/database';

// Obtener el Playback ID desde argumentos de línea de comandos
const playbackId = process.argv[2];

async function setMuxPlayback() {
    try {
        if (!playbackId) {
            console.error('❌ Error: Debes proporcionar el Playback ID de Mux');
            console.log('');
            console.log('Uso:');
            console.log('  npx ts-node src/scripts/set_mux_playback.ts TU_PLAYBACK_ID');
            console.log('');
            console.log('Ejemplo:');
            console.log('  npx ts-node src/scripts/set_mux_playback.ts abc123XYZ456');
            console.log('');
            process.exit(1);
        }

        console.log(`Actualizando evento con Playback ID: ${playbackId}\n`);

        // Actualizar el evento con el Playback ID de Mux
        const updateResult = await query(`
            UPDATE events 
            SET stream_key = $1
            WHERE title = 'TFL 014 REDENCION'
        `, [playbackId]);

        console.log(`✓ Actualizado ${updateResult.rowCount} evento(s)\n`);

        // Verificar
        const result = await query(
            `SELECT id, title, stream_key, status 
             FROM events 
             WHERE title = 'TFL 014 REDENCION'`
        );

        if (result.rows.length > 0) {
            const event = result.rows[0];
            console.log('✅ Evento configurado correctamente:');
            console.log('=====================================');
            console.log('Título:', event.title);
            console.log('Status:', event.status);
            console.log('Playback ID:', event.stream_key);
            console.log('');
            console.log('🎬 URL de reproducción que se generará:');
            console.log(`   https://stream.mux.com/${event.stream_key}.m3u8`);
            console.log('');
            console.log('✓ Listo para reproducir!');
            console.log('');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

setMuxPlayback();
