'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-64 bg-blue-900 text-white shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-blue-800">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-blue-200 text-sm mt-1">Excel Data Manager</p>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <Link
          href="/"
          className={`flex items-center px-4 py-3 rounded-lg mb-2 transition ${
            isActive('/')
              ? 'bg-blue-700 text-white'
              : 'text-blue-100 hover:bg-blue-800'
          }`}
        >
          <svg
            className="w-5 h-5 mr-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          <span>Home</span>
        </Link>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 w-64 p-4 border-t border-blue-800">
        <p className="text-blue-200 text-xs text-center">
          © 2026 Excel Dashboard
        </p>
      </div>
    </aside>
  );
}
