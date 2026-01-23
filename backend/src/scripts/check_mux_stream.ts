import axios from 'axios';

const playbackId = '012ifhrlm01FLMAB1pUEjBR88tRdNQacMuUeQ00RDrbjck';
const streamUrl = `https://stream.mux.com/${playbackId}.m3u8`;

async function checkStreamAvailability() {
    try {
        console.log('Verificando disponibilidad del stream...');
        console.log('URL:', streamUrl);
        console.log('');

        const response = await axios.get(streamUrl, {
            validateStatus: () => true, // No lanzar error en códigos de estado
        });

        console.log('Código de respuesta:', response.status);
        console.log('');

        if (response.status === 200) {
            console.log('✅ Stream disponible');
            console.log('');
            console.log('Contenido del manifest:');
            console.log(response.data.substring(0, 500));
        } else if (response.status === 400) {
            console.log('❌ Error 400: Bad Request');
            console.log('');
            console.log('Posibles causas:');
            console.log('1. El stream no está transmitiendo activamente');
            console.log('2. El Playback ID es válido pero el stream está "idle" (esperando transmisión)');
            console.log('3. Necesitas iniciar la transmisión desde OBS o tu encoder');
            console.log('');
            console.log('Respuesta:', response.data);
        } else {
            console.log(`❌ Error ${response.status}`);
            console.log('Respuesta:', response.data);
        }

    } catch (error: any) {
        console.error('Error al verificar stream:', error.message);
    }
}

checkStreamAvailability();
