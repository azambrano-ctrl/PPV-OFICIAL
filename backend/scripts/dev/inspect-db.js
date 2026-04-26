const { query } = require('./dist/config/database');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function inspect() {
    try {
        console.log('--- Settings Table Inspection (using dist) ---');
        // Get all rows from settings
        const result = await query('SELECT id, site_name, paypal_client_id, paypal_enabled, paypal_secret_key FROM settings');
        console.log(`Found ${result.rows.length} rows:`);

        result.rows.forEach((row, i) => {
            console.log(`[${i}] ID: ${row.id}`);
            console.log(`    Site Name: ${row.site_name}`);
            console.log(`    PayPal Enabled: ${row.paypal_enabled}`);
            console.log(`    Client ID: ${row.paypal_client_id ? row.paypal_client_id.substring(0, 10) + '...' : 'MISSING'}`);
            console.log(`    Secret Key: ${row.paypal_secret_key ? 'PRESENT (first 5: ' + row.paypal_secret_key.substring(0, 5) + ')' : 'MISSING'}`);
        });

        if (result.rows.length > 0) {
            console.log('\n--- Checking row 0 ID in detail ---');
            const targetId = '00000000-0000-0000-0000-000000000001';
            const target = result.rows.find(r => r.id === targetId);
            if (target) {
                console.log(`MATCH: Settings with ID ${targetId} exists.`);
            } else {
                console.error(`MISSING: No settings row found with ID ${targetId}. This will cause 500 errors in backend!`);
            }
        }

    } catch (error) {
        console.error('INSPECTION FAILED:', error.stack);
    } finally {
        process.exit();
    }
}

inspect();
