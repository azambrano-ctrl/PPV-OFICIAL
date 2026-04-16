import { query } from '../config/database';
import logger from '../config/logger';
import { updateEventStatus } from './eventService';
import { CloudflareService } from './cloudflareService';
import { bunnyService } from './bunnyService';
import { muxService } from './muxService';
import { NewsAutomationService } from './newsAutomationService';

// ─────────────────────────────────────────────────────────────────────────────
// Timers (all values in milliseconds)
// ─────────────────────────────────────────────────────────────────────────────

/** How long a stream must stay disconnected before moving to REPRISE */
const DISCONNECT_CONFIRM_MS = 3 * 60 * 1000; // 3 minutes

/**
 * After moving to REPRISE due to signal loss, how long we keep watching
 * for a reconnection. If OBS reconnects within this window the event
 * automatically goes back to EN VIVO.
 */
const RECONNECT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// ─────────────────────────────────────────────────────────────────────────────
// In-memory state (survives between ticks, resets on server restart)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tracks the first moment a disconnection was detected (while event is LIVE).
 * Key: eventId  |  Value: timestamp of first disconnected tick
 * Cleared when: signal recovers, event moves to REPRISE, or server restarts.
 */
const disconnectedSince = new Map<string, number>();

/**
 * Tracks when an event was moved to REPRISE due to signal loss
 * (as opposed to a manual / duration-based REPRISE).
 * Key: eventId  |  Value: { movedAt: timestamp, cloudflare_stream_id: string }
 * While this entry exists we keep watching Cloudflare for a reconnection.
 * Cleared when: reconnection detected, window expires, or server restarts.
 */
const reprisedDueToSignalLoss = new Map<string, { movedAt: number; cloudflare_stream_id: string }>();

// ─────────────────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────────────────

export const startBackgroundService = () => {
    logger.info('🚀 Starting background event monitor...');

    // Main event loop — every 60 seconds
    setInterval(async () => {
        try {
            await Promise.all([
                handleUpcomingToLive(),
                handleLiveToReprise(),
                handleRepriseReconnection(),   // NEW: watches for OBS coming back
            ]);
        } catch (error) {
            logger.error('[BackgroundService] Error in monitor loop:', error);
        }
    }, 60000);

    // News update — every 4 hours
    setInterval(async () => {
        try {
            await NewsAutomationService.updateNews();
        } catch (error) {
            logger.error('[BackgroundService] Error in news automation loop:', error);
        }
    }, 4 * 60 * 60 * 1000);

    // Initial news update after a short delay
    setTimeout(() => {
        NewsAutomationService.updateNews().catch(err => {
            logger.error('[BackgroundService] Error in initial news update:', err);
        });
    }, 10000);
};

// ─────────────────────────────────────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Automatically move events from 'upcoming' → 'live' when their start time is reached
 */
async function handleUpcomingToLive() {
    try {
        const result = await query(`
            UPDATE events
            SET status = 'live'
            WHERE status = 'upcoming'
            AND event_date <= NOW()
            RETURNING id, title
        `);

        for (const event of result.rows) {
            logger.info(`[BackgroundService] Event "${event.title}" (${event.id}) is now LIVE.`);
        }
    } catch (error) {
        logger.error('[BackgroundService] Error updating upcoming to live:', error);
    }
}

/**
 * Move events from 'live' → 'reprise' when the stream signal is gone
 * or the event duration has been exceeded.
 *
 * For Cloudflare streams:
 *   - Signal must be gone for DISCONNECT_CONFIRM_MS (3 min) before acting.
 *   - When moved to REPRISE the event is registered in reprisedDueToSignalLoss
 *     so handleRepriseReconnection() can watch for OBS coming back.
 */
async function handleLiveToReprise() {
    try {
        const result = await query(`
            SELECT e.id, e.title, e.event_date, e.duration_minutes,
                   ls.cloudflare_stream_id, ls.bunny_live_stream_id, ls.mux_live_stream_id
            FROM events e
            LEFT JOIN live_streams ls ON e.id = ls.event_id
            WHERE e.status = 'live'
        `);

        for (const event of result.rows) {
            let shouldEnd = false;
            let reason = '';
            const now = Date.now();
            const startTime = new Date(event.event_date).getTime();
            const minutesSinceStart = (now - startTime) / (60 * 1000);

            try {
                if (event.cloudflare_stream_id) {
                    const cfStatusStr = await getCloudflareStatusStr(event.cloudflare_stream_id);

                    // Persist status in DB for visibility
                    await query(
                        'UPDATE live_streams SET status = $1 WHERE event_id = $2',
                        [cfStatusStr, event.id]
                    );

                    logger.info(`[BackgroundService] CF status for "${event.title}": "${cfStatusStr}"`);

                    const isDisconnected =
                        cfStatusStr.toLowerCase().includes('disconnected') ||
                        (minutesSinceStart > 5 && cfStatusStr.toLowerCase() === 'idle');

                    if (isDisconnected) {
                        if (!disconnectedSince.has(event.id)) {
                            disconnectedSince.set(event.id, now);
                            logger.info(
                                `[BackgroundService] "${event.title}" — signal lost, ` +
                                `waiting ${DISCONNECT_CONFIRM_MS / 60000} min before ending...`
                            );
                        }

                        const lostFor = now - disconnectedSince.get(event.id)!;
                        logger.info(
                            `[BackgroundService] "${event.title}" — disconnected for ` +
                            `${Math.round(lostFor / 1000)}s`
                        );

                        if (lostFor >= DISCONNECT_CONFIRM_MS) {
                            shouldEnd = true;
                            reason = `CF signal lost for ${Math.round(lostFor / 60000)} min (${cfStatusStr})`;
                        }
                    } else {
                        // Signal is back — clear any pending disconnect timer
                        if (disconnectedSince.has(event.id)) {
                            logger.info(
                                `[BackgroundService] "${event.title}" — signal recovered, ` +
                                `clearing disconnect timer.`
                            );
                            disconnectedSince.delete(event.id);
                        }
                    }

                } else if (event.bunny_live_stream_id) {
                    const bunnyStream = await bunnyService.getLiveStream(event.bunny_live_stream_id);
                    if (bunnyStream.Status !== 3 && minutesSinceStart > 15) {
                        shouldEnd = true;
                        reason = `Bunny stream disconnected (Status: ${bunnyStream.Status})`;
                    }
                } else if (event.mux_live_stream_id && !event.mux_live_stream_id.startsWith('mock_')) {
                    const muxStream = await muxService.getLiveStream(event.mux_live_stream_id);
                    if (muxStream.status !== 'active' && minutesSinceStart > 15) {
                        shouldEnd = true;
                        reason = `Mux stream inactive (${muxStream.status})`;
                    }
                } else {
                    // Manual URL — only use duration-based fallback
                    if (event.duration_minutes > 0) {
                        shouldEnd = checkIfDurationExceeded(event, 60);
                        if (shouldEnd) reason = 'Safety buffer exceeded for manual stream';
                    }
                }

                // Hard safety fallback for all streams (4 h after scheduled end)
                if (!shouldEnd && event.duration_minutes > 0 && checkIfDurationExceeded(event, 240)) {
                    shouldEnd = true;
                    reason = 'Duration greatly exceeded (4 h safety buffer)';
                }

            } catch (providerError) {
                logger.error(`[BackgroundService] Provider check failed for event ${event.id}:`, providerError);
                if (event.duration_minutes > 0) {
                    shouldEnd = checkIfDurationExceeded(event, 120);
                    if (shouldEnd) reason = 'Provider check failed — safety buffer exceeded';
                }
            }

            if (shouldEnd) {
                logger.info(`[BackgroundService] Moving "${event.title}" → REPRISE. Reason: ${reason}`);
                await updateEventStatus(event.id, 'reprise');
                await query(
                    "UPDATE live_streams SET status = 'completed' WHERE event_id = $1",
                    [event.id]
                );

                // Register in the reconnection watcher if it was a Cloudflare signal loss
                if (event.cloudflare_stream_id) {
                    reprisedDueToSignalLoss.set(event.id, {
                        movedAt: Date.now(),
                        cloudflare_stream_id: event.cloudflare_stream_id,
                    });
                    logger.info(
                        `[BackgroundService] "${event.title}" registered for reconnection watch ` +
                        `(${RECONNECT_WINDOW_MS / 60000} min window).`
                    );
                }

                disconnectedSince.delete(event.id);
            }
        }
    } catch (error) {
        logger.error('[BackgroundService] Error in handleLiveToReprise:', error);
    }
}

/**
 * After a Cloudflare stream moved to REPRISE due to signal loss,
 * watch for OBS reconnecting within RECONNECT_WINDOW_MS (10 min).
 * If signal comes back → move the event back to EN VIVO automatically.
 * If the window expires → remove from watch list (stays REPRISE).
 */
async function handleRepriseReconnection() {
    if (reprisedDueToSignalLoss.size === 0) return;

    for (const [eventId, info] of reprisedDueToSignalLoss.entries()) {
        const elapsed = Date.now() - info.movedAt;

        // Window expired — stop watching
        if (elapsed > RECONNECT_WINDOW_MS) {
            logger.info(
                `[BackgroundService] Reconnection window expired for event ${eventId} ` +
                `(${Math.round(elapsed / 60000)} min). Stays REPRISE.`
            );
            reprisedDueToSignalLoss.delete(eventId);
            continue;
        }

        // Verify the event is still in REPRISE (admin might have changed it manually)
        try {
            const eventRes = await query(
                'SELECT id, title, status FROM events WHERE id = $1',
                [eventId]
            );
            if (eventRes.rows.length === 0 || eventRes.rows[0].status !== 'reprise') {
                reprisedDueToSignalLoss.delete(eventId);
                continue;
            }

            const cfStatusStr = await getCloudflareStatusStr(info.cloudflare_stream_id);
            const isConnected = cfStatusStr.toLowerCase().includes('connected') &&
                !cfStatusStr.toLowerCase().includes('disconnected');

            if (isConnected) {
                const eventTitle = eventRes.rows[0].title;
                logger.info(
                    `[BackgroundService] 🔄 "${eventTitle}" — OBS reconnected! ` +
                    `Moving back to EN VIVO. (CF status: ${cfStatusStr})`
                );

                await updateEventStatus(eventId, 'live');
                await query(
                    "UPDATE live_streams SET status = 'active' WHERE event_id = $1",
                    [eventId]
                );

                reprisedDueToSignalLoss.delete(eventId);
                // Also clear any stale disconnect timer
                disconnectedSince.delete(eventId);
            } else {
                logger.info(
                    `[BackgroundService] Watching for reconnection on event ${eventId} ` +
                    `(${Math.round(elapsed / 60000)}/${RECONNECT_WINDOW_MS / 60000} min) ` +
                    `— CF: ${cfStatusStr}`
                );
            }
        } catch (err) {
            logger.error(`[BackgroundService] Error checking reconnection for ${eventId}:`, err);
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a Cloudflare live input and return its status as a normalized string.
 * Cloudflare may return status as a plain string OR as a nested object like
 * { current: { state: 'disconnected', reason: '' }, history: [...] }
 */
async function getCloudflareStatusStr(cloudflareStreamId: string): Promise<string> {
    const cfInput = await CloudflareService.getLiveInput(cloudflareStreamId);
    const raw = cfInput.status;

    if (raw === null || raw === undefined) return 'idle';
    if (typeof raw === 'object') {
        return (raw as any).current?.state
            ?? (raw as any).state
            ?? JSON.stringify(raw);
    }
    return String(raw);
}

/**
 * Returns true if the event's scheduled duration + bufferMinutes has passed.
 */
function checkIfDurationExceeded(event: any, bufferMinutes: number = 30): boolean {
    if (!event.duration_minutes) return false;

    const startTime  = new Date(event.event_date).getTime();
    const durationMs = (event.duration_minutes || 180) * 60 * 1000;
    const bufferMs   = bufferMinutes * 60 * 1000;

    return Date.now() > startTime + durationMs + bufferMs;
}
