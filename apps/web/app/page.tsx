'use client';

import { useData } from './lib/DataContext';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';

export default function Home() {
  const { tableData, setTableData, loading } = useData();

  const handleDataLoaded = (data: any) => {
    setTableData(data);
  };

  const hasData = tableData && tableData.data && tableData.data.length > 0;

  return (
    <div className="p-8">
      {/* --- VISUAL ELEMENT: PAGE HEADER --- */}
      <div className="mb-10 flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
          Dashboard <span className="text-red-600">Overview</span>
        </h1>
        <p className="text-zinc-500 text-base font-medium">
          Analytics and data management system
        </p>
      </div>

      {/* --- MAIN CONTENT CONTAINER --- */}
      <div className="grid grid-cols-1 gap-10">

        {/* --- SECTION: DATA IMPORT --- */}
        {!hasData && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center space-x-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900"></span>
              <h2 className="text-base font-bold text-zinc-900">Import Interface</h2>
            </div>
            <FileUpload onDataLoaded={handleDataLoaded} />
          </div>
        )}

        {/* --- SECTION: MAINTENANCE VIEW --- */}
        {hasData && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center space-x-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              <h2 className="text-base font-bold text-zinc-900">Processing Status</h2>
            </div>

            <div className="p-16 text-center bg-zinc-50 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-3">Visualization Under Maintenance</h3>
              <p className="text-zinc-500 text-base font-medium max-w-md mx-auto">
                Detailed analytics have been routed to the <strong>Talent Management</strong> module. Please navigate there to view the processed data streams and talent metrics.
              </p>
              <div className="mt-8 flex justify-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600/40"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-red-600/40"></div>
              </div>
            </div>
          </div>
        )}

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
            <p className="text-zinc-500 text-base font-medium">Please upload an Excel file to begin processing.</p>
          </div>
        )}
      </div>
    </div>
  );
}