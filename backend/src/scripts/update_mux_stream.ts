import { query } from '../config/database';

async function updateMuxStream() {
    try {
        console.log('='.repeat(80));
        console.log('ACTUALIZAR EVENTO CON STREAM DE MUX');
        console.log('='.repeat(80));
        console.log('');

        // Mostrar eventos actuales
        const events = await query(
            'SELECT id, title, status, stream_key FROM events ORDER BY created_at DESC'
        );

        console.log('Eventos disponibles:\n');
        events.rows.forEach((event: any, index: number) => {
            console.log(`${index + 1}. ${event.title}`);
            console.log(`   ID: ${event.id}`);
            console.log(`   Status: ${event.status}`);
            console.log(`   Stream actual: ${event.stream_key?.substring(0, 60)}...`);
            console.log('');
        });

        console.log('='.repeat(80));
        console.log('INSTRUCCIONES:');
        console.log('='.repeat(80));
        console.log('');
        console.log('Para actualizar un evento con tu stream de Mux, necesitas:');
        console.log('');
        console.log('1. El PLAYBACK ID de tu stream en Mux');
        console.log('   (NO uses el Stream ID, usa el Playback ID)');
        console.log('');
        console.log('2. Ejecuta este comando SQL en la base de datos:');
        console.log('');
        console.log('   UPDATE events');
        console.log('   SET stream_key = \'TU_PLAYBACK_ID_AQUI\',');
        console.log('       status = \'live\'');
        console.log('   WHERE id = \'ID_DEL_EVENTO\';');
        console.log('');
        console.log('Ejemplo con Playback ID:');
        console.log('');
        console.log('   UPDATE events');
        console.log('   SET stream_key = \'abc123xyz\',');
        console.log('       status = \'live\'');
        console.log('   WHERE title = \'Pelea Estelar: Campeón vs Retador\';');
        console.log('');
        console.log('='.repeat(80));
        console.log('');
        console.log('¿Dónde encontrar el Playback ID en Mux?');
        console.log('');
        console.log('1. Ve a tu dashboard de Mux');
        console.log('2. Selecciona tu Live Stream');
        console.log('3. Busca la sección "Playback"');
        console.log('4. Copia el "Playback ID" (es diferente al Stream ID)');
        console.log('');
        console.log('El Playback ID se verá algo como: "abc123xyz456"');
        console.log('');
        console.log('='.repeat(80));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

updateMuxStream();
