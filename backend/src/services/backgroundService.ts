import { query } from '../config/database';
import logger from '../config/logger';
import { updateEventStatus } from './eventService';
import { CloudflareService } from './cloudflareService';
import { bunnyService } from './bunnyService';
import { muxService } from './muxService';

/**
 * Background Service to handle automatic event status transitions
 */
export const startBackgroundService = () => {
    logger.info('🚀 Starting background event monitor...');

    // Run every 60 seconds
    setInterval(async () => {
        try {
            await Promise.all([
                handleUpcomingToLive(),
                handleLiveToReprise()
            ]);
        } catch (error) {
            logger.error('[BackgroundService] Error in monitor loop:', error);
        }
    }, 60000);
};

/**
 * Automatically move events from 'upcoming' to 'live' when their start time is reached
 */
async function handleUpcomingToLive() {
    try {
        const sql = `
            UPDATE events 
            SET status = 'live' 
            WHERE status = 'upcoming' 
            AND event_date <= NOW() 
            RETURNING id, title
        `;
        const result = await query(sql);

        if (result.rows.length > 0) {
            result.rows.forEach((event: any) => {
                logger.info(`[BackgroundService] Event "${event.title}" (${event.id}) is now LIVE.`);
            });
        }
    } catch (error) {
        logger.error('[BackgroundService] Error updating upcoming to live:', error);
    }
}

/**
 * Automatically move events from 'live' to 'reprise' or 'finished'
 * based on stream status or event duration
 */
async function handleLiveToReprise() {
    try {
        // Find live events
        const sql = `
            SELECT e.id, e.title, e.event_date, e.duration_minutes, ls.cloudflare_stream_id, ls.bunny_live_stream_id, ls.mux_live_stream_id
            FROM events e
            LEFT JOIN live_streams ls ON e.id = ls.event_id
            WHERE e.status = 'live'
        `;
        const result = await query(sql);

        for (const event of result.rows) {
            let shouldEnd = false;
            let reason = '';
            const now = Date.now();
            const startTime = new Date(event.event_date).getTime();
            const minutesSinceStart = (now - startTime) / (60 * 1000);

            // Check if stream is disconnected from providers
            try {
                if (event.cloudflare_stream_id) {
                    const cfInput = await CloudflareService.getLiveInput(event.cloudflare_stream_id);
                    // Update live_streams status in DB for visibility
                    await query('UPDATE live_streams SET status = $1 WHERE event_id = $2', [cfInput.status, event.id]);

                    if (cfInput.status === 'disconnected') {
                        // If Cloudflare says disconnected, and we've been live for at least 15 minutes
                        // (setup buffer), we switch to reprise.
                        if (minutesSinceStart > 15) {
                            shouldEnd = true;
                            reason = 'Cloudflare reported disconnected (Stream ended)';
                        }
                    }
                } else if (event.bunny_live_stream_id) {
                    const bunnyStream = await bunnyService.getLiveStream(event.bunny_live_stream_id);
                    // Bunny status: 3 is live/connected, others are idle/disconnected
                    if (bunnyStream.Status !== 3) {
                        if (minutesSinceStart > 15) {
                            shouldEnd = true;
                            reason = 'Bunny stream disconnected (Status: ' + bunnyStream.Status + ')';
                        }
                    }
                } else if (event.mux_live_stream_id && !event.mux_live_stream_id.startsWith('mock_')) {
                    const muxStream = await muxService.getLiveStream(event.mux_live_stream_id);
                    if (muxStream.status !== 'active') {
                        if (minutesSinceStart > 15) {
                            shouldEnd = true;
                            reason = 'Mux stream inactive (Status: ' + muxStream.status + ')';
                        }
                    }
                } else {
                    // No provider tracking (manual URL), check by duration + 1 hour buffer (decreased from 2h)
                    shouldEnd = checkIfDurationExceeded(event, 60);
                    if (shouldEnd) reason = 'No stream detected and safety duration buffer exceeded';
                }

                // Safety Fallback: Even if provider says connected, if duration is GREATLY exceeded (extra 4 hours), end it.
                if (!shouldEnd && checkIfDurationExceeded(event, 240)) {
                    shouldEnd = true;
                    reason = 'Duration greatly exceeded (4h safety buffer)';
                }

            } catch (providerError) {
                logger.error(`[BackgroundService] Error checking provider for event ${event.id}:`, providerError);
                // Fallback to duration check if provider check fails
                shouldEnd = checkIfDurationExceeded(event, 120);
                if (shouldEnd) reason = 'Provider check failed and safety buffer exceeded';
            }

            if (shouldEnd) {
                logger.info(`[BackgroundService] Moving event "${event.title}" to REPRISE. Reason: ${reason}`);
                await updateEventStatus(event.id, 'reprise');

                // Also update live_stream status in DB
                await query('UPDATE live_streams SET status = $1 WHERE event_id = $2', ['completed', event.id]);
            }
        }
    } catch (error) {
        logger.error('[BackgroundService] Error updating live to reprise:', error);
    }
}

/**
 * Helper to check if event duration has been exceeded with an optional buffer
 */
function checkIfDurationExceeded(event: any, bufferMinutes: number = 30): boolean {
    const startTime = new Date(event.event_date).getTime();
    const durationMs = (event.duration_minutes || 180) * 60 * 1000;
    const bufferMs = bufferMinutes * 60 * 1000;
    const now = Date.now();

    return now > (startTime + durationMs + bufferMs);
}
