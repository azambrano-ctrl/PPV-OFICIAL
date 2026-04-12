// API base URL - update this to your server's IP/domain before building
// For local development use your machine's local network IP (e.g. http://192.168.1.100:5000)
// For production use your domain (e.g. https://api.yourdomain.com)
export const API_BASE_URL = __DEV__
    ? 'http://10.0.2.2:5000'   // Android emulator → host machine localhost
    : 'https://api.arenafightpass.com';

export const API_URL = `${API_BASE_URL}/api`;
export const UPLOADS_URL = `${API_BASE_URL}/uploads`;

export const getImageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${UPLOADS_URL}/${path}`;
};
