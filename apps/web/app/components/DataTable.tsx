'use client';

interface DataTableProps {
  columns: string[];
  data: any[];
  rowCount: number;
}

export default function DataTable({ columns, data, rowCount }: DataTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden">

      {/* --- VISUAL ELEMENT: TABLE HEADER HEADER --- 
          Shows the 'Dataset Preview' title and row count.
      */}
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">
            Dataset Preview
          </h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">
            Total records identified: {rowCount}
          </p>
        </div>
        {/* Decorative dots for a dashboard feel */}
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
        </div>
      </div>

      {/* --- VISUAL ELEMENT: THE DATA GRID --- 
          The main table where the Excel data is displayed.
      */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* HEADER ROW: Column names from the Excel file */}
          <thead className="bg-zinc-950 text-white">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] border-r border-zinc-800 last:border-0"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          {/* DATA ROWS: The actual content of the file */}
          <tbody className="divide-y divide-zinc-100">
            {data.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-zinc-50 transition-colors group cursor-default"
              >
                {columns.map((col) => {
                  const isNameColumn = col.toLowerCase().includes('name');
                  return (
                    /* DATA CELL: Each individual piece of data */
                    <td
                      key={`${idx}-${col}`}
                      className={`px-6 py-4 text-sm font-medium border-r border-zinc-50 last:border-0 transition-colors ${isNameColumn ? 'font-bold text-zinc-950 underline decoration-red-600/30 underline-offset-4' : 'text-zinc-700'
                        } group-hover:text-zinc-950 font-sans`}
                    >
                      {row[col] !== null && row[col] !== undefined
                        ? String(row[col])
                        : <span className="text-red-400 font-bold text-[10px]">NULL</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- VISUAL ELEMENT: TABLE FOOTER --- 
          Small text at the bottom for branding.
      */}
      <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-100">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tight text-zinc-400">
          <span>Data by HCIAP</span>
          <span className="text-red-600">Data Table</span>
        </div>
      </div>
    </div>
  );
}
