'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, ExternalLink, Calendar, CheckCircle2 } from 'lucide-react';
import { notificationsAPI, handleAPIError } from '@/lib/api';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const { user, isAuthenticated } = useAuthStore();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<any>(null);

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchNotifications();

            // Setup real-time notifications via socket
            const WS_URL = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || '';
            const socket: any = io(WS_URL, {
                auth: {
                    token: localStorage.getItem('accessToken')
                },
                transports: ['websocket', 'polling']
            });

            socketRef.current = socket;

            socket.on('connect', () => {
                console.log('[NOTIFICATIONS] Connected to socket');
            });

            socket.on('new_notification', (notification: any) => {
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
                toast.success(notification.title, {
                    icon: '🔔',
                    duration: 5000
                });
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [isAuthenticated, user]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await notificationsAPI.getAll();
            const data = response.data.data;
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.is_read).length);
        } catch (error) {
            console.error('Error fetching notifications:', handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationsAPI.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            toast.error(handleAPIError(error));
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            toast.error(handleAPIError(error));
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                title="Notificaciones"
            >
                <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'animate-bounce text-primary-500' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-dark-950">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute -right-4 md:-right-2 mt-3 w-72 md:w-80 bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl z-50 overflow-hidden ring-1 ring-white/5"
                    >
                        <div className="p-3 border-b border-dark-700 flex items-center justify-between bg-dark-800/50">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                Notificaciones
                                {unreadCount > 0 && (
                                    <span className="text-[9px] bg-primary-900/30 text-primary-400 border border-primary-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                        Nuevo
                                    </span>
                                )}
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-[9px] font-bold text-primary-500 hover:text-primary-400 uppercase tracking-widest"
                                >
                                    Marcar todo
                                </button>
                            )}
                        </div>

                        <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                            {loading && notifications.length === 0 ? (
                                <div className="p-6 text-center space-y-3">
                                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Cargando...</p>
                                </div>
                            ) : notifications.length > 0 ? (
                                <div className="divide-y divide-dark-700/50">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-3 transition-colors hover:bg-white/5 flex gap-3 ${!notification.is_read ? 'bg-primary-500/5' : ''}`}
                                        >
                                            <div className="flex-shrink-0 mt-0.5">
                                                {notification.type === 'event_reminder' ? (
                                                    <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                    </div>
                                                ) : (
                                                    <div className="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-0.5">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className={`text-xs font-bold ${notification.is_read ? 'text-gray-300' : 'text-white'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.is_read && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(notification.id)}
                                                            className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1"
                                                            title="Marcar como leído"
                                                        />
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="text-[9px] font-medium text-gray-500">
                                                        {formatDate(notification.created_at, 'Pp')}
                                                    </span>
                                                    {notification.link && (
                                                        <Link
                                                            href={notification.link}
                                                            onClick={() => setIsOpen(false)}
                                                            className="text-[9px] font-bold text-primary-500 hover:text-primary-400 flex items-center gap-1 uppercase tracking-widest"
                                                        >
                                                            Ver más <ExternalLink className="w-2 h-2" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-dark-800 flex items-center justify-center mx-auto text-gray-600">
                                        <BellOff className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-white text-xs">Sin notificaciones</p>
                                        <p className="text-[10px] text-gray-500">Te avisaremos cuando haya novedades.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-2 bg-dark-800/50 border-t border-dark-700 text-center">
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                                    Notificaciones Recientes
                                </span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
