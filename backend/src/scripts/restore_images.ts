import { query } from '../config/database';

async function restoreOriginalImage() {
    try {
        console.log('Restaurando imagen original del evento...\n');

        // Primero, ver qué imagen tenía antes
        const current = await query(
            `SELECT id, title, thumbnail_url, banner_url 
             FROM events 
             WHERE title = 'TFL 014 REDENCION'`
        );

        if (current.rows.length > 0) {
            console.log('Estado actual:');
            console.log('Thumbnail:', current.rows[0].thumbnail_url);
            console.log('Banner:', current.rows[0].banner_url);
            console.log('');
        }

        // Restaurar a NULL para que use la imagen original que cargaste
        const updateResult = await query(`
            UPDATE events 
            SET 
                thumbnail_url = NULL,
                banner_url = NULL
            WHERE title = 'TFL 014 REDENCION'
        `);

        console.log(`✓ Restaurado ${updateResult.rowCount} evento(s)\n`);

        // Verificar
        const result = await query(
            `SELECT id, title, thumbnail_url, banner_url, stream_key, status 
             FROM events 
             WHERE title = 'TFL 014 REDENCION'`
        );

        if (result.rows.length > 0) {
            const event = result.rows[0];
            console.log('Evento restaurado:');
            console.log('==================');
            console.log('Título:', event.title);
            console.log('Status:', event.status);
            console.log('Thumbnail:', event.thumbnail_url || 'NULL (usará la imagen original)');
            console.log('Banner:', event.banner_url || 'NULL (usará la imagen original)');
            console.log('Stream Key:', event.stream_key);
            console.log('');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

restoreOriginalImage();
