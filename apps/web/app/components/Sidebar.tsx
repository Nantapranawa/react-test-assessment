'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-64 bg-zinc-950 text-white shadow-xl z-10 border-r border-zinc-900">
      {/* --- VISUAL ELEMENT: BRANDING / LOGO SECTION --- 
          Contains the 'ExcelLab' title and version number.
      */}
      <div className="p-8 border-b border-zinc-900">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-red-600">Excel</span>Lab
        </h1>
        <p className="text-zinc-500 text-xs font-medium mt-1">
          Enterprise Data Systems
        </p>
      </div>

      {/* --- VISUAL ELEMENT: NAVIGATION LINKS --- 
          The list of buttons to move between different parts of the app.
      */}
      <nav className="p-4 mt-4 space-y-2">
        <Link
          href="/"
          className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${isActive('/')
            ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
        >
          {/* ICON: Home icon */}
          <svg className="w-5 h-5 mr-3 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-sm font-semibold">Dashboard</span>
        </Link>

        <Link
          href="/talent-management"
          className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${isActive('/talent-management')
            ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
        >
          {/* ICON: Talent/Briefcase icon */}
          <svg className="w-5 h-5 mr-3 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="text-sm font-semibold">Talent Management</span>
        </Link>
      </nav>

      {/* --- VISUAL ELEMENT: SYSTEM STATUS INDICATOR --- 
          A small footer showing if the connection is active.
      */}
      <div className="absolute bottom-0 w-64 p-6 border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex items-center space-x-2.5 text-zinc-500">
          <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]"></div>
          <p className="text-xs font-semibold tracking-wide">System Operational</p>
        </div>
      </div>
    </aside>
  );
}
