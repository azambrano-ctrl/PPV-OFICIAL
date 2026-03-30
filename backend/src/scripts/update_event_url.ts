
import dotenv from 'dotenv';
import { query, closePool } from '../config/database';

dotenv.config();

async function updateEventUrl() {
    console.log('--- ACTUALIZACIÓN DE URL DE EVENTO ---');

    // El ID del evento de prueba que vemos en los screenshots
    const eventId = "a736bbca-89fd-4622-bb8c-4a2ed528a8ac";

    // He notado que el Account ID de Cloudflare en la URL del screenshot 
    // coincide con la que falló 404. Posiblemente el Video ID sea el problema o falte /watch?
    // Cloudflare Stream URLs suelen ser: https://customer-<id>.cloudflarestream.com/<video_id>/manifest/video.m3u8

    // Probaremos con la URL que el servicio genera
    const accountId = "c31035fa17b98663a1aee245999923e4";
    const videoId = "389b462170a2d45f0b02ed16cffdb69a";
    const hlsUrl = `https://customer-${accountId}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;

    console.log(`Actualizando evento ${eventId} con URL: ${hlsUrl}`);

    try {
        const result = await query(
            'UPDATE events SET stream_url = $1, status = $2 WHERE id = $3 RETURNING title',
            [hlsUrl, 'live', eventId]
        );

        if (result.rowCount && result.rowCount > 0) {
            console.log(`✅ Evento "${result.rows[0].title}" actualizado correctamente.`);
        } else {
            console.log('❌ No se encontró el evento para actualizar.');
        }
    } catch (error: any) {
        console.error('❌ Error actualizando la base de datos:', error.message);
    }

    await closePool();
}

updateEventUrl().catch(console.error);
