const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

console.log('Conectando a Supabase...');

async function updateToTestStream() {
    try {
        console.log('🔧 Actualizando evento con stream de prueba...\n');

        const result = await pool.query(`
            UPDATE events 
            SET stream_key = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
            WHERE title = 'TFL 014 REDENCION'
            RETURNING id, title, stream_key, status
        `);

        if (result.rows.length > 0) {
            const event = result.rows[0];
            console.log('✅ Evento actualizado correctamente\n');
            console.log('='.repeat(60));
            console.log('Título:', event.title);
            console.log('Status:', event.status);
            console.log('Stream URL:', event.stream_key);
            console.log('='.repeat(60));
            console.log('\n✅ Stream de prueba configurado!');
            console.log('\n📝 Próximos pasos:');
            console.log('1. Abre la aplicación web');
            console.log('2. Navega al evento "TFL 014 REDENCION"');
            console.log('3. El stream debería reproducirse automáticamente\n');
        } else {
            console.log('⚠️  No se encontró el evento "TFL 014 REDENCION"');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

updateToTestStream();
