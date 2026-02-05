import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../config/logger';

dotenv.config();

// Log the account ID being used (for debugging)
console.log('[CloudflareService] CLOUDFLARE_ACCOUNT_ID:', process.env.CLOUDFLARE_ACCOUNT_ID);

const getBaseUrl = () => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`;
    console.log('[CloudflareService] Base URL:', url);
    return url;
};

const getCfClient = () => axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
    },
});

export const cloudflareService = {
    /**
     * Creates a new live input in Cloudflare Stream
     */
    async createLiveInput(name: string) {
        try {
            console.log('[CloudflareService] Creating live input:', name);
            const cfClient = getCfClient();
            const response = await cfClient.post('/live_inputs', {
                meta: { name },
                recording: {
                    mode: 'automatic',
                    timeout_seconds: 60,
                    delete_recording_after_days: 7
                }
            });

            const data = response.data.result;

            if (!data || !data.uid) {
                throw new Error('Invalid response from Cloudflare API: missing uid');
            }

            if (!data.rtmps || !data.rtmps.streamKey || !data.rtmps.url) {
                console.error('[CloudflareService] Incomplete rtmps data:', data);
                throw new Error('Invalid response from Cloudflare API: missing rtmps credentials');
            }

            logger.info('Cloudflare live input created', { uid: data.uid });
            console.log('[CloudflareService] Input created:', data.uid);

            return {
                cloudflareStreamId: data.uid,
                streamKey: data.rtmps.streamKey,
                rtmpUrl: data.rtmps.url,
                playbackId: data.uid, // Cloudflare uses UID for HLS playback URLs
                hlsUrl: `https://customer-${process.env.CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${data.uid}/manifest/video.m3u8`
            };
        } catch (error: any) {
            console.error('[CloudflareService] API Error:', error.response?.data || error.message);
            logger.error('Error creating Cloudflare live input:', error);
            throw error;
        }
    },

    /**
     * Get live input details
     */
    async getLiveInput(uid: string) {
        try {
            const cfClient = getCfClient();
            const response = await cfClient.get(`/live_inputs/${uid}`);
            return response.data.result;
        } catch (error: any) {
            logger.error('Error retrieving Cloudflare live input:', error);
            throw error;
        }
    },

    /**
     * Delete a live input
     */
    async deleteLiveInput(uid: string) {
        try {
            const cfClient = getCfClient();
            await cfClient.delete(`/live_inputs/${uid}`);
            logger.info('Cloudflare live input deleted', { uid });
        } catch (error: any) {
            logger.error('Error deleting Cloudflare live input:', error);
            throw error;
        }
    }
};
