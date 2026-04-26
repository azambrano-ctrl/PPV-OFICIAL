require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        console.log("Fixing existing users free access...");

        // Find the event
        const events = await pool.query("SELECT id, title, free_viewers_limit FROM events WHERE title = 'TFL 014 REDENCION'");
        if (events.rows.length === 0) {
            console.log("Event not found");
            return;
        }

        const eventId = events.rows[0].id;
        console.log(`Giving access to event: ${events.rows[0].title} (${eventId})`);

        // Find all users who don't have a purchase for this event
        const usersWithoutAccess = await pool.query(`
            SELECT id FROM users u 
            WHERE NOT EXISTS (
                SELECT 1 FROM purchases p 
                WHERE p.user_id = u.id AND p.event_id = $1 AND p.payment_status = 'completed'
            )
        `, [eventId]);

        console.log(`Found ${usersWithoutAccess.rows.length} users without access.`);

        // Insert purchase for each
        let inserted = 0;
        for (const user of usersWithoutAccess.rows) {
            await pool.query(`
                INSERT INTO purchases (
                    user_id, event_id, amount, final_amount, payment_status, purchase_type
                ) VALUES (
                    $1, $2, 0, 0, 'completed', 'event'
                )
                ON CONFLICT (user_id, event_id) DO UPDATE SET
                    payment_status = 'completed',
                    amount = 0,
                    final_amount = 0
            `, [user.id, eventId]);
            inserted++;
        }

        console.log(`Inserted ${inserted} new free access records.`);

        // Final count
        const completedPurchases = await pool.query("SELECT COUNT(*) FROM purchases WHERE event_id = $1 AND payment_status = 'completed'", [eventId]);
        console.log(`Final completed purchases count for event ${eventId}:`, completedPurchases.rows[0].count);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
