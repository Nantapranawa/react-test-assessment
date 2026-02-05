'use client';

import { useState } from 'react';

export default function FileUpload({ onDataLoaded, variant = 'large' }: { onDataLoaded: (data: any) => void; variant?: 'large' | 'compact' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/upload-excel', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onDataLoaded(result);
      } else {
        setError(result.error || 'Failed to upload file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // --- COMPACT VARIANT UI ---
  if (variant === 'compact') {
    return (
      <div className="relative">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          disabled={loading}
          className="hidden"
          id="excel-input-compact"
        />
        <label
          htmlFor="excel-input-compact"
          className="flex items-center px-4 py-2 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-red-600 transition-all shadow-md disabled:opacity-50 active:scale-95 border-b-2 border-red-600"
        >
          {loading ? (
            <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          )}
          Import New Source
        </label>
        {error && (
          <div className="absolute top-full left-0 mt-2 p-2 bg-red-600 text-white text-[8px] font-black uppercase z-50">
            {error}
          </div>
        )}
      </div>
    );
  }

  // --- LARGE VARIANT UI (ORIGINAL) ---
  return (
    <div className="bg-white p-12 rounded-lg shadow-sm border border-zinc-200 text-center hover:border-red-500 transition-all duration-500 group relative overflow-hidden">

      {/* --- VISUAL ELEMENT: PROGRESS BAR --- 
          Only visible when a file is being processed. Slides from left to right.
      */}
      <div className="absolute top-0 left-0 w-full h-1 bg-zinc-100">
        <div className={`h-full bg-red-600 transition-all duration-1000 ${loading ? 'w-full' : 'w-0'}`}></div>
      </div>

      {/* --- VISUAL ELEMENT: DECORATIVE ICON --- 
          The floating square icon with an arrow.
      */}
      <div className="w-16 h-16 bg-zinc-950 rounded-sm rotate-45 flex items-center justify-center mx-auto mb-10 group-hover:bg-red-600 transition-colors duration-500">
        <svg
          className="w-6 h-6 text-white -rotate-45"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
      </div>

      {/* --- VISUAL ELEMENT: TITLE & DESCRIPTION --- */}
      <h3 className="text-sm font-black text-zinc-900 mb-2 uppercase tracking-[0.3em]">
        Data Ingestion <span className="text-red-600">Portal</span>
      </h3>
      <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-10 max-w-xs mx-auto">
        System accepts .XLSX and .XLS source files for real-time processing
      </p>

      {/* HIDDEN INPUT: The actual file input box (hidden because it looks ugly by default) */}
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        disabled={loading}
        className="hidden"
        id="excel-input"
      />

      {/* --- VISUAL ELEMENT: UPLOAD BUTTON --- 
          This label is styled to look like a premium button. Clicking it triggers the hidden input above.
      */}
      <label
        htmlFor="excel-input"
        className="inline-flex items-center px-10 py-4 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-none cursor-pointer hover:bg-red-600 transition-all shadow-xl disabled:opacity-50 active:scale-95"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing Stream...
          </>
        ) : (
          'Initialize Upload'
        )}
      </label>

      {/* --- VISUAL ELEMENT: ERROR MESSAGE --- 
          Appears only if the upload fails (e.g., wrong file type or server down).
      */}
      {error && (
        <div className="mt-8 p-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg">
          [ Error ] {error}
        </div>
      )}
    </div>
  );
}
