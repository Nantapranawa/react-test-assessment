'use client';

interface DataTableProps {
  columns: string[];
  data: any[];
  rowCount: number;
}

export default function DataTable({ columns, data, rowCount }: DataTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Table Header Info */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          Data Preview
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Showing {rowCount} row{rowCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-linear-to-r from-blue-600 to-blue-700 text-white">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-6 py-4 text-left text-sm font-semibold"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b border-gray-200 transition ${
                  idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                } hover:bg-blue-50`}
              >
                {columns.map((col) => (
                  <td key={`${idx}-${col}`} className="px-6 py-4 text-sm text-gray-800">
                    {row[col] !== null && row[col] !== undefined
                      ? String(row[col])
                      : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          Total records: <span className="font-semibold">{rowCount}</span>
        </p>
      </div>
    </div>
  );
}
