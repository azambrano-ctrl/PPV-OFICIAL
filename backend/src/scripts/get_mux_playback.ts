import Mux from '@mux/mux-node';
import { query } from '../config/database';
import * as dotenv from 'dotenv';

dotenv.config();

async function getMuxPlaybackId() {
    try {
        const muxTokenId = process.env.MUX_TOKEN_ID;
        const muxTokenSecret = process.env.MUX_TOKEN_SECRET;

        if (!muxTokenId || !muxTokenSecret) {
            console.error('❌ Error: Credenciales de Mux no configuradas');
            process.exit(1);
        }

        console.log('Conectando con Mux API...\n');

        const mux = new Mux({
            tokenId: muxTokenId,
            tokenSecret: muxTokenSecret,
        });

        console.log('Obteniendo streams en vivo...\n');

        const listResponse: any = await mux.video.liveStreams.list();
        const liveStreams = Array.isArray(listResponse) ? listResponse : (listResponse.data || []);

        console.log(`Encontrados ${liveStreams.length} stream(s):\n`);

        for (const stream of liveStreams) {
            console.log(`Stream ID: ${stream.id}`);
            console.log(`Status: ${stream.status}`);

            const playbackIds = stream.playback_ids || stream.playbackIds || [];
            console.log(`Playback IDs: ${playbackIds.map((p: any) => p.id).join(', ') || 'Ninguno'}`);
            console.log('');
        }

        // Buscar el stream activo o idle
        const activeStream = liveStreams.find((s: any) =>
            s.status === 'active' || s.status === 'idle'
        );

        if (!activeStream) {
            console.error('❌ No se encontró un stream activo o idle');
            console.log('\nStreams disponibles:');
            liveStreams.forEach((s: any) => {
                console.log(`  - ${s.id}: ${s.status}`);
            });
            process.exit(1);
        }

        console.log('✅ Stream encontrado:');
        console.log('====================');
        console.log('Stream ID:', activeStream.id);
        console.log('Status:', activeStream.status);
        console.log('');

        // Obtener playback IDs
        let playbackIds = activeStream.playback_ids || activeStream.playbackIds || [];

        // Si no tiene playback IDs, crear uno
        if (playbackIds.length === 0) {
            console.log('⚠️  Este stream no tiene Playback IDs. Creando uno público...\n');

            try {
                const createResponse: any = await mux.video.liveStreams.createPlaybackId(
                    activeStream.id,
                    { policy: 'public' }
                );

                playbackIds = createResponse.playback_ids || createResponse.playbackIds || [];
                console.log('✓ Playback ID creado exitosamente\n');
            } catch (error: any) {
                console.error('Error creando Playback ID:', error.message);
                process.exit(1);
            }
        }

        const playbackId = playbackIds[0]?.id;

        if (!playbackId) {
            console.error('❌ No se pudo obtener el Playback ID');
            process.exit(1);
        }

        console.log('✅ Playback ID obtenido:', playbackId);
        console.log('');

        // Actualizar evento en la base de datos
        console.log('Actualizando evento "TFL 014 REDENCION"...\n');

        const updateResult = await query(`
            UPDATE events 
            SET stream_key = $1
            WHERE title = 'TFL 014 REDENCION'
        `, [playbackId]);

        console.log(`✓ Actualizado ${updateResult.rowCount} evento(s)\n`);

        // Verificar
        const result = await query(
            `SELECT id, title, stream_key, status FROM events WHERE title = 'TFL 014 REDENCION'`
        );

        if (result.rows.length > 0) {
            const event = result.rows[0];
            console.log('='.repeat(60));
            console.log('✅ EVENTO CONFIGURADO CORRECTAMENTE');
            console.log('='.repeat(60));
            console.log('');
            console.log('Título:', event.title);
            console.log('Status:', event.status);
            console.log('Playback ID:', event.stream_key);
            console.log('');
            console.log('🎬 URL de reproducción Mux:');
            console.log(`   https://stream.mux.com/${event.stream_key}.m3u8`);
            console.log('');
            console.log('✅ ¡Tu stream en vivo está listo para reproducirse!');
            console.log('');
            console.log('Recarga tu aplicación web para ver el stream en vivo.');
            console.log('='.repeat(60));
        }

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        if (error.response?.data) {
            console.error('Detalles:', JSON.stringify(error.response.data, null, 2));
        }
    } finally {
        process.exit(0);
    }
}

getMuxPlaybackId();
