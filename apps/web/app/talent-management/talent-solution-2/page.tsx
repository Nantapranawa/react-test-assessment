'use client';

export default function TalentSolution2Page() {
    return (
        <div className="p-8 pb-32 flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">Talent <span className="text-red-600">Solution II</span></h1>
            <p className="text-zinc-500 max-w-md">
                This solution is currently under development. Check back later for updates.
            </p>
        </div>
    );
}
