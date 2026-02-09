'use client';

import { useData } from '../lib/DataContext';
import DataTable from '../components/DataTable';
import Link from 'next/link';

export default function TalentManagementPage() {
    const { tableData } = useData();

    return (
        <div className="p-8">
            {/* PAGE HEADER */}
            <div className="mb-10 flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
                    Talent <span className="text-red-600">Management</span>
                </h1>
                <p className="text-zinc-500 text-base font-medium">
                    Personnel development and resource allocation tracking
                </p>
            </div>

            {/* CONDITIONAL CONTENT */}
            {tableData ? (
                <div className="animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                            <h2 className="text-base font-bold text-zinc-900">Active Talent Matrix</h2>
                        </div>
                    </div>

                    <DataTable
                        columns={tableData.columns}
                        data={tableData.data}
                        rowCount={tableData.row_count}
                    />
                </div>
            ) : (
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
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <p className="text-xl font-bold text-zinc-900 mb-1">No Dataset Detected</p>
                    <p className="text-zinc-500 text-base font-medium mb-8">Please initialize the data feed from the main dashboard.</p>

                    <Link
                        href="/"
                        className="inline-flex items-center px-10 py-3 bg-zinc-950 text-white text-base font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-md active:scale-95"
                    >
                        Return to Dashboard
                    </Link>
                </div>
            )}
        </div>
    );
}
