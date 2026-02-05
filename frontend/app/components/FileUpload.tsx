'use client';

import { useState } from 'react';

export default function FileUpload({ onDataLoaded }: { onDataLoaded: (data: any) => void }) {
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

  return (
    <div className="bg-white p-8 rounded-xl shadow-md border-2 border-dashed border-blue-300 text-center hover:border-blue-500 transition">
      <svg
        className="w-12 h-12 mx-auto text-blue-300 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>

      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        Upload Excel File
      </h3>
      <p className="text-gray-600 mb-4">
        Select an Excel file (.xlsx, .xls) to display its contents
      </p>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        disabled={loading}
        className="hidden"
        id="excel-input"
      />

      <label
        htmlFor="excel-input"
        className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg cursor-pointer hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Uploading...' : 'Choose File'}
      </label>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
