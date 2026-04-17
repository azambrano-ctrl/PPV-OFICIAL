import Constants from 'expo-constants';

// Production API URL - change this to your deployed backend URL
const PRODUCTION_API_URL = 'https://ppv-backend.onrender.com';

// Dev: use Expo debugger host to get local IP
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(':')[0] || 'localhost';
const DEV_API_URL = `http://${localhost}:5000`;

// Auto-select based on environment
export const API_BASE_URL = __DEV__ ? DEV_API_URL : PRODUCTION_API_URL;
export const API_URL = `${API_BASE_URL}/api`;
export const UPLOADS_URL = `${API_BASE_URL}/uploads`;

export const getImageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${UPLOADS_URL}/${path}`;
};
