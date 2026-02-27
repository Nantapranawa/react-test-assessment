'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Calendar, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

interface Notification {
    id: number;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    talent_solution?: number;
    employee?: {
        nama: string;
        posisi: string;
    };
}

import { io } from 'socket.io-client';

export default function NotificationDropdown() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch notifications
    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const ts = user.role === 'ADMIN' ? 'all' : user.talent_solution;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications?talent_solution=${ts}`);
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data.notifications);
                setUnreadCount(data.data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();

            // Realtime sync via Websocket instead of polling!
            const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000', {
                withCredentials: true
            });

            socket.on('notification_updated', () => {
                console.log('[NotificationDropdown] Notification updated via WebSocket, refreshing...');
                fetchNotifications();
            });

            // Also listen to the direct whatsapp messages hook to update notification instantly
            socket.on('whatsapp_message_received', () => {
                fetchNotifications();
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [user]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkRead = async (id: number, ts?: number) => {
        try {
            const queryTs = ts || user?.talent_solution || 1;
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications/${id}/read?talent_solution=${queryTs}`, { method: 'PUT' });
            // Update local state
            setNotifications(prev => prev.map(n => (n.id === id && n.talent_solution === ts) ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const ts = user?.role === 'ADMIN' ? 'all' : user?.talent_solution || 1;
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications/read-all?talent_solution=${ts}`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all read:', error);
        }
    };

    const handleResolveAction = async (id: number, ts: number | undefined, action: 'accept' | 'decline', proposedStatus: string) => {
        try {
            const queryTs = ts || user?.talent_solution || 1;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications/${id}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ talent_solution: queryTs, action, proposedStatus })
            });
            const data = await res.json();
            if (data.success) {
                fetchNotifications();
            }
        } catch (error) {
            console.error('Error resolving action:', error);
        }
    };

    // Helper for icon based on type
    const getIcon = (type: string) => {
        if (type.startsWith('action:')) return <AlertCircle className="w-4 h-4 text-blue-600" />;
        switch (type) {
            case 'success': return <UserCheck className="w-4 h-4 text-emerald-600" />;
            case 'error': return <X className="w-4 h-4 text-red-600" />;
            case 'warning': return <Calendar className="w-4 h-4 text-amber-600" />;
            default: return <AlertCircle className="w-4 h-4 text-blue-600" />;
        }
    };

    const getBgColor = (type: string) => {
        if (type.startsWith('action:')) return 'bg-blue-50 border-blue-100';
        switch (type) {
            case 'success': return 'bg-emerald-50 border-emerald-100';
            case 'error': return 'bg-red-50 border-red-100';
            case 'warning': return 'bg-amber-50 border-amber-100';
            default: return 'bg-blue-50 border-blue-100';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-zinc-100 transition-colors"
            >
                <Bell className="w-6 h-6 text-zinc-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-zinc-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="px-4 py-3 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                        <h3 className="text-sm font-bold text-zinc-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs font-semibold text-red-600 hover:text-red-700"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Bell className="w-5 h-5 text-zinc-300" />
                                </div>
                                <p className="text-sm text-zinc-500 font-medium">No system alerts</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-50">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`p-4 hover:bg-zinc-50 transition-colors flex gap-3 ${!notif.isRead ? 'bg-red-50/10' : ''}`}
                                        onClick={() => !notif.isRead && handleMarkRead(notif.id, notif.talent_solution)}
                                    >
                                        <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${getBgColor(notif.type)}`}>
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className={`text-sm ${!notif.isRead ? 'font-semibold text-zinc-900' : 'text-zinc-600'}`}>
                                                {notif.message}
                                            </p>
                                            <p className="text-[10px] text-zinc-400 font-medium">
                                                {new Date(notif.createdAt).toLocaleString()}
                                            </p>
                                            {notif.type.startsWith('action:') && (
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleResolveAction(notif.id, notif.talent_solution, 'accept', notif.type.split(':')[1]);
                                                        }}
                                                        className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 transition"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleResolveAction(notif.id, notif.talent_solution, 'decline', notif.type.split(':')[1]);
                                                        }}
                                                        className="px-3 py-1 bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-md hover:bg-zinc-300 transition"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {!notif.isRead && (
                                            <div className="mt-2 w-2 h-2 rounded-full bg-red-600 flex-shrink-0"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
