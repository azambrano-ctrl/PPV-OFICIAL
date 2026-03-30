
import { query, closePool } from '../config/database';

async function updateEventUrl() {
    const correctUrl = 'https://customer-caahcat0xob7ea5u.cloudflarestream.com/77aec9cd043bdf184880eeae1d67ca9b/manifest/video.m3u8';

    try {
        // Buscamos el evento que tiene el ID del video (77aec9cd043bdf184880eeae1d67ca9b)
        const findSql = "SELECT id, title FROM events WHERE stream_url LIKE '%77aec9cd043bdf184880eeae1d67ca9b%' OR id = '7e3531b2-ee93-4958-bb4e-a34b35a92998'";
        const events = await query(findSql);

        if (events.rows.length === 0) {
            console.log('No se encontró el evento para actualizar.');
            return;
        }

        for (const event of events.rows) {
            console.log(`Actualizando evento: ${event.title} (${event.id})`);
            await query(
                "UPDATE events SET stream_url = $1, status = 'live' WHERE id = $2",
                [correctUrl, event.id]
            );
            console.log('✅ URL actualizada correctamente.');
        }

    } catch (err: any) {
        console.error('Error:', err.message);
    } finally {
        await closePool();
    }
}

updateEventUrl();
