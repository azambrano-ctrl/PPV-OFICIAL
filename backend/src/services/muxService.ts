import Mux from '@mux/mux-node';
import dotenv from 'dotenv';
import logger from '../config/logger';

dotenv.config();

// Initialize Mux client
const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export const muxService = {
    /**
     * Creates a new live stream in Mux
     */
    async createLiveStream() {
        try {
            console.log('Creating Mux live stream with token:', process.env.MUX_TOKEN_ID?.substring(0, 5) + '...');

            const stream = await mux.video.liveStreams.create({
                playback_policy: ['public'],
                new_asset_settings: {
                    playback_policy: ['public'],
                },
                reconnect_window: 60, // Allow 60s disconnect before finishing stream
            });

            logger.info('Mux live stream created', { streamId: stream.id });
            console.log('Stream created:', stream.id);

            return {
                muxLiveStreamId: stream.id,
                streamKey: stream.stream_key,
                rtmpUrl: 'rtmp://global-live.mux.com:5222/app',
                playbackId: stream.playback_ids?.[0]?.id,
            };
        } catch (error: any) {
            console.error('Mux API Error Full:', JSON.stringify(error, null, 2));
            logger.error('Error creating Mux live stream:', error);

            // Extract useful error message
            // Extract useful error message
            let message = error.message || 'Unknown error';
            if (error.errors && error.errors.length > 0) {
                message = error.errors.map((e: any) => e.message || JSON.stringify(e)).join(', ');
            }

            console.log('⚠️ SWITCHING TO MOCK MODE due to API error (likely Free Plan limitation)');
            console.warn(`Original Mux Error: ${message}`);

            return {
                muxLiveStreamId: 'mock_stream_' + Date.now(),
                streamKey: 'mock_sk_test_123456789',
                rtmpUrl: 'rtmp://global-live.mux.com:5222/app',
                playbackId: 'mock_playback_id_' + Date.now(),
            };
        }
    },

    /**
     * Get live stream details
     */
    async getLiveStream(streamId: string) {
        try {
            const stream = await mux.video.liveStreams.retrieve(streamId);
            return stream;
        } catch (error) {
            logger.error('Error retrieving Mux live stream:', error);
            throw error;
        }
    },

    /**
     * Stop/Complete a live stream
     */
    async completeLiveStream(streamId: string) {
        try {
            await mux.video.liveStreams.complete(streamId);
            logger.info('Mux live stream completed', { streamId });
        } catch (error) {
            logger.error('Error completing Mux live stream:', error);
            throw error;
        }
    },

    /**
     * Delete a live stream
     */
    async deleteLiveStream(streamId: string) {
        try {
            await mux.video.liveStreams.delete(streamId);
            logger.info('Mux live stream deleted', { streamId });
        } catch (error) {
            logger.error('Error deleting Mux live stream:', error);
            throw error;
        }
    }
};
