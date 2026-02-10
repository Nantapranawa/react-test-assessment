'use client';

import { useState, useMemo } from 'react';
import { useData } from '../../lib/DataContext';
import { useRouter } from 'next/navigation';

export default function TalentManagementPage() {
    const { tableData, loading, refreshData } = useData();
    const router = useRouter();

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBP1, setSelectedBP1] = useState<Set<number>>(new Set());
    const [selectedBP2, setSelectedBP2] = useState<Set<number>>(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [locationBP1, setLocationBP1] = useState('');
    const [assessmentDateBP1, setAssessmentDateBP1] = useState('');
    const [locationBP2, setLocationBP2] = useState('');
    const [assessmentDateBP2, setAssessmentDateBP2] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Constants
    const QUOTA_BP1 = 3;
    const QUOTA_BP2 = 6;

    // Filter Data
    const filteredData = useMemo(() => {
        if (!tableData?.data) return [];
        const lowerSearch = searchTerm.toLowerCase();
        return tableData.data.filter((employee: any) =>
            employee.nama.toLowerCase().includes(lowerSearch) ||
            employee.nik.toString().includes(lowerSearch)
        );
    }, [tableData, searchTerm]);

    const bp1Employees = useMemo(() => filteredData.filter((e: any) => e.bp === 1), [filteredData]);
    const bp2Employees = useMemo(() => filteredData.filter((e: any) => e.bp === 2), [filteredData]);

    // Handlers
    const toggleSelection = (e: any, id: number, bp: number) => {
        if (bp === 1) {
            const newSet = new Set(selectedBP1);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                if (newSet.size < QUOTA_BP1) newSet.add(id);
            }
            setSelectedBP1(newSet);
        } else if (bp === 2) {
            const newSet = new Set(selectedBP2);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                if (newSet.size < QUOTA_BP2) newSet.add(id);
            }
            setSelectedBP2(newSet);
        }
    };

    const isBP1Ready = selectedBP1.size === QUOTA_BP1;
    const isBP2Ready = selectedBP2.size === QUOTA_BP2;
    const isSelectionComplete = isBP1Ready || isBP2Ready;
    const isBothSelected = isBP1Ready && isBP2Ready;

    const handleCreateBatch = async () => {
        setIsSubmitting(true);
        try {
            const promises = [];

            if (isBP1Ready) {
                promises.push(fetch('http://localhost:8000/api/batches', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        location: locationBP1,
                        assessmentDate: assessmentDateBP1,
                        employeeIds: Array.from(selectedBP1),
                        batchName: "BP 1 Batch"
                    })
                }));
            }

            if (isBP2Ready) {
                promises.push(fetch('http://localhost:8000/api/batches', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        location: locationBP2,
                        assessmentDate: assessmentDateBP2,
                        employeeIds: Array.from(selectedBP2),
                        batchName: "BP 2 Batch"
                    })
                }));
            }

            const responses = await Promise.all(promises);
            const results = await Promise.all(responses.map(r => r.json()));

            const failures = results.filter(r => !r.success);

            if (failures.length === 0) {
                await refreshData();
                router.push('/batch-management');
            } else {
                alert('Failed to create some batches: ' + failures.map(f => f.error).join(', '));
            }
        } catch (error) {
            alert('An error occurred');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper Custom Table
    const TalentTable = ({ title, employees, selectedSet, quota, bp }: { title: string, employees: any[], selectedSet: Set<number>, quota: number, bp: number }) => {
        const isQuotaReached = selectedSet.size >= quota;

        return (
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden mb-12">
                <div className="px-8 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                    <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${isQuotaReached ? 'bg-red-600' : 'bg-zinc-400'}`}></div>
                        <h3 className="text-xl font-bold text-zinc-900">{title}</h3>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${isQuotaReached
                        ? 'bg-red-50 text-red-700 border-red-100'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                        }`}>
                        Selected: {selectedSet.size} <span className="text-zinc-400 mx-1">/</span> {quota}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-base text-left">
                        <thead className="text-xs text-white uppercase bg-zinc-950 border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-5 font-bold tracking-wider">Select</th>
                                <th className="px-6 py-5 font-bold tracking-wider">No</th>
                                <th className="px-6 py-5 font-bold tracking-wider">Name</th>
                                <th className="px-6 py-5 font-bold tracking-wider">NIK</th>
                                <th className="px-6 py-5 font-bold tracking-wider">Position</th>
                                <th className="px-6 py-5 font-bold tracking-wider">Eligible</th>
                                <th className="px-6 py-5 font-bold tracking-wider">Expired</th>
                                <th className="px-6 py-5 font-bold tracking-wider">Result</th>
                                <th className="px-6 py-5 font-bold tracking-wider">Phone</th>
                                <th className="px-6 py-5 font-bold tracking-wider">TC Result</th>
                                <th className="px-6 py-5 font-bold tracking-wider">Ubis</th>
                                <th className="px-6 py-5 font-bold tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {employees.length > 0 ? employees.map((employee: any) => {
                                const isSelected = selectedSet.has(employee.id);
                                const isDisabled = !isSelected && isQuotaReached;

                                // Status badge logic
                                const status = employee.availability_status || 'No Invitation';
                                const lowerStatus = status.toLowerCase();
                                let badgeClass = "bg-zinc-100 text-zinc-600 border-zinc-200";
                                if (lowerStatus.includes("accepted")) badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                                else if (lowerStatus.includes("rejected")) badgeClass = "bg-red-50 text-red-700 border-red-100";
                                else if (lowerStatus.includes("pending")) badgeClass = "bg-amber-50 text-amber-700 border-amber-100";
                                else if (lowerStatus.includes("reschedule")) badgeClass = "bg-blue-50 text-blue-700 border-blue-100";
                                else if (lowerStatus.includes("draft")) badgeClass = "bg-orange-50 text-orange-700 border-orange-100";

                                return (
                                    <tr key={employee.id} className={`hover:bg-zinc-50/80 transition-all duration-200 group ${isSelected ? 'bg-red-50/40' : ''}`}>
                                        <td className="px-6 py-5">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    disabled={isDisabled}
                                                    onChange={(e) => toggleSelection(e, employee.id, bp)}
                                                    className="w-5 h-5 text-red-600 bg-white border-zinc-300 rounded-lg focus:ring-red-500 focus:ring-offset-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-zinc-500 font-medium">{employee.no}</td>
                                        <td className="px-6 py-5 font-bold text-zinc-900 whitespace-nowrap">{employee.nama}</td>
                                        <td className="px-6 py-5 text-zinc-500 font-mono text-sm">{employee.nik}</td>
                                        <td className="px-6 py-5 text-zinc-600 font-medium whitespace-nowrap">{employee.posisi}</td>
                                        <td className="px-6 py-5 text-zinc-600">{employee.eligible}</td>
                                        <td className="px-6 py-5 text-zinc-600 whitespace-nowrap">{employee.expired}</td>
                                        <td className="px-6 py-5 text-zinc-600">{employee.ac_result}</td>
                                        <td className="px-6 py-5 text-zinc-500">{employee.phone || '-'}</td>
                                        <td className="px-6 py-5 text-zinc-600">{employee.tc_result}</td>
                                        <td className="px-6 py-5 text-zinc-600">{employee.usulan_ubis}</td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider inline-flex items-center transform transition-transform group-hover:scale-105 whitespace-nowrap ${badgeClass}`}>
                                                {status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={12} className="px-6 py-12 text-center text-zinc-400 italic">No employees found matching your criteria.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-10 text-center text-zinc-500">Loading data...</div>;

    return (
        <div className="p-8 pb-32"> {/* pb-32 for sticky bar space */}

            {/* Header */}
            <div className="flex justify-between items-start mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Talent <span className="text-red-600">Solution I</span></h1>
                    <p className="text-zinc-500 mt-1">Select candidates for the new batch.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={!isSelectionComplete}
                    className={`px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-all ${isSelectionComplete
                        ? 'bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-md'
                        : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                        }`}
                >
                    Create Batch
                </button>
            </div>

            {/* Search */}
            <div className="mb-8 relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search candidates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500 sm:text-sm transition-all shadow-sm"
                />
            </div>

            {/* Tables */}
            <TalentTable title="BP 1 Candidates" employees={bp1Employees} selectedSet={selectedBP1} quota={QUOTA_BP1} bp={1} />
            <TalentTable title="BP 2 Candidates" employees={bp2Employees} selectedSet={selectedBP2} quota={QUOTA_BP2} bp={2} />

            {/* Sticky Bar */}
            <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-zinc-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 flex justify-between items-center">
                <div className="flex items-center space-x-8 px-4">
                    <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-zinc-500">BP 1 Selection</span>
                        <span className={`text-2xl font-bold ${selectedBP1.size === QUOTA_BP1 ? 'text-green-600' : 'text-zinc-900'}`}>{selectedBP1.size}<span className="text-zinc-300 text-lg">/</span>{QUOTA_BP1}</span>
                    </div>
                    <div className="w-px h-10 bg-zinc-200"></div>
                    <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-zinc-500">BP 2 Selection</span>
                        <span className={`text-2xl font-bold ${selectedBP2.size === QUOTA_BP2 ? 'text-green-600' : 'text-zinc-900'}`}>{selectedBP2.size}<span className="text-zinc-300 text-lg">/</span>{QUOTA_BP2}</span>
                    </div>
                </div>
                <div className="px-4">
                    {/* Duplicate Create Batch button for convenience, optional */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        disabled={!isSelectionComplete}
                        className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${isSelectionComplete
                            ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20'
                            : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                            }`}
                    >
                        Proceed to Creation
                    </button>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-zinc-900">Finalize Batch</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto">
                            {/* BP 1 Section */}
                            {(isBP1Ready) && (
                                <div className={`space-y-4 ${isBothSelected ? 'border-r pr-4 border-zinc-200' : 'col-span-2'}`}>
                                    <h3 className="text-lg font-bold text-zinc-800 flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
                                        BP 1 Batch Configuration
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Location</label>
                                        <input
                                            type="text"
                                            value={locationBP1}
                                            onChange={(e) => setLocationBP1(e.target.value)}
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm"
                                            placeholder="e.g. Jakarta HQ"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Assessment Date</label>
                                        <input
                                            type="date"
                                            value={assessmentDateBP1}
                                            onChange={(e) => setAssessmentDateBP1(e.target.value)}
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm"
                                        />
                                    </div>
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <p className="text-xs font-semibold text-zinc-500 mb-2">Selected Candidates ({selectedBP1.size})</p>
                                        <ul className="text-sm text-zinc-700 space-y-1 max-h-[100px] overflow-y-auto custom-scrollbar">
                                            {Array.from(selectedBP1).map(id => {
                                                const emp = tableData?.data.find((e: any) => e.id === id);
                                                return <li key={id} className="truncate text-xs">• {emp?.nama}</li>
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* BP 2 Section */}
                            {(isBP2Ready) && (
                                <div className={`space-y-4 ${isBothSelected ? '' : 'col-span-2'}`}>
                                    <h3 className="text-lg font-bold text-zinc-800 flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-zinc-800 mr-2"></div>
                                        BP 2 Batch Configuration
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Location</label>
                                        <input
                                            type="text"
                                            value={locationBP2}
                                            onChange={(e) => setLocationBP2(e.target.value)}
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm"
                                            placeholder="e.g. Bandung Office"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Assessment Date</label>
                                        <input
                                            type="date"
                                            value={assessmentDateBP2}
                                            onChange={(e) => setAssessmentDateBP2(e.target.value)}
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm"
                                        />
                                    </div>
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <p className="text-xs font-semibold text-zinc-500 mb-2">Selected Candidates ({selectedBP2.size})</p>
                                        <ul className="text-sm text-zinc-700 space-y-1 max-h-[100px] overflow-y-auto custom-scrollbar">
                                            {Array.from(selectedBP2).map(id => {
                                                const emp = tableData?.data.find((e: any) => e.id === id);
                                                return <li key={id} className="truncate text-xs">• {emp?.nama}</li>
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-zinc-600 font-medium text-sm hover:text-zinc-900"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateBatch}
                                disabled={isSubmitting || (isBP1Ready && (!locationBP1 || !assessmentDateBP1)) || (isBP2Ready && (!locationBP2 || !assessmentDateBP2))}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:shadow-none transition-all"
                            >
                                {isSubmitting ? 'Saving...' : 'Save & Create Batch'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

