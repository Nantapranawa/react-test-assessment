'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const [isTalentExpanded, setIsTalentExpanded] = useState(false);
  const [isBatchExpanded, setIsBatchExpanded] = useState(false);

  // Auto-expand if on a talent management page
  useEffect(() => {
    if (pathname.startsWith('/talent-management')) {
      setIsTalentExpanded(true);
    }
    if (pathname.startsWith('/batch-management')) {
      setIsBatchExpanded(true);
    }
  }, [pathname]);

  const isActive = (path: string) => pathname === path;
  const isParentActive = (path: string) => pathname.startsWith(path);

  return (
    <aside className="w-64 bg-zinc-950 text-white shadow-xl z-10 border-r border-zinc-900 flex flex-col h-full">
      {/* --- VISUAL ELEMENT: BRANDING / LOGO SECTION --- 
          Contains the 'ExcelLab' title and version number.
      */}
      <div className="p-8 border-b border-zinc-900 flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-red-600">Assessment</span>Planner
        </h1>
        <p className="text-zinc-500 text-s font-medium mt-1">
          Telkom HCSP Division
        </p>
      </div>

      {/* --- VISUAL ELEMENT: NAVIGATION LINKS --- 
          The list of buttons to move between different parts of the app.
      */}
      <nav className="p-4 mt-4 space-y-2 flex-grow overflow-y-auto custom-scrollbar">
        <Link
          href="/dashboard"
          className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${isActive('/dashboard')
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

        {/* Talent Management Accordion */}
        <div className="space-y-1">
          <button
            onClick={() => setIsTalentExpanded(!isTalentExpanded)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${isParentActive('/talent-management')
              ? 'text-white bg-zinc-900'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
          >
            <div className="flex items-center">
              {/* ICON: Talent/Briefcase icon */}
              <svg className={`w-5 h-5 mr-3 transition-colors ${isParentActive('/talent-management') ? 'text-red-500' : 'opacity-80'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm font-semibold">Talent Management</span>
            </div>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isTalentExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Sub menu */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isTalentExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="pl-12 pr-4 space-y-1 pb-2">
              <Link
                href="/talent-management/talent-solution-1"
                className={`flex items-center px-4 py-2 rounded-lg text-sm transition-all duration-200 ${isActive('/talent-management/talent-solution-1')
                  ? 'bg-red-600/10 text-red-500 font-medium'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                  }`}
              >
                Talent Solution I
              </Link>
              <Link
                href="/talent-management/talent-solution-2"
                className={`flex items-center px-4 py-2 rounded-lg text-sm transition-all duration-200 ${isActive('/talent-management/talent-solution-2')
                  ? 'bg-red-600/10 text-red-500 font-medium'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                  }`}
              >
                Organizing Committee
              </Link>
            </div>
          </div>
        </div>

        {/* Batch Management Accordion */}
        <div className="space-y-1">
          <button
            onClick={() => setIsBatchExpanded(!isBatchExpanded)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${isParentActive('/batch-management')
              ? 'text-white bg-zinc-900'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
          >
            <div className="flex items-center">
              {/* ICON: Folder/Batch icon */}
              <svg className={`w-5 h-5 mr-3 transition-colors ${isParentActive('/batch-management') ? 'text-red-500' : 'opacity-80'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5z" />
              </svg>
              <span className="text-sm font-semibold">Batch Management</span>
            </div>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isBatchExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Sub menu */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isBatchExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="pl-12 pr-4 space-y-1 pb-2">
              <Link
                href="/batch-management/talent-solution-1"
                className={`flex items-center px-4 py-2 rounded-lg text-sm transition-all duration-200 ${isActive('/batch-management/talent-solution-1')
                  ? 'bg-red-600/10 text-red-500 font-medium'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                  }`}
              >
                Talent Solution I
              </Link>
              <Link
                href="/batch-management/talent-solution-2"
                className={`flex items-center px-4 py-2 rounded-lg text-sm transition-all duration-200 ${isActive('/batch-management/talent-solution-2')
                  ? 'bg-red-600/10 text-red-500 font-medium'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                  }`}
              >
                Organizing Committee
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* --- VISUAL ELEMENT: SYSTEM STATUS INDICATOR --- 
          A small footer showing if the connection is active.
      */}
      <div className="p-6 border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center space-x-2.5 text-zinc-500">
          <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]"></div>
          <p className="text-xs font-semibold tracking-wide">System Operational</p>
        </div>
      </div>
    </aside>
  );
}
