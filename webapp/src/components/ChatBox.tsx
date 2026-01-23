'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, User, Shield, Info } from 'lucide-react';

interface Message {
    id: string;
    user: string;
    message: string;
    timestamp: Date;
    isAdmin?: boolean;
}

interface ChatBoxProps {
    eventId: string;
    eventTitle: string;
}

export default function ChatBox({ eventId, eventTitle }: ChatBoxProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [username, setUsername] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isAutoScroll, setIsAutoScroll] = useState(true);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        if (isAutoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isAutoScroll]);

    // Detect if user scrolled up to stop auto-scroll
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isBottom = scrollHeight - scrollTop === clientHeight;
        setIsAutoScroll(isBottom);
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Get user info from localStorage
        const token = localStorage.getItem('accessToken');
        const userStr = localStorage.getItem('user');

        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUsername(user.full_name || user.email || 'Anonymous');
            } catch (e) {
                setUsername('Anonymous');
            }
        }

        if (!token) return;

        // Connect to Socket.io
        const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
            auth: {
                token,
            },
        });

        socketInstance.on('connect', () => {
            setIsConnected(true);
            console.log('Connected to chat');

            // Join the event room
            socketInstance.emit('join_event', eventId);
        });

        socketInstance.on('disconnect', () => {
            setIsConnected(false);
            console.log('Disconnected from chat');
        });

        socketInstance.on('joined_event', (data: { eventId: string }) => {
            console.log('Joined event room:', data.eventId);
        });

        socketInstance.on('new_message', (messageData: any) => {
            const message: Message = {
                id: messageData.id,
                user: messageData.user_name,
                message: messageData.message,
                timestamp: new Date(messageData.created_at),
                isAdmin: false, // TODO: Add admin check
            };
            setMessages((prev) => [...prev, message]);
        });

        socketInstance.on('error', (err: any) => {
            console.error('Socket error:', err);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.emit('leave_event', eventId);
            socketInstance.disconnect();
        };
    }, [eventId]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || !socket || !isConnected) return;

        socket.emit('send_message', {
            eventId,
            message: newMessage.trim(),
        });

        setNewMessage('');
        setIsAutoScroll(true); // Force scroll to bottom on send
    };

    return (
        <div className="flex flex-col h-full bg-black/40 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                    <span className="font-semibold text-white tracking-wide">CHAT EN VIVO</span>
                </div>
                {!isConnected && (
                    <span className="text-xs text-red-400 font-medium">Desconectado</span>
                )}
            </div>

            {/* Messages Area */}
            <div
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                onScroll={handleScroll}
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-2">
                        <Info className="w-8 h-8" />
                        <p className="text-sm">¡Sé el primero en comentar!</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={msg.id || idx} className={`flex gap-3 animate-fade-in`}>
                            {/* Avatar placeholder */}
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${msg.isAdmin ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white' : 'bg-white/10 text-white/70'
                                }`}>
                                {msg.isAdmin ? <Shield className="w-4 h-4" /> : (msg.user[0] || '?').toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`text-sm font-medium ${msg.isAdmin ? 'text-primary-400' : 'text-white/90'}`}>
                                        {msg.user}
                                    </span>
                                    {msg.isAdmin && (
                                        <span className="text-[10px] bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded border border-primary-500/30">
                                            MOD
                                        </span>
                                    )}
                                    <span className="text-[10px] text-white/30 ml-auto">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-sm text-white/80 break-words leading-relaxed">
                                    {msg.message}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/5 border-t border-white/10">
                <form onSubmit={sendMessage} className="relative">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isConnected ? "Escribe un mensaje..." : "Conectando..."}
                        disabled={!isConnected}
                        maxLength={200}
                        className="w-full bg-black/40 border border-white/10 rounded-full py-3 pl-4 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!isConnected || !newMessage.trim()}
                        className="absolute right-1.5 top-1.5 p-1.5 bg-primary-600 rounded-full text-white hover:bg-primary-500 disabled:opacity-0 disabled:pointer-events-none transition-all"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-white/30">
                        Chattings es <span className="text-white/50">{username}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
