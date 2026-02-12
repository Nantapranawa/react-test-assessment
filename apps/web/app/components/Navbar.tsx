'use client';

import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
    return (
        <header className="sticky top-0 z-30 w-full bg-white border-b border-zinc-200 px-10 py-5 flex justify-between items-center shadow-sm backdrop-blur-md bg-white/90">
            <div className="flex flex-col gap-0.5">
                <h1 className="text-2xl font-black text-zinc-950 tracking-tight uppercase">
                    Assessment Planning <span className="text-red-600">Platform</span>
                </h1>
            </div>
            <div className="flex items-center gap-6">
                <NotificationDropdown />
            </div>
        </header>
    );
}
