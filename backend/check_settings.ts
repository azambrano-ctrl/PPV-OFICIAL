import { getSettings } from './src/services/settingsService';

async function checkLogo() {
    try {
        const settings = await getSettings();
        console.log('--- SETTINGS ---');
        console.log('Site Name:', settings.site_name);
        console.log('Site Logo:', settings.site_logo);
        console.log('------------------');
    } catch (error) {
        console.error('Error fetching settings:', error);
    }
}

checkLogo();
