import React, { useMemo } from 'react';
import { Users, ClipboardCheck, Clock, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

// Mock data for sparklines
const generateSparkData = (trend: 'up' | 'down' | 'stable') => {
    const data = [];
    let prev = 50;
    for (let i = 0; i < 20; i++) {
        const change = trend === 'up' ? Math.random() * 10 - 2 :
            trend === 'down' ? Math.random() * 10 - 8 :
                Math.random() * 10 - 5;
        prev = Math.max(10, Math.min(90, prev + change));
        data.push({ value: prev });
    }
    return data;
};

interface MetricCardProps {
    label: string;
    value: number;
    total: number;
    icon: React.ReactNode;
    trend: string;
    sparkData: any[];
    accentColor: string;
    isDark?: boolean;
}

const MetricCard = ({ label, value, total, icon, trend, sparkData, accentColor, isDark = false }: MetricCardProps) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <div className={`relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${isDark ? 'bg-zinc-900 text-white shadow-2xl shadow-zinc-900/20' : 'bg-white text-zinc-900 shadow-sm border border-zinc-100'
            }`}>
            {/* Background Glow for Dark Card */}
            {isDark && (
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            )}

            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-zinc-800 text-white' : 'bg-zinc-50 text-zinc-900 border border-zinc-100'}`}>
                    {icon}
                </div>
                <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-white border-zinc-100 text-zinc-500'
                    }`}>
                    {trend}
                </div>
            </div>

            <div className="relative z-10 mb-2">
                <h3 className={`text-xs font-medium mb-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{label}</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight">{value.toLocaleString()}</span>
                    {label !== 'Total Candidates' && (
                        <span className={`text-xs font-medium ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            {percentage}%
                        </span>
                    )}
                </div>
            </div>

            {/* Sparkline Area */}
            <div className="h-10 -mx-4 -mb-4 relative opacity-80">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparkData}>
                        <defs>
                            <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={accentColor} stopOpacity={0.3} />
                                <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={accentColor}
                            strokeWidth={2}
                            fill={`url(#gradient-${label})`}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default function DashboardStats({ data }: { data: any[] }) {
    const stats = useMemo(() => {
        if (!data) return { total: 0, ready: 0, pending: 0, completed: 0 };

        const total = data.length;

        // Normalize ready checks (Reschedules)
        const ready = data.filter((item: any) =>
            (item.availability_status || '').toLowerCase().includes('reschedule')
        ).length;

        // Normalize pending checks (Sent & Pending)
        const pending = data.filter((item: any) => {
            const status = (item.availability_status || '').toLowerCase();
            return status === 'sent' || status === 'pending';
        }).length;

        // Normalize completed checks (Accepted)
        const completed = data.filter((item: any) =>
            (item.availability_status || '').toLowerCase().includes('accept')
        ).length;

        return { total, ready, pending, completed };
    }, [data]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

            {/* 1. TOTAL CANDIDATES - DARK THEME Highlight */}
            <MetricCard
                label="Total Candidates"
                value={stats.total}
                total={stats.total}
                icon={<Users size={18} />}
                trend="+12%"
                sparkData={generateSparkData('up')}
                accentColor="#e11d48" // Red 600
                isDark={true}
            />

            {/* 2. READY (Rescheduled) */}
            <MetricCard
                label="Rescheduled"
                value={stats.ready}
                total={stats.total}
                icon={<ClipboardCheck size={18} />}
                trend="+8%"
                sparkData={generateSparkData('up')}
                accentColor="#3b82f6" // Blue 500
            />

            {/* 3. PENDING (Sent) */}
            <MetricCard
                label="Sent"
                value={stats.pending}
                total={stats.total}
                icon={<Clock size={18} />}
                trend="-5%"
                sparkData={generateSparkData('down')}
                accentColor="#f59e0b" // Amber 500
            />

            {/* 4. COMPLETED */}
            <MetricCard
                label="Completed"
                value={stats.completed}
                total={stats.total}
                icon={<CheckCircle2 size={18} />}
                trend="+15%"
                sparkData={generateSparkData('stable')}
                accentColor="#10b981" // Emerald 500
            />

        </div>
    );
}
