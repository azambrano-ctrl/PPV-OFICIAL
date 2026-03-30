
import { query, closePool } from '../config/database';

async function migrateUrls() {
    const oldId = 'c31035fa17b98663a1aee245999923e4';
    const newId = 'caahcat0xob7ea5u';

    console.log(`--- MIGRACIÓN DE URLs DE CLOUDFLARE ---`);
    console.log(`Buscando URLs con subdominio: customer-${oldId}`);

    try {
        // Encontrar eventos afectados
        const findSql = `SELECT id, title, stream_url FROM events WHERE stream_url LIKE '%customer-${oldId}%'`;
        const result = await query(findSql);

        if (result.rows.length === 0) {
            console.log('No se encontraron eventos con el subdominio antiguo.');
        } else {
            console.log(`Se encontraron ${result.rows.length} eventos afectados.`);

            for (const event of result.rows) {
                const newUrl = event.stream_url.replace(oldId, newId);
                console.log(`Actualizando "${event.title}":`);
                console.log(`  DE: ${event.stream_url}`);
                console.log(`  A : ${newUrl}`);

                await query('UPDATE events SET stream_url = $1 WHERE id = $2', [newUrl, event.id]);
            }
            console.log('✅ Migración de la tabla "events" completada.');
        }

        // También revisar la tabla live_streams si existe algún campo relevante (aunque usualmente no guardan la URL completa ahí)
        console.log('Revisando campos adicionales...');
        // (Agrega aquí otras tablas si es necesario)

    } catch (err: any) {
        console.error('❌ Error durante la migración:', err.message);
    } finally {
        await closePool();
        console.log('Pool de base de datos cerrado.');
    }
}

migrateUrls();
