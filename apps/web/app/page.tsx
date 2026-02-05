'use client';

import { useData } from './lib/DataContext';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';

export default function Home() {
  const { tableData, setTableData } = useData();

  const handleDataLoaded = (data: any) => {
    setTableData(data);
  };

  return (
    <div className="p-8">
      {/* --- VISUAL ELEMENT: PAGE HEADER --- 
          The main 'Systems Dashboard' title with a vertical red border.
      */}
      <div className="mb-12 border-l-4 border-red-600 pl-6">
        <h1 className="text-4xl font-black text-zinc-950 mb-2 uppercase tracking-tighter">
          Systems <span className="text-red-600">Dashboard</span>
        </h1>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">
          Excel Data Processing
        </p>
      </div>

      {/* --- MAIN CONTENT CONTAINER --- */}
      <div className="grid grid-cols-1 gap-12">

        {/* --- SECTION: STAGE 01 (FILE UPLOAD) --- 
            Now conditionally hidden when data is loaded.
        */}
        {!tableData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center space-x-3 mb-6">
              <div className="px-2 py-1 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest">Stage 01</div>
              <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Source Acquisition</h2>
            </div>
            <FileUpload onDataLoaded={handleDataLoaded} />
          </div>
        )}

        {/* --- SECTION: STAGE 02 (MAINTENANCE VIEW) --- 
            When data is uploaded, this page goes into 'Maintenance' mode as requested.
        */}
        {tableData && (
          <div className="animate-in fade-in zoom-in-95 duration-700">
            <div className="flex items-center space-x-3 mb-6">
              <div className="px-2 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest">Stage 02</div>
              <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">System Status</h2>
            </div>

            <div className="p-20 text-center bg-zinc-950 text-white rounded-none border border-red-600 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <div className="w-12 h-12 border-t-2 border-r-2 border-red-600 animate-pulse"></div>
              </div>
              <div className="w-20 h-20 bg-red-600/10 border border-red-600 flex items-center justify-center mx-auto mb-8 rotate-45 group-hover:scale-110 transition-transform duration-500">
                <svg
                  className="w-10 h-10 text-red-600 -rotate-45"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-black mb-4 uppercase tracking-[0.3em]">Visual Under Maintenance</h3>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest max-w-md mx-auto italic">
                Data stream active in Talent Management module. This interface is temporarily offline for visualization optimization.
              </p>
              <div className="mt-8 flex justify-center space-x-4">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-ping"></div>
                <div className="w-2 h-2 rounded-full bg-red-600 animate-ping delay-75"></div>
                <div className="w-2 h-2 rounded-full bg-red-600 animate-ping delay-150"></div>
              </div>
            </div>
          </div>
        )}

        {/* --- VISUAL ELEMENT: EMPTY STATE --- 
            This placeholder shows up when NO DATA has been uploaded yet.
        */}
        {!tableData && (
          <div className="p-20 text-center bg-zinc-50/50 rounded-none border border-zinc-100 shadow-sm transition-all relative overflow-hidden group">
            {/* Decorative corner element */}
            <div className="absolute top-0 right-0 p-4">
              <div className="w-12 h-12 border-t-2 border-r-2 border-zinc-200 group-hover:border-red-600 transition-colors duration-500"></div>
            </div>
            {/* Large central icon */}
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <p className="text-sm font-black text-zinc-950 mb-2 uppercase tracking-[0.2em]">Awaiting Data Feed</p>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">System ready for Excel source ingestion.</p>
          </div>
        )}
      </div>
    </div>
  );
}