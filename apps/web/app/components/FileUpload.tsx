'use client';

import { useState } from 'react';

export default function FileUpload({ onDataLoaded }: { onDataLoaded: (data: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    // File excel masuk di sini
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file); //Diubah menjadi file

      const response = await fetch('http://localhost:8000/api/upload-excel', { //dikirim ke backend
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


  // --- LARGE VARIANT UI ---
  return (
    <div className="bg-white p-16 rounded-2xl shadow-sm border border-zinc-200 text-center hover:border-red-200 transition-all duration-300 group relative overflow-hidden">

      {/* --- VISUAL ELEMENT: PROGRESS BAR --- */}
      <div className="absolute top-0 left-0 w-full h-1 bg-zinc-50">
        <div className={`h-full bg-red-600 transition-all duration-700 ${loading ? 'w-full' : 'w-0'}`}></div>
      </div>

      {/* --- VISUAL ELEMENT: DECORATIVE ICON --- */}
      <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:bg-red-50 transition-colors duration-300">
        <svg
          className="w-8 h-8 text-zinc-400 group-hover:text-red-600 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>

      {/* --- VISUAL ELEMENT: TITLE & DESCRIPTION --- */}
      <h3 className="text-xl font-bold text-zinc-900 mb-2">
        Upload <span className="text-red-600">Excel File</span>
      </h3>
      <p className="text-zinc-500 text-base font-medium mb-10 max-w-sm mx-auto">
        Select a .xlsx or .xls spreadsheet to analyze and process talent data.
      </p>

      {/* HIDDEN INPUT */}
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        disabled={loading}
        className="hidden"
        id="excel-input"
      />

      {/* --- VISUAL ELEMENT: UPLOAD BUTTON --- */}
      <label
        htmlFor="excel-input"
        className="inline-flex items-center px-12 py-4 bg-zinc-950 text-white text-base font-bold rounded-xl cursor-pointer hover:bg-zinc-800 transition-all shadow-md disabled:opacity-50 active:scale-95"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading...
          </>
        ) : (
          'Choose File'
        )}
      </label>

      {/* --- VISUAL ELEMENT: ERROR MESSAGE --- */}
      {error && (
        <div className="mt-8 p-4 bg-red-50 text-red-600 text-base font-bold rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}
    </div>
  );
}
