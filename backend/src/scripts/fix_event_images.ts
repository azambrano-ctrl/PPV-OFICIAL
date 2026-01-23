import { query } from '../config/database';

async function fixEventImages() {
    try {
        console.log('Actualizando imágenes del evento...\n');

        // Actualizar el evento con imágenes que funcionen
        const updateResult = await query(`
            UPDATE events 
            SET 
                thumbnail_url = 'https://placehold.co/800x450/e74c3c/ffffff?text=TFL+014+REDENCION',
                banner_url = 'https://placehold.co/1920x600/e74c3c/ffffff?text=TFL+014+REDENCION'
            WHERE title = 'TFL 014 REDENCION'
        `);

        console.log(`✓ Actualizado ${updateResult.rowCount} evento(s)\n`);

        // Verificar
        const result = await query(
            `SELECT id, title, thumbnail_url, banner_url, stream_key, status 
             FROM events 
             WHERE title = 'TFL 014 REDENCION'`
        );

        if (result.rows.length > 0) {
            const event = result.rows[0];
            console.log('Evento actualizado:');
            console.log('==================');
            console.log('Título:', event.title);
            console.log('Status:', event.status);
            console.log('Thumbnail:', event.thumbnail_url);
            console.log('Banner:', event.banner_url);
            console.log('Stream Key:', event.stream_key);
            console.log('');
            console.log('ID del evento:', event.id);
            console.log('');
        }

        console.log('='.repeat(80));
        console.log('SIGUIENTE PASO: Actualizar con tu Playback ID de Mux');
        console.log('='.repeat(80));
        console.log('');
        console.log('Para que reproduzca tu stream de Mux, necesitas:');
        console.log('');
        console.log('1. Ir a: https://dashboard.mux.com/live-streams');
        console.log('2. Hacer clic en tu stream activo');
        console.log('3. En la pestaña "Playback", copiar el "Playback ID"');
        console.log('');
        console.log('Luego ejecuta:');
        console.log('');
        console.log('  npx ts-node src/scripts/set_mux_playback.ts TU_PLAYBACK_ID');
        console.log('');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

fixEventImages();
