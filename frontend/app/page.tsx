'use client';

import { useState } from 'react';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';

interface TableData {
  columns: string[];
  data: any[];
  row_count: number;
}

export default function Home() {
  const [tableData, setTableData] = useState<TableData | null>(null);

  const handleDataLoaded = (data: TableData) => {
    setTableData(data);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome to Dashboard
        </h1>
        <p className="text-gray-600">
          Upload and view your Excel files in a beautiful table format
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8">
        {/* File Upload Section */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Step 1: Upload File
          </h2>
          <FileUpload onDataLoaded={handleDataLoaded} />
        </div>

        {/* Data Display Section */}
        {tableData && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Step 2: View Data
            </h2>
            <DataTable
              columns={tableData.columns}
              data={tableData.data}
              rowCount={tableData.row_count}
            />
          </div>
        )}

        {/* Empty State */}
        {!tableData && (
          <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg">No data loaded yet</p>
            <p className="text-sm">Upload an Excel file to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}