
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testStreamConnectivity() {
    const url = "https://customer-c31035fa17b98663a1aee245999923e4.cloudflarestream.com/389b462170a2d45f0b02ed16cffdb69a/manifest/video.m3u8";

    console.log('--- PRUEBA DE CONECTIVIDAD DE STREAM ---');
    console.log(`URL: ${url}`);

    try {
        const start = Date.now();
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 5000
        });
        const duration = Date.now() - start;

        console.log(`✅ Conexión exitosa (${duration}ms)`);
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Content-Type: ${response.headers['content-type']}`);
    } catch (error: any) {
        console.error('❌ Error de conexión:', error.message);
        if (error.response) {
            console.error(`   Status Upstream: ${error.response.status}`);
            console.log('   Data:', JSON.stringify(error.response.data));
        }
    }
}

testStreamConnectivity();
