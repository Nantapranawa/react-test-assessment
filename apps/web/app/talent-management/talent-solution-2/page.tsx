'use client';

export default function TalentManagementPage() {
    return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
            <div className="bg-zinc-50 p-8 rounded-full mb-8 border border-zinc-100 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 mb-3 tracking-tight">Talent Solution <span className="text-red-600">II</span></h1>
            <p className="text-lg text-zinc-500 font-medium mb-8 max-w-md mx-auto">
                We're working hard to bring you the advanced features of Talent Solution II. Stay tuned for updates.
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-full text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
                Under Development
            </div>
        </div>
    );
}
