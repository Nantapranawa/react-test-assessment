'use client';

interface DataTableProps {
  columns: string[];
  data: any[];
  rowCount: number;
}

export default function DataTable({ columns, data, rowCount }: DataTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">

      {/* --- VISUAL ELEMENT: TABLE HEADER HEADER --- */}
      <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">
            Dataset Preview
          </h3>
          <p className="text-sm text-zinc-500 font-medium mt-0.5">
            Total records identified: {rowCount}
          </p>
        </div>
        <div className="flex space-x-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600/20"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-red-600/40"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
        </div>
      </div>

      {/* --- VISUAL ELEMENT: THE DATA GRID --- */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-950 text-white">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-6 py-5 text-left text-base font-semibold tracking-wide border-r border-zinc-800 last:border-0"
                >
                  {col.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100">
            {data.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-zinc-50/80 transition-colors group cursor-default"
              >
                {columns.map((col) => {
                  const isNameColumn = col.toLowerCase().includes('name');
                  const isStatusColumn = col === 'availability_status';

                  if (isStatusColumn) {
                    const status = row[col] ? String(row[col]) : 'No Invitation';
                    const lowerStatus = status.toLowerCase();

                    let badgeClass = "bg-zinc-100 text-zinc-600 border-zinc-200"; // Default / No Invitation

                    if (lowerStatus.includes("accepted")) {
                      badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200";
                    } else if (lowerStatus.includes("rejected")) {
                      badgeClass = "bg-red-100 text-red-700 border-red-200";
                    } else if (lowerStatus.includes("sent")) {
                      badgeClass = "bg-amber-100 text-amber-700 border-amber-200";
                    } else if (lowerStatus.includes("reschedule")) {
                      badgeClass = "bg-blue-100 text-blue-700 border-blue-200";
                    }

                    return (
                      <td
                        key={`${idx}-${col}`}
                        className="px-6 py-5 border-r border-zinc-50 last:border-0 transition-colors group-hover:text-zinc-950"
                      >
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${badgeClass} inline-flex items-center justify-center min-w-[100px]`}>
                          {status}
                        </span>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={`${idx}-${col}`}
                      className={`px-6 py-5 text-base font-medium border-r border-zinc-50 last:border-0 transition-colors ${isNameColumn ? 'text-zinc-950 font-semibold' : 'text-zinc-600'
                        } group-hover:text-zinc-950`}
                    >
                      {row[col] !== null && row[col] !== undefined
                        ? String(row[col])
                        : <span className="text-red-500/60 font-medium italic text-base">N/A</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- VISUAL ELEMENT: TABLE FOOTER --- */}
      <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
          <span>Enterprise Data Management</span>
          <span className="text-red-600/80">System Analytics</span>
        </div>
      </div>
    </div>
  );
}
