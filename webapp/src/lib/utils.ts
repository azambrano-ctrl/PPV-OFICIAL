import { format, formatDistanceToNow, isPast, isFuture, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Get full URL for uploaded images
 */
export function getImageUrl(relativePath?: string | null): string | undefined {
    if (!relativePath) return undefined;
    if (relativePath.startsWith('http')) return relativePath;

    // Ensure relative paths start with /
    const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

    // If it's a public image (e.g. in /images/ folder in webapp/public), return path as is for Next.js
    if (cleanPath.startsWith('/images/')) {
        return cleanPath;
    }

    // If it's a local upload, ensure it goes through the /uploads/ proxy
    const finalPath = cleanPath.startsWith('/uploads/') ? cleanPath : `/uploads${cleanPath}`;

    return `${API_URL}${finalPath}`;
}

/**
 * Format date for display
 */
export const formatDate = (date: string | Date, formatStr: string = 'PPP'): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: es });
};

/**
 * Format date and time
 */
export const formatDateTime = (date: string | Date): string => {
    return formatDate(date, "PPP 'a las' p");
};

/**
 * Format relative time (e.g., "hace 2 horas")
 */
export const formatRelative = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: es });
};

/**
 * Check if event is live
 */
export const isEventLive = (eventDate: string, durationMinutes: number = 180): boolean => {
    const start = parseISO(eventDate);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const now = new Date();

    return now >= start && now <= end;
};

/**
 * Check if event is urgent (less than 24h away)
 */
export const isEventUrgent = (eventDate: string): boolean => {
    const start = parseISO(eventDate);
    const now = new Date();
    const hours24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return isFuture(start) && start <= hours24;
};

/**
 * Check if event is upcoming
 */
export const isEventUpcoming = (eventDate: string): boolean => {
    return isFuture(parseISO(eventDate));
};

/**
 * Check if event is finished
 */
export const isEventFinished = (eventDate: string, durationMinutes: number = 180): boolean => {
    const end = new Date(parseISO(eventDate).getTime() + durationMinutes * 60000);
    return isPast(end);
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
};

/**
 * Truncate text
 */
export const truncate = (text: string, length: number = 100): string => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
};

/**
 * Get event status badge color
 */
export const getEventStatusColor = (status: string): string => {
    const s = (status || '').toLowerCase();
    const colors: Record<string, string> = {
        upcoming: 'badge-info',
        live: 'badge-success',
        finished: 'badge-warning',
        cancelled: 'badge-danger',
        reprise: 'badge-info',
        draft: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };
    return colors[s] || 'badge-info';
};

/**
 * Get event status text
 */
export const getEventStatusText = (status: string): string => {
    const texts: Record<string, string> = {
        upcoming: 'Próximamente',
        live: 'En Vivo',
        finished: 'Finalizado',
        cancelled: 'Cancelado',
        reprise: 'Reprise',
        draft: 'Borrador (Solo Admin)',
    };
    return texts[status] || status;
};

/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

/**
 * Generate initials from name
 */
export const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
};

/**
 * Sleep utility
 */
export const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy:', error);
        return false;
    }
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

/**
 * Class names helper
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
    return classes.filter(Boolean).join(' ');
};
