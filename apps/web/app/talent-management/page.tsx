'use client';

import { useData } from '../lib/DataContext';
import DataTable from '../components/DataTable';
import FileUpload from '../components/FileUpload';
import Link from 'next/link';

export default function TalentManagementPage() {
    const { tableData, setTableData } = useData();

    const handleDataLoaded = (data: any) => {
        setTableData(data);
    };

    return (
        <div className="p-8">
            {/* PAGE HEADER */}
            <div className="mb-12 border-l-4 border-red-600 pl-6">
                <h1 className="text-4xl font-black text-zinc-950 mb-2 uppercase tracking-tighter">
                    Talent <span className="text-red-600">Management</span>
                </h1>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">
                    Internal Personnel Development & Tracking System
                </p>
            </div>

            {/* CONDITIONAL CONTENT */}
            {tableData ? (
                <div className="animate-in fade-in zoom-in-95 duration-700">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="px-2 py-1 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest">Active Feed</div>
                            <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Live Talent Matrix</h2>
                        </div>

                        {/* COMPACT UPLOAD BUTTON for swapping data */}
                        <FileUpload onDataLoaded={handleDataLoaded} variant="compact" />
                    </div>

                    <DataTable
                        columns={tableData.columns}
                        data={tableData.data}
                        rowCount={tableData.row_count}
                    />
                </div>
            ) : (
                <div className="p-20 text-center bg-zinc-50/50 rounded-none border border-zinc-100 shadow-sm transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="w-12 h-12 border-t-2 border-r-2 border-zinc-200 group-hover:border-red-600 transition-colors duration-500"></div>
                    </div>
                    <div className="w-20 h-20 bg-white shadow-sm border border-zinc-100 flex items-center justify-center mx-auto mb-8 rotate-45 group-hover:border-red-500 transition-colors">
                        <svg
                            className="w-8 h-8 text-zinc-300 -rotate-45 group-hover:text-red-600 transition-colors duration-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <p className="text-sm font-black text-zinc-950 mb-2 uppercase tracking-[0.2em]">Data Ingestion Required</p>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-8">No active dataset detected in system memory.</p>

                    <Link
                        href="/"
                        className="inline-flex items-center px-8 py-3 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg active:scale-95"
                    >
                        Go to Home to Upload Source
                    </Link>
                </div>
            )}
        </div>
    );
}
