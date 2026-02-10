'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '../lib/DataContext';

interface Batch {
    id: number;
    batchName: string | null;
    location: string;
    assessmentDate: string;
    createdAt: string;
    _count: {
        employees: number;
    };
    employees?: { id: number; bp: number; availability_status: string }[];
}

export default function BatchManagementPage() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Replacement state
    const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
    const [replacingEmployee, setReplacingEmployee] = useState<any>(null); // The employee being replaced
    const [replaceSearchTerm, setReplaceSearchTerm] = useState('');
    const [isReplacing, setIsReplacing] = useState(false);

    // Delete state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [batchToDelete, setBatchToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { tableData, refreshData: refreshTalentPool } = useData();

    useEffect(() => {
        fetchBatches();
        const interval = setInterval(fetchBatches, 10000);
        return () => clearInterval(interval);
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
                // Sort once initially to establish stable rows
                const sortedEmployees = [...(result.data.employees || [])].sort((a, b) => {
                    if (a.bp !== b.bp) return a.bp - b.bp;
                    return a.id - b.id;
                });
                setSelectedBatch({ ...result.data, employees: sortedEmployees });
            }
        } catch (error) {
            console.error('Failed to fetch batch details', error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setBatchToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteBatch = async () => {
        if (!batchToDelete) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`http://localhost:8000/api/batches/${batchToDelete}`, {
                method: 'DELETE',
            });
            const result = await res.json();
            if (result.success) {
                // Refresh batches
                fetchBatches();
                setIsDeleteModalOpen(false);
                setBatchToDelete(null);
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Failed to delete batch', error);
            alert('Failed to delete batch');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleReplaceEmployee = async (newEmployeeId: number) => {
        if (!selectedBatch || !replacingEmployee) return;

        setIsReplacing(true);
        try {
            const res = await fetch(`http://localhost:8000/api/batches/${selectedBatch.id}/replace-employee`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    oldEmployeeId: replacingEmployee.id,
                    newEmployeeId
                })
            });
            const result = await res.json();
            if (result.success) {
                // Surgically update the local state to maintain row position
                if (selectedBatch && replacingEmployee) {
                    const updatedEmployees = selectedBatch.employees?.map(emp =>
                        emp.id === replacingEmployee.id ? result.data : emp
                    );
                    setSelectedBatch({ ...selectedBatch, employees: updatedEmployees });
                }

                // Refresh background lists but DONT re-fetch modal details 
                // because we want to preserve the current "slot" order
                fetchBatches();
                refreshTalentPool();

                setIsReplaceModalOpen(false);
                setReplacingEmployee(null);
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Failed to replace employee', error);
            alert('Failed to replace employee');
        } finally {
            setIsReplacing(false);
        }
    };

    const filteredCandidates = useMemo(() => {
        if (!tableData?.data || !replacingEmployee) return [];
        const lowerSearch = replaceSearchTerm.toLowerCase();

        // Show only employees with same BP AND status is "Not Yet Contacted"
        // OR any status that isn't "Batch Draft" (though "Batch Draft" means they are in a batch)
        return tableData.data.filter((emp: any) =>
            emp.bp === replacingEmployee.bp &&
            emp.availability_status === "Not Yet Contacted" &&
            (emp.nama.toLowerCase().includes(lowerSearch) || emp.nik.toString().includes(lowerSearch))
        );
    }, [tableData, replacingEmployee, replaceSearchTerm]);

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

            {/* BP 1 Batches */}
            <div className="mb-12">
                <div className="flex items-center space-x-2 mb-4">
                    <div className="w-2 h-6 bg-red-600 rounded-full"></div>
                    <h2 className="text-xl font-bold text-zinc-900">BP 1 Batches</h2>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                    <div className="overflow-x-auto">
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
                                {batches.filter(b => b.employees?.[0]?.bp === 1).length > 0 ? batches.filter(b => b.employees?.[0]?.bp === 1).map((batch) => (
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
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    onClick={() => handleViewDetails(batch.id)}
                                                    className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
                                                >
                                                    View Details
                                                </button>
                                                <button
                                                    className="bg-zinc-900 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-600 transition-colors"
                                                >
                                                    Send Message
                                                </button>
                                                {(() => {
                                                    const isDeletable = batch.employees?.every(e => e.availability_status === "Batch Draft");
                                                    return (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (isDeletable) handleDeleteClick(batch.id);
                                                            }}
                                                            className={`${isDeletable ? 'text-red-500 hover:text-red-700' : 'text-zinc-300 cursor-not-allowed'} transition-colors`}
                                                            title={isDeletable ? "Delete Batch" : "Cannot delete: Some employees have advanced status"}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-zinc-400 italic">No BP 1 batches found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* BP 2 Batches */}
            <div className="mb-8">
                <div className="flex items-center space-x-2 mb-4">
                    <div className="w-2 h-6 bg-zinc-800 rounded-full"></div>
                    <h2 className="text-xl font-bold text-zinc-900">BP 2 Batches</h2>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                    <div className="overflow-x-auto">
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
                                {batches.filter(b => b.employees?.[0]?.bp === 2).length > 0 ? batches.filter(b => b.employees?.[0]?.bp === 2).map((batch) => (
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
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    onClick={() => handleViewDetails(batch.id)}
                                                    className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
                                                >
                                                    View Details
                                                </button>
                                                <button
                                                    className="bg-zinc-900 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-600 transition-colors"
                                                >
                                                    Send Message
                                                </button>
                                                {(() => {
                                                    const isDeletable = batch.employees?.every(e => e.availability_status === "Batch Draft");
                                                    return (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (isDeletable) handleDeleteClick(batch.id);
                                                            }}
                                                            className={`${isDeletable ? 'text-red-500 hover:text-red-700' : 'text-zinc-300 cursor-not-allowed'} transition-colors`}
                                                            title={isDeletable ? "Delete Batch" : "Cannot delete: Some employees have advanced status"}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-zinc-400 italic">No BP 2 batches found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {isDetailsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
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
                                            <th className="px-6 py-3">Assessment Date</th>
                                            <th className="px-6 py-3">Position</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {selectedBatch.employees?.map((emp: any) => {
                                            const status = emp.availability_status || 'Not Yet Contacted';
                                            const lowerStatus = status.toLowerCase();
                                            let badgeClass = "bg-zinc-100 text-zinc-600 border-zinc-200";
                                            if (lowerStatus.includes("accepted")) badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                                            else if (lowerStatus.includes("rejected")) badgeClass = "bg-red-50 text-red-700 border-red-100";
                                            else if (lowerStatus.includes("pending")) badgeClass = "bg-amber-50 text-amber-700 border-amber-100";
                                            else if (lowerStatus.includes("reschedule")) badgeClass = "bg-blue-50 text-blue-700 border-blue-100";
                                            else if (lowerStatus.includes("draft")) badgeClass = "bg-orange-50 text-orange-700 border-orange-100";

                                            return (
                                                <tr key={emp.id} className="hover:bg-zinc-50/30">
                                                    <td className="px-6 py-3 font-medium text-zinc-900">BP {emp.bp}</td>
                                                    <td className="px-6 py-3 text-zinc-600">{emp.nama}</td>
                                                    <td className="px-6 py-3 text-zinc-500 font-mono text-xs">{emp.nik}</td>
                                                    <td className="px-6 py-3 text-zinc-600 text-sm">{selectedBatch.assessmentDate && new Date(selectedBatch.assessmentDate).toLocaleDateString()}</td>
                                                    <td className="px-6 py-3 text-zinc-500 text-sm">{emp.posisi}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badgeClass}`}>
                                                            {status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        {lowerStatus === "batch draft" && (
                                                            <button
                                                                onClick={() => {
                                                                    setReplacingEmployee(emp);
                                                                    setIsReplaceModalOpen(true);
                                                                }}
                                                                className="text-xs font-bold text-zinc-900 hover:text-red-600 transition-colors uppercase tracking-tight underline underline-offset-4"
                                                            >
                                                                Replace
                                                            </button>
                                                        )}
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

            {/* Replacement Modal */}
            {isReplaceModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-950 text-white">
                            <div>
                                <h2 className="text-xl font-bold">Replace Employee</h2>
                                <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-bold">
                                    Replacing: <span className="text-red-500">{replacingEmployee?.nama}</span> (BP {replacingEmployee?.bp})
                                </p>
                            </div>
                            <button onClick={() => setIsReplaceModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 bg-zinc-50/50 border-b border-zinc-100">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by name or NIK..."
                                    value={replaceSearchTerm}
                                    onChange={(e) => setReplaceSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 p-0">
                            <table className="w-full text-left table-fixed">
                                <thead className="bg-zinc-100 border-b border-zinc-200 text-[10px] uppercase text-zinc-500 font-bold sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 w-1/3">Candidate Name</th>
                                        <th className="px-6 py-3 w-1/4">NIK</th>
                                        <th className="px-6 py-3 w-1/4">Position</th>
                                        <th className="px-6 py-3 text-right pr-10">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {filteredCandidates.length > 0 ? filteredCandidates.map((candidate: any) => (
                                        <tr key={candidate.id} className="hover:bg-red-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-zinc-900 truncate">{candidate.nama}</div>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{candidate.nik}</td>
                                            <td className="px-6 py-4 text-zinc-600 text-sm truncate">{candidate.posisi}</td>
                                            <td className="px-6 py-4 text-right pr-6">
                                                <button
                                                    onClick={() => handleReplaceEmployee(candidate.id)}
                                                    disabled={isReplacing}
                                                    className="bg-zinc-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 disabled:opacity-50 transition-all uppercase tracking-tight"
                                                >
                                                    {isReplacing ? '...' : 'Select'}
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-zinc-400 italic text-sm">
                                                No eligible BP {replacingEmployee?.bp} candidates found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
                            <button
                                onClick={() => setIsReplaceModalOpen(false)}
                                className="px-4 py-2 text-zinc-500 hover:text-zinc-900 font-bold text-xs uppercase tracking-widest transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-zinc-100 flex items-center space-x-4 bg-red-50/50">
                            <div className="p-3 bg-red-100 text-red-600 rounded-full">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900">Delete Batch #{batchToDelete}</h3>
                                <p className="text-sm text-zinc-500">This action cannot be undone immediately.</p>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-zinc-600 text-sm leading-relaxed">
                                Are you sure you want to delete this batch? All employees in this batch will be reverted to <strong className="text-zinc-900">"Not Yet Contacted"</strong> status and will be available for selection again.
                            </p>
                        </div>

                        <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 font-medium text-sm rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteBatch}
                                className="px-4 py-2 bg-red-600 text-white font-medium text-sm rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50"
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Yes, Delete Batch'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
