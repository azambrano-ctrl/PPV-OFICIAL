import { query } from '../config/database';
import logger from '../config/logger';
import { updateEventStatus } from './eventService';
import { CloudflareService } from './cloudflareService';
import { bunnyService } from './bunnyService';
import { muxService } from './muxService';
import { NewsAutomationService } from './newsAutomationService';

/**
 * Background Service to handle automatic event status transitions
 */
export const startBackgroundService = () => {
    logger.info('🚀 Starting background event monitor...');

    // Run every 60 seconds for events
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

    // Run news update every 4 hours
    setInterval(async () => {
        try {
            await NewsAutomationService.updateNews();
        } catch (error) {
            logger.error('[BackgroundService] Error in news automation loop:', error);
        }
    }, 4 * 60 * 60 * 1000);

    // Run once on startup after a short delay
    setTimeout(() => {
        NewsAutomationService.updateNews().catch(err => {
            logger.error('[BackgroundService] Error in initial news update:', err);
        });
    }, 10000);
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

                    // Cloudflare can return status as a string OR as an object like
                    // { current: { state: 'disconnected', reason: '' }, history: [...] }
                    // We normalize it to a plain string for DB storage and comparison.
                    const cfStatusRaw = cfInput.status;
                    let cfStatusStr: string;
                    if (cfStatusRaw === null || cfStatusRaw === undefined) {
                        cfStatusStr = 'idle';
                    } else if (typeof cfStatusRaw === 'object') {
                        // Extract nested state if available, otherwise JSON stringify
                        cfStatusStr = (cfStatusRaw as any).current?.state
                            ?? (cfStatusRaw as any).state
                            ?? JSON.stringify(cfStatusRaw);
                    } else {
                        cfStatusStr = String(cfStatusRaw);
                    }

                    // Update live_streams status in DB for visibility
                    await query('UPDATE live_streams SET status = $1 WHERE event_id = $2', [cfStatusStr, event.id]);

                    logger.info(`[BackgroundService] Cloudflare status for event ${event.id}: "${cfStatusStr}"`);

                    // End the stream as soon as Cloudflare reports it's no longer connected.
                    // We check 'disconnected' and also 'idle' (never/no longer receiving signal).
                    // No time guard — react immediately when the signal drops.
                    const isDisconnected = cfStatusStr.toLowerCase().includes('disconnected')
                        || (minutesSinceStart > 5 && cfStatusStr.toLowerCase() === 'idle');

                    if (isDisconnected) {
                        shouldEnd = true;
                        reason = `Cloudflare signal lost (status: ${cfStatusStr})`;
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
                    // No provider tracking (manual URL), we DO NOT automatically cut it.
                    // The admin must manually end the stream or the event duration must strictly pass.
                    if (event.duration_minutes > 0) {
                        shouldEnd = checkIfDurationExceeded(event, 60);
                        if (shouldEnd) reason = 'Safety buffer exceeded for manual stream with set duration';
                    }
                }

                // Safety Fallback for provider streams
                if (!shouldEnd && event.duration_minutes > 0 && checkIfDurationExceeded(event, 240)) {
                    shouldEnd = true;
                    reason = 'Duration greatly exceeded (4h safety buffer)';
                }

            } catch (providerError) {
                logger.error(`[BackgroundService] Error checking provider for event ${event.id}:`, providerError);
                // Fallback to duration check if provider check fails
                if (event.duration_minutes > 0) {
                    shouldEnd = checkIfDurationExceeded(event, 120);
                    if (shouldEnd) reason = 'Provider check failed and safety buffer exceeded';
                }
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
    if (event.duration_minutes === 0) return false;

    const startTime = new Date(event.event_date).getTime();
    const durationMs = (event.duration_minutes || 180) * 60 * 1000;
    const bufferMs = bufferMinutes * 60 * 1000;
    const now = Date.now();

    return now > (startTime + durationMs + bufferMs);
}
