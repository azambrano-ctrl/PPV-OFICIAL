import { getSettings } from './src/services/settingsService';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config();

async function testMerge() {
    try {
        console.log('--- TESTING SETTINGS MERGE ---');
        console.log('ENV FACEBOOK_APP_ID:', process.env.FACEBOOK_APP_ID);

        const settings = await getSettings();

        console.log('RESULT FROM SERVICE:');
        console.log('Google Android:', settings.google_client_id_android);
        console.log('Google iOS:', settings.google_client_id_ios);
        console.log('Google Web:', settings.google_client_id_web);
        console.log('Facebook App ID:', settings.facebook_app_id);

        if (settings.facebook_app_id === process.env.FACEBOOK_APP_ID) {
            console.log('✅ SUCCESS: Merge is working correctly.');
        } else {
            console.log('❌ FAILURE: Merge is NOT working.');
        }
        console.log('------------------------------');
    } catch (error) {
        console.error('Error during test:', error);
    } finally {
        process.exit();
    }
}

testMerge();
