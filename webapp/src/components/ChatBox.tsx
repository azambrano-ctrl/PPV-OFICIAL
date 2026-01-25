'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, User, Shield, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    user: string;
    message: string;
    timestamp: Date;
    isAdmin?: boolean;
    isDeleted?: boolean;
}

interface ChatBoxProps {
    eventId: string;
    eventTitle: string;
}

const COMMON_EMOJIS = ['🔥', '🥊', '👏', '🙌', '💪', '🤩', '🎯', '⚡', '💣', '😎', '👑', '💯', '💀', '👽', '😤', '🍿'];

export default function ChatBox({ eventId, eventTitle }: ChatBoxProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [username, setUsername] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
        const isBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 1;
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
                setIsAdmin(user.role === 'admin');
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
            socketInstance.emit('join_event', eventId);
        });

        socketInstance.on('disconnect', () => {
            setIsConnected(false);
            console.log('Disconnected from chat');
        });

        socketInstance.on('new_message', (messageData: any) => {
            const message: Message = {
                id: messageData.id,
                user: messageData.user_name,
                message: messageData.message,
                timestamp: new Date(messageData.created_at),
                isAdmin: messageData.role === 'admin',
                isDeleted: messageData.is_deleted || false,
            };
            setMessages((prev) => {
                const updated = [...prev, message];
                return updated.slice(-100); // Only keep the last 100 messages
            });
        });

        socketInstance.on('message_deleted', ({ messageId }: { messageId: string }) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === messageId ? { ...msg, isDeleted: true } : msg
                )
            );
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
        setShowEmojiPicker(false);
        setIsAutoScroll(true);
    };

    const deleteMessage = (messageId: string) => {
        if (!socket || !isConnected || !isAdmin) return;
        if (window.confirm('¿Estás seguro de que deseas eliminar este mensaje?')) {
            socket.emit('delete_message', { eventId, messageId });
        }
    };

    const addEmoji = (emoji: string) => {
        setNewMessage(prev => prev + emoji);
    };

    return (
        <div className="flex flex-col h-full bg-black/40 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden shadow-2xl relative">
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
                        <p className="text-sm px-10 text-center">¡Sé el primero en comentar! Mantén el respeto en la comunidad.</p>
                    </div>
                ) : (
                    messages.filter(m => !m.isDeleted || isAdmin).map((msg, idx) => (
                        <div key={msg.id || idx} className={`flex gap-3 animate-fade-in ${msg.isDeleted ? 'opacity-40 grayscale' : ''}`}>
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
                                    {isAdmin && !msg.isDeleted && (
                                        <button
                                            onClick={() => deleteMessage(msg.id)}
                                            className="text-white/30 hover:text-red-500 transition-colors"
                                            title="Eliminar mensaje"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-white/80 break-words leading-relaxed">
                                    {msg.isDeleted ? (
                                        <span className="italic">Este mensaje fue eliminado por un moderador.</span>
                                    ) : (
                                        msg.message
                                    )}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Emoji Quick Picker */}
            <AnimatePresence>
                {showEmojiPicker && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-24 left-4 right-4 bg-dark-900 border border-white/10 rounded-xl p-3 shadow-2xl z-20 grid grid-cols-8 gap-2"
                    >
                        {COMMON_EMOJIS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => addEmoji(emoji)}
                                className="text-xl hover:scale-125 transition-transform p-1"
                            >
                                {emoji}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-4 bg-white/5 border-t border-white/10">
                <form onSubmit={sendMessage} className="relative">
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 text-xl hover:scale-110 transition-transform ${showEmojiPicker ? 'grayscale-0' : 'grayscale opacity-70'}`}
                    >
                        😊
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isConnected ? "Escribe un mensaje..." : "Conectando..."}
                        disabled={!isConnected}
                        maxLength={200}
                        className="w-full bg-black/40 border border-white/10 rounded-full py-3 pl-12 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!isConnected || !newMessage.trim()}
                        className="absolute right-1.5 top-1.5 p-1.5 bg-primary-600 rounded-full text-white hover:bg-primary-500 disabled:opacity-0 disabled:pointer-events-none transition-all"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
