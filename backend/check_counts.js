require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        console.log("Checking database counts...");

        // Find the event with free viewers limit
        const events = await pool.query("SELECT id, title, free_viewers_limit FROM events WHERE free_viewers_limit > 0");
        console.log("Events with free limits:", events.rows);

        if (events.rows.length > 0) {
            const eventId = events.rows[0].id;

            // Count purchases for this event
            const purchases = await pool.query("SELECT COUNT(*) FROM purchases WHERE event_id = $1", [eventId]);
            console.log(`Total purchases for event ${eventId}:`, purchases.rows[0].count);

            const completedPurchases = await pool.query("SELECT COUNT(*) FROM purchases WHERE event_id = $1 AND payment_status = 'completed'", [eventId]);
            console.log(`Completed purchases for event ${eventId}:`, completedPurchases.rows[0].count);

            // Count all season passes
            const seasonPasses = await pool.query("SELECT COUNT(*) FROM purchases WHERE purchase_type = 'season_pass' AND payment_status = 'completed'");
            console.log("Total valid season passes:", seasonPasses.rows[0].count);

            // Group purchases by type and amount
            const purchaseTypes = await pool.query("SELECT purchase_type, payment_status, amount, COUNT(*) FROM purchases GROUP BY purchase_type, payment_status, amount");
            console.log("Purchase types:", purchaseTypes.rows);

            // Check users total
            const users = await pool.query("SELECT COUNT(*) FROM users");
            console.log("Total users:", users.rows[0].count);
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
