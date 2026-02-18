'use client';

export default function BatchManagementPage() {
    return (
        <div className="p-8 pb-32 flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
            <div className="bg-zinc-50 p-8 rounded-full mb-8 border border-zinc-100 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            </div>

            <h1 className="text-3xl font-bold text-zinc-900 mb-3 tracking-tight">Batch <span className="text-red-600">Management (TS II)</span></h1>

            <p className="text-lg text-zinc-500 font-medium mb-8 max-w-md mx-auto">
                Advanced batch management for Talent Solution II is currently under development.
            </p>

            <div className="inline-flex items-center px-4 py-2 bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-full text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
                Under Development
            </div>
        </div>
    );
}
