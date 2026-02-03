import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../config/logger';

dotenv.config();

const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
const BASE_URL = 'https://video.bunnycdn.com';

const bunnyClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'AccessKey': BUNNY_API_KEY || '',
        'Content-Type': 'application/json',
        'accept': 'application/json'
    }
});

// Logging connection info (masked)
console.log('[BunnyService] Initialized with Library ID:', BUNNY_LIBRARY_ID);
if (BUNNY_API_KEY) {
    console.log('[BunnyService] API Key provided (starts with:', BUNNY_API_KEY.substring(0, 4) + '...)');
} else {
    console.warn('[BunnyService] NO API KEY PROVIDED');
}

export const bunnyService = {
    /**
     * Creates a new live stream in Bunny.net
     */
    async createLiveStream(title: string) {
        if (!process.env.BUNNY_API_KEY || !process.env.BUNNY_LIBRARY_ID) {
            console.error('Missing Bunny.net configuration (API Key or Library ID)');
            if (process.env.NODE_ENV === 'development') {
                return {
                    bunnyLiveStreamId: 'mock_bunny_' + Date.now(),
                    streamKey: 'mock_stream_key_' + Date.now(),
                    rtmpUrl: 'rtmp://video-ingest.bunnycdn.com/app',
                    playbackId: 'mock_playback_' + Date.now(),
                };
            }
            throw new Error('Configuración de Bunny.net incompleta (BUNNY_API_KEY o BUNNY_LIBRARY_ID faltante)');
        }

        try {
            console.log('Creating Bunny.net live stream:', title);

            const response = await bunnyClient.post(`/library/${BUNNY_LIBRARY_ID}/liveStreams`, {
                name: title
            });

            const stream = response.data;
            logger.info('Bunny.net live stream created', { streamId: stream.id });
            console.log('Bunny Stream created:', stream.id);

            // Bunny response for live streams usually includes:
            // id, name, streamKey, status, etc.
            // Note: Ingest URL is usually rtmp://video-ingest.bunnycdn.com/app

            return {
                bunnyLiveStreamId: stream.id,
                streamKey: stream.streamKey,
                rtmpUrl: 'rtmp://video-ingest.bunnycdn.com/app',
                playbackId: stream.id, // In Bunny, the video/stream ID is used in the URL
            };
        } catch (error: any) {
            console.error('Bunny.net API Error:', error.response?.data || error.message);
            logger.error('Error creating Bunny.net live stream:', error);

            // Fallback to mock for testing if needed
            if (process.env.NODE_ENV === 'development') {
                return {
                    bunnyLiveStreamId: 'mock_bunny_' + Date.now(),
                    streamKey: 'mock_stream_key_' + Date.now(),
                    rtmpUrl: 'rtmp://video-ingest.bunnycdn.com/app',
                    playbackId: 'mock_playback_' + Date.now(),
                };
            }
            throw error;
        }
    },

    /**
     * Get live stream details
     */
    async getLiveStream(streamId: string) {
        try {
            const response = await bunnyClient.get(`/library/${BUNNY_LIBRARY_ID}/liveStreams/${streamId}`);
            return response.data;
        } catch (error) {
            logger.error('Error retrieving Bunny.net live stream:', error);
            throw error;
        }
    },

    /**
     * Delete a live stream
     */
    async deleteLiveStream(streamId: string) {
        try {
            await bunnyClient.delete(`/library/${BUNNY_LIBRARY_ID}/liveStreams/${streamId}`);
            logger.info('Bunny.net live stream deleted', { streamId });
        } catch (error) {
            logger.error('Error deleting Bunny.net live stream:', error);
            throw error;
        }
    }
};
