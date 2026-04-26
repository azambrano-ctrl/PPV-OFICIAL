import { query } from './src/config/database';

async function updateStreamUrl() {
    try {
        const streamUrl = 'https://epg.provider.plex.tv/library/parts/608049aefa2b8ae93c2c3a20-66ccae1a78822c7edc4b6df1/variant.m3u8?x-plex-token=8xCx9DYt-UL73GkwMnXS&x-plex-advertising-identifier=&x-plex-client-identifier=a37346a1-3975-4ff8-874e-8cfc7112c42c&x-plex-playback-id=p_dee8ed7b-d1c4-4c21-8e23-53046a0b3d57&x-plex-playback-session-id=&x-plex-session-id=&x-plex-device=Windows&x-plex-device-name=Plex+Mediaverse&x-plex-advertising-donottrack=0&x-plex-drm=&x-plex-model=&x-plex-platform=Firefox&x-plex-platform-version=146.0&x-plex-product=Plex+Mediaverse&x-plex-device-screen-resolution=&x-plex-device-vendor=&x-plex-version=&x-plex-provider-streaming-start=1765806286&url=88d309a8807e99267049c671dd6fb7c6-3745ec8439b8a83da5c1b93a199b5c81b0083d8f2c0a8df47bce4569cabb395ca284781896e4240af8796d31c09faec5544feb2c193e91bd8da808c864765ccf62adf424a8fba073206e899d4b63f600f55faf143c512cae64f33f3695fcde1165a9858414d478b24ced0556cee086792579870b97c71b20a960038998b631c6d45f1a693dc1a47cf215d52f7f28b6cafe7525d041e8ecf2a38e02cb965b5d712fa227c2c3b825fe69e2c1f8f6be8ab187fe6a263098d267284e0d1d4653f68a56ee8b13ca61c9a024e6df6b8ac0ccd6';

        // Update the most recent event or a specific one. Let's update ALL events for simplicity of testing, or just the first one.
        // Better to update the one with 'upcoming' or 'live' status if possible.
        // Let's just update the most recent event.

        console.log('Updating stream URL for the latest event...');

        const result = await query(`
            UPDATE events 
            SET stream_key = $1 
            WHERE id = (SELECT id FROM events ORDER BY created_at DESC LIMIT 1)
            RETURNING id, title;
        `, [streamUrl]);

        if (result.rowCount > 0) {
            console.log(`✅ Updated event "${result.rows[0].title}" (ID: ${result.rows[0].id}) with new stream URL.`);
        } else {
            console.log('❌ No events found to update.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Update failed:', error);
        process.exit(1);
    }
}

updateStreamUrl();
