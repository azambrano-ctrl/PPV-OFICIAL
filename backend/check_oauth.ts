import { getSettings } from './src/services/settingsService';

async function checkOAuth() {
    try {
        const settings = await getSettings();
        console.log('--- OAUTH SETTINGS ---');
        console.log('Google Android:', settings.google_client_id_android);
        console.log('Google iOS:', settings.google_client_id_ios);
        console.log('Google Web:', settings.google_client_id_web);
        console.log('Facebook App ID:', settings.facebook_app_id);
        console.log('------------------');
    } catch (error) {
        console.error('Error fetching settings:', error);
    }
}

checkOAuth();
