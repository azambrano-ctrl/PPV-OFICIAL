import { io, Socket } from 'socket.io-client';

// Force direct backend connection for Socket.io to bypass Next.js proxy limitations
const getWsUrl = () => {
    // Si estamos en producción y en el dominio principal, forzar el backend directo de Render
    // ya que el proxy de sockets puede fallar en el dominio personalizado.
    if (typeof window !== 'undefined' && window.location.hostname.includes('arenafightpass.com')) {
        return 'https://ppv-backend.onrender.com';
    }

    return process.env.NEXT_PUBLIC_WS_URL || 'https://ppv-backend.onrender.com';
};

const WS_URL = getWsUrl();

let socket: Socket | null = null;

export const initSocket = (token: string): Socket => {
    if (socket?.connected) {
        return socket;
    }

    socket = io(WS_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    return socket;
};

export const getSocket = (): Socket | null => {
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

// Chat helpers
export const joinEventRoom = (eventId: string) => {
    socket?.emit('join_event', eventId);
};

export const leaveEventRoom = (eventId: string) => {
    socket?.emit('leave_event', eventId);
};

export const sendMessage = (eventId: string, message: string) => {
    socket?.emit('send_message', { eventId, message });
};

export const sendReaction = (eventId: string, emoji: string) => {
    socket?.emit('send_reaction', { eventId, emoji });
};

export const onMessage = (callback: (data: any) => void) => {
    socket?.on('new_message', callback);
};

export const onJoinedEvent = (callback: (data: any) => void) => {
    socket?.on('joined_event', callback);
};

export const offMessage = () => {
    socket?.off('new_message');
};

export const offJoinedEvent = () => {
    socket?.off('joined_event');
};
