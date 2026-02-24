'use client';

import { useAuth } from '../lib/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import NotificationDropdown from './NotificationDropdown';
import { io } from 'socket.io-client';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [accessDenied, setAccessDenied] = useState(false);
    const [deniedMessage, setDeniedMessage] = useState('');

    // Skip for login page
    const isLoginPage = pathname === '/login' || pathname === '/';

    useEffect(() => {
        if (isLoading) return;

        // If not authenticated and not on login page, redirect to login
        if (!isAuthenticated && !isLoginPage) {
            router.push('/login');
            return;
        }

        // Check talent_solution access
        if (isAuthenticated && user) {
            const ts = user.talent_solution;
            const role = user.role;

            // Allow ADMIN to access everything
            if (role === 'ADMIN') {
                setAccessDenied(false);
                setDeniedMessage('');
                return;
            }

            // If on talent solution 1 page but user is on TS 2
            if ((pathname.startsWith('/talent-management/talent-solution-1') || pathname.startsWith('/batch-management/talent-solution-1')) && ts !== 1) {
                setAccessDenied(true);
                setDeniedMessage('You are not on this TS team');
                return;
            }

            // If on talent solution 2 page but user is on TS 1
            if ((pathname.startsWith('/talent-management/talent-solution-2') || pathname.startsWith('/batch-management/talent-solution-2')) && ts !== 2) {
                setAccessDenied(true);
                setDeniedMessage('You are not on this TS team');
                return;
            }

            // Clear any previous denial
            setAccessDenied(false);
            setDeniedMessage('');
        }
    }, [isAuthenticated, isLoading, pathname, user, router, isLoginPage]);

    // Socket state & toast
    const [socketConnected, setSocketConnected] = useState(false);
    const [toastMessage, setToastMessage] = useState<{
        title: string;
        body: string;
        timestamp: string;
        visible: boolean;
    }>({ title: '', body: '', timestamp: '', visible: false });

    useEffect(() => {
        if (!isAuthenticated) return;

        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000', {
            withCredentials: true
        });

        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
            setSocketConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
            setSocketConnected(false);
        });

        socket.on('whatsapp_message_received', (data: any) => {
            console.log("WebSocket event: whatsapp_message_received", data);

            // Format timestamp slightly
            const timeRaw = new Date(data.timestamp);
            const formattedTime = `${timeRaw.getHours().toString().padStart(2, '0')}:${timeRaw.getMinutes().toString().padStart(2, '0')}`;

            setToastMessage({
                title: `New WhatsApp: ${data.employee?.nama || 'Unknown'}`,
                body: data.message || 'No content',
                timestamp: formattedTime,
                visible: true
            });

            // Auto hide after 5 seconds
            setTimeout(() => {
                setToastMessage(prev => ({ ...prev, visible: false }));
            }, 5000);
        });

        return () => {
            socket.disconnect();
        };
    }, [isAuthenticated]);

    // Login page - render without shell
    if (isLoginPage) {
        return <>{children}</>;
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-10 h-10 border-4 border-zinc-200 border-t-red-600 rounded-full animate-spin"></div>
                    <p className="text-zinc-500 text-sm font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - show nothing (redirect is happening)
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex h-screen bg-white">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Top Navbar */}
                <div className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-8 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <h2 className="text-lg font-bold text-zinc-900">Assessment Planning Platform</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <NotificationDropdown />
                        {/* User Info & Logout */}
                        <div className="flex items-center space-x-3 pl-4 border-l border-zinc-200">
                            <div className="text-right">
                                <p className="text-sm font-bold text-zinc-900">{user?.name || user?.nik_user}</p>
                                <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">
                                    {user?.role === 'ADMIN' ? 'ADMINISTRATOR' : `TS ${user?.talent_solution}`}
                                </p>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                title="Sign Out"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 overflow-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                    {children}
                </main>
            </div>

            {/* Access Denied Popup */}
            {accessDenied && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 duration-300 border border-zinc-200">
                        {/* Icon */}
                        <div className="pt-10 pb-4 flex justify-center">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center border-2 border-red-100">
                                <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-8 pb-4 text-center">
                            <h3 className="text-xl font-bold text-zinc-900 mb-2">Access Denied</h3>
                            <p className="text-zinc-500 text-sm font-medium">{deniedMessage}</p>
                        </div>

                        {/* Action */}
                        <div className="px-8 pb-8 pt-4 flex justify-center">
                            <button
                                onClick={() => {
                                    setAccessDenied(false);
                                    router.push('/dashboard');
                                }}
                                className="px-8 py-3 bg-zinc-950 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all text-sm shadow-lg shadow-zinc-950/10"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Web Socket Toast Notification */}
            {toastMessage.visible && (
                <div className="fixed bottom-6 right-6 z-[300] bg-white rounded-2xl p-4 shadow-2xl border border-zinc-200 animate-in slide-in-from-bottom-5 fade-in duration-300 min-w-[300px] max-w-sm flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200 mt-0.5">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                    <div className="flex-1 w-0">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-zinc-900 truncate pr-2">{toastMessage.title}</p>
                            <p className="text-[10px] font-semibold text-zinc-400">{toastMessage.timestamp}</p>
                        </div>
                        <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                            {toastMessage.body}
                        </p>
                    </div>
                    <button onClick={() => setToastMessage(prev => ({ ...prev, visible: false }))} className="flex-shrink-0 text-zinc-400 hover:text-red-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Socket connection indicator (optional, but good for UX) */}
            <div className={`fixed bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm z-50 transition-colors border ${socketConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                {socketConnected ? 'Realtime Connected' : 'Realtime Disconnected'}
            </div>
        </div>
    );
}
