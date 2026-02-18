'use client';

import { useData } from '../lib/DataContext';
import FileUpload from '../components/FileUpload';
import DashboardStats from '../components/DashboardStats';
import DashboardCharts from '../components/DashboardCharts';

export default function DashboardPage() {
    const { tableData, setTableData, loading } = useData();

    const handleDataLoaded = (data: any) => {
        setTableData(data);
    };

    const hasData = tableData && tableData.data && tableData.data.length > 0;

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            {/* SECTION: PERFORMANCE OVERVIEW */}
            <div className="mb-6">
                <p className="text-zinc-500 text-xl font-medium">
                    Welcome back. Here is the latest assessment overview.
                </p>
            </div>

            {/* --- MAIN CONTENT CONTAINER --- */}
            <div className="grid grid-cols-1 gap-10">

                {/* --- SECTION: DASHBOARD VISUALIZATIONS --- */}
                {hasData && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                        <div className="flex items-center space-x-2 mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                            <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wider text-m">Performance Metrics</h2>
                        </div>

                        <DashboardStats data={tableData.data} />
                        <DashboardCharts data={tableData.data} />
                    </div>
                )}

                {/* --- SECTION: DATA IMPORT --- */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                    <div className="flex items-center space-x-2 mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-900"></span>
                        <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wider text-xs">Data Management</h2>
                    </div>

                    <FileUpload onDataLoaded={handleDataLoaded} />
                </div>

                {/* --- VISUAL ELEMENT: EMPTY STATE --- */}
                {!hasData && !loading && (
                    <div className="p-16 text-center bg-zinc-50/50 rounded-2xl border border-zinc-100 shadow-sm transition-all group">
                        <div className="w-20 h-20 bg-white shadow-sm border border-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:border-red-200 transition-colors">
                            <svg
                                className="w-8 h-8 text-zinc-300 group-hover:text-red-500 transition-colors duration-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1.001.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        </div>
                        <p className="text-xl font-bold text-zinc-900 mb-1">Awaiting Data Feed</p>
                        <p className="text-zinc-500 text-base font-medium">Please upload an Excel file to initialize the dashboard.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
