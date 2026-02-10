'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Batch {
    id: number;
    batchName: string | null;
    location: string;
    assessmentDate: string;
    createdAt: string;
    _count: {
        employees: number;
    };
    employees?: any[]; // For details
}

export default function BatchManagementPage() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/batches');
            const result = await res.json();
            if (result.success) {
                setBatches(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch batches', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (id: number) => {
        setDetailsLoading(true);
        setIsDetailsOpen(true);
        try {
            const res = await fetch(`http://localhost:8000/api/batches/${id}`);
            const result = await res.json();
            if (result.success) {
                setSelectedBatch(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch batch details', error);
        } finally {
            setDetailsLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-zinc-500">Loading batches...</div>;

    return (
        <div className="p-8">
            <div className="mb-10 flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
                    Batch <span className="text-red-600">Management</span>
                </h1>
                <p className="text-zinc-500 text-base font-medium">
                    Overview and details of all assessment batches.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-100 text-xs uppercase text-zinc-500 font-semibold">
                        <tr>
                            <th className="px-6 py-4">Batch ID</th>
                            <th className="px-6 py-4">Location</th>
                            <th className="px-6 py-4">Assessment Date</th>
                            <th className="px-6 py-4">Participants</th>
                            <th className="px-6 py-4">Created At</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {batches.length > 0 ? batches.map((batch) => (
                            <tr key={batch.id} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-zinc-900">#{batch.id}</td>
                                <td className="px-6 py-4 text-zinc-600">{batch.location}</td>
                                <td className="px-6 py-4 text-zinc-600">{new Date(batch.assessmentDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <span className="bg-zinc-100 text-zinc-700 text-xs px-2 py-1 rounded-full border border-zinc-200 font-medium">
                                        {batch._count?.employees || 0} Employees
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-zinc-500 text-sm">{new Date(batch.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleViewDetails(batch.id)}
                                        className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-zinc-400 italic">No batches found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Details Modal */}
            {isDetailsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-zinc-900">Batch Details #{selectedBatch?.id}</h2>
                                <p className="text-sm text-zinc-500">{selectedBatch?.location} - {selectedBatch?.assessmentDate && new Date(selectedBatch.assessmentDate).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => setIsDetailsOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-0 overflow-y-auto flex-1">
                            {detailsLoading ? (
                                <div className="p-10 text-center text-zinc-400">Loading details...</div>
                            ) : selectedBatch?.employees ? (
                                <table className="w-full text-left">
                                    <thead className="bg-zinc-50 border-b border-zinc-100 text-xs uppercase text-zinc-500">
                                        <tr>
                                            <th className="px-6 py-3">Selection Type (BP)</th>
                                            <th className="px-6 py-3">Name</th>
                                            <th className="px-6 py-3">NIK</th>
                                            <th className="px-6 py-3">Position</th>
                                            <th className="px-6 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {selectedBatch.employees.map((emp: any) => {
                                            const status = emp.availability_status || 'Not Yet Contacted';
                                            const lowerStatus = status.toLowerCase();
                                            let badgeClass = "bg-zinc-100 text-zinc-600 border-zinc-200";
                                            if (lowerStatus.includes("accepted")) badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                                            else if (lowerStatus.includes("rejected")) badgeClass = "bg-red-50 text-red-700 border-red-100";
                                            else if (lowerStatus.includes("pending")) badgeClass = "bg-amber-50 text-amber-700 border-amber-100";
                                            else if (lowerStatus.includes("reschedule")) badgeClass = "bg-blue-50 text-blue-700 border-blue-100";

                                            return (
                                                <tr key={emp.id} className="hover:bg-zinc-50/30">
                                                    <td className="px-6 py-3 font-medium text-zinc-900">BP {emp.bp}</td>
                                                    <td className="px-6 py-3 text-zinc-600">{emp.nama}</td>
                                                    <td className="px-6 py-3 text-zinc-500 font-mono text-xs">{emp.nik}</td>
                                                    <td className="px-6 py-3 text-zinc-500 text-sm">{emp.posisi}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badgeClass}`}>
                                                            {status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-8 text-center text-zinc-400">No employees found in this batch.</div>
                            )}
                        </div>

                        <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
                            <button
                                onClick={() => setIsDetailsOpen(false)}
                                className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-600 font-medium text-sm hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
