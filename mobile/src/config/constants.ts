import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(':')[0] || 'localhost';

export const API_BASE_URL = `http://${localhost}:5000`;
export const API_URL = `${API_BASE_URL}/api`;
export const UPLOADS_URL = `${API_BASE_URL}/uploads`;

export const getImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${UPLOADS_URL}/${path}`;
};
