'use client';

import React, { useMemo, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    BarChart,
    Bar
} from 'recharts';
import { Filter, Download, MoreHorizontal, Calendar } from 'lucide-react';

const COLORS = ['#e11d48', '#18181b', '#71717a', '#d4d4d8']; // Rose 600, Zinc 900, Zinc 500, Zinc 300

export default function DashboardCharts({ data }: { data: any[] }) {
    const [timeRange, setTimeRange] = useState('Week');

    // Aggregate data for charts
    const chartsData = useMemo(() => {
        if (!data || data.length === 0) return { statusDistribution: [], trendData: [], resultDistribution: [] };

        // 1. Status Distribution
        const statusCounts: Record<string, number> = {};
        data.forEach((item: any) => {
            const status = item.availability_status || 'No Invitation';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const statusDistribution = Object.entries(statusCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // 2. TC Result Distribution (Replacing BP)
        const resultCounts: Record<string, number> = {};
        data.forEach((item: any) => {
            const result = item.tc_result || 'Sent';
            resultCounts[result] = (resultCounts[result] || 0) + 1;
        });

        const resultDistribution = Object.entries(resultCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // 3. Trend Data based on updatedAt
        const trendMap = new Map();
        const now = new Date();
        const days = timeRange === 'Week' ? 7 : timeRange === 'Month' ? 30 : 365;

        if (timeRange === 'Year') {
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = d.toLocaleString('default', { month: 'short' });
                trendMap.set(key, { name: key, accepted: 0, rejected: 0, resched: 0 });
            }
        } else {
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split('T')[0];
                const displayKey = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                trendMap.set(key, { name: displayKey, accepted: 0, rejected: 0, resched: 0 });
            }
        }

        data.forEach((item: any) => {
            if (!item.updatedAt) return;
            const itemDate = new Date(item.updatedAt);
            let key = '';
            if (timeRange === 'Year') {
                key = itemDate.toLocaleString('default', { month: 'short' });
            } else {
                key = itemDate.toISOString().split('T')[0];
            }

            if (trendMap.has(key)) {
                const status = (item.availability_status || '').toLowerCase();
                const record = trendMap.get(key);
                if (status.includes('accept')) record.accepted++;
                else if (status.includes('reject')) record.rejected++;
                else if (status.includes('reschedule')) record.resched++;
            }
        });

        const trendData = Array.from(trendMap.values());

        return { statusDistribution, trendData, resultDistribution };
    }, [data, timeRange]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-zinc-900 border border-zinc-800 text-white p-3 rounded-lg shadow-xl text-sm">
                    <p className="font-semibold mb-1 text-zinc-300">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-zinc-400 capitalize">{entry.name}:</span>
                            <span className="font-mono font-bold">{entry.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

            {/* Main Chart: Assessment Trend */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                            Activity Overview
                        </h3>
                        <p className="text-sm text-zinc-500 font-medium">Candidate processing volume over time</p>
                    </div>
                    <div className="flex bg-zinc-50 p-1 rounded-xl border border-zinc-100">
                        {['Week', 'Month', 'Year'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${timeRange === range
                                    ? 'bg-white text-zinc-900 shadow-sm border border-zinc-100'
                                    : 'text-zinc-500 hover:text-zinc-700'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartsData.trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorAccepted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorResched" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e4e4e7', strokeWidth: 1 }} />
                            <Area
                                type="monotone"
                                dataKey="accepted"
                                name="Accepted"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorAccepted)"
                            />
                            <Area
                                type="monotone"
                                dataKey="rejected"
                                name="Rejected"
                                stroke="#e11d48"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorRejected)"
                            />
                            <Area
                                type="monotone"
                                dataKey="resched"
                                name="Rescheduled"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                strokeDasharray="4 4"
                                fillOpacity={1}
                                fill="url(#colorResched)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Side Chart: Status Distribution */}
            <div className="lg:col-span-1 flex flex-col gap-6">

                {/* Chart Card */}
                <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm flex-1 flex flex-col transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="text-lg font-bold text-zinc-900">Pipeline Status</h3>
                            <p className="text-sm text-zinc-500 font-medium">Current distribution</p>
                        </div>
                        <button className="p-2 hover:bg-zinc-50 rounded-full text-zinc-400 transition-colors">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>

                    <div className="flex-1 min-h-[200px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartsData.statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={4}
                                    dataKey="value"
                                    cornerRadius={6}
                                >
                                    {chartsData.statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <span className="text-3xl font-bold text-zinc-900 tracking-tight block">{data ? data.length : 0}</span>
                            <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Total</span>
                        </div>
                    </div>

                    {/* Compact Legend */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {chartsData.statusDistribution.slice(0, 4).map((entry, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs text-zinc-500">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                <span className="truncate">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mini Stat or Action Card */}
                <div className="bg-zinc-900 p-6 rounded-3xl shadow-lg relative overflow-hidden group cursor-pointer">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-red-600/30 transition-colors"></div>
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Quick Export</p>
                            <h3 className="text-white font-bold text-lg">Download Report</h3>
                        </div>
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-transform">
                            <Download size={20} />
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}
