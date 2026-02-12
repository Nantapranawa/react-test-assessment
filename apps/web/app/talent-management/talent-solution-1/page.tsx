'use client';

import { useState, useMemo } from 'react';
import { useData } from '../../lib/DataContext';
import { useRouter } from 'next/navigation';

export default function TalentManagementPage() {
    const { tableData, loading, refreshData } = useData();
    const router = useRouter();

    const formatDate = (dateInput: string | Date | null | undefined) => {
        if (!dateInput) return '-';

        // If it's already in DD/MM/YYYY or DD-MM-YYYY, return as is or normalize
        if (typeof dateInput === 'string' && /^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/.test(dateInput)) {
            return dateInput.replace(/-/g, '/');
        }

        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return String(dateInput);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBP1, setSelectedBP1] = useState<Set<number>>(new Set());
    const [selectedBP2, setSelectedBP2] = useState<Set<number>>(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [locationBP1, setLocationBP1] = useState('');
    const [assessmentDateBP1, setAssessmentDateBP1] = useState('');
    const [assessmentTimeBP1, setAssessmentTimeBP1] = useState('');
    const [locationBP2, setLocationBP2] = useState('');
    const [assessmentDateBP2, setAssessmentDateBP2] = useState('');
    const [assessmentTimeBP2, setAssessmentTimeBP2] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter State
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

    // Constants
    const QUOTA_BP1 = 3;
    const QUOTA_BP2 = 6;

    const FILTER_COLUMNS = [
        { key: 'posisi', label: 'Position' },
        { key: 'availability_status', label: 'Status' },
        { key: 'eligible', label: 'Eligibility' },
        { key: 'ac_result', label: 'AC Result' },
        { key: 'tc_result', label: 'TC Result' },
    ];

    // Filter Helpers
    const getUniqueValues = (column: string) => {
        if (!tableData?.data) return [];
        const values = new Set(tableData.data.map((item: any) => {
            if (column === 'availability_status') {
                return item[column] || 'No Invitation';
            }
            return item[column] || '-';
        }));
        return Array.from(values).sort() as string[];
    };

    const toggleFilterValue = (column: string, value: string) => {
        setSelectedFilters(prev => {
            const currentValues = prev[column] || [];
            if (currentValues.includes(value)) {
                const nextValues = currentValues.filter(v => v !== value);
                const nextFilters = { ...prev };
                if (nextValues.length === 0) {
                    delete nextFilters[column];
                } else {
                    nextFilters[column] = nextValues;
                }
                return nextFilters;
            } else {
                return { ...prev, [column]: [...currentValues, value] };
            }
        });
    };

    // Filter Data Logic
    const filteredData = useMemo(() => {
        if (!tableData?.data) return [];
        let data = tableData.data;

        // Apply Search
        const lowerSearch = searchTerm.toLowerCase();
        data = data.filter((employee: any) =>
            employee.nama.toLowerCase().includes(lowerSearch) ||
            employee.nik.toString().includes(lowerSearch)
        );

        // Apply Filters (AND between columns, OR within column)
        Object.entries(selectedFilters).forEach(([column, values]) => {
            if (values.length > 0) {
                data = data.filter((employee: any) => {
                    const empValue = column === 'availability_status'
                        ? (employee[column] || 'No Invitation')
                        : (employee[column] || '-');
                    return values.includes(empValue);
                });
            }
        });

        return data;
    }, [tableData, searchTerm, selectedFilters]);

    const bp1Employees = useMemo(() => filteredData.filter((e: any) => e.bp === 1), [filteredData]);
    const bp2Employees = useMemo(() => filteredData.filter((e: any) => e.bp === 2), [filteredData]);

    // Handlers
    const toggleSelection = (e: any, id: number, bp: number) => {
        if (bp === 1) {
            const newSet = new Set(selectedBP1);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            setSelectedBP1(newSet);
        } else if (bp === 2) {
            const newSet = new Set(selectedBP2);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            setSelectedBP2(newSet);
        }
    };

    const isBP1Ready = selectedBP1.size > 0;
    const isBP2Ready = selectedBP2.size > 0;
    const isSelectionComplete = isBP1Ready || isBP2Ready;
    const isBothSelected = isBP1Ready && isBP2Ready;

    const handleCreateBatch = async () => {
        setIsSubmitting(true);
        try {
            const promises = [];

            if (isBP1Ready) {
                // Combine date and time
                const dateTime = assessmentTimeBP1
                    ? `${assessmentDateBP1}T${assessmentTimeBP1}:00`
                    : `${assessmentDateBP1}T00:00:00`;

                promises.push(fetch('http://localhost:8000/api/batches', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        location: locationBP1,
                        assessmentDate: dateTime,
                        employeeIds: Array.from(selectedBP1),
                        batchName: "BP 1 Batch"
                    })
                }));
            }

            if (isBP2Ready) {
                // Combine date and time
                const dateTime = assessmentTimeBP2
                    ? `${assessmentDateBP2}T${assessmentTimeBP2}:00`
                    : `${assessmentDateBP2}T00:00:00`;

                promises.push(fetch('http://localhost:8000/api/batches', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        location: locationBP2,
                        assessmentDate: dateTime,
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
        // const isQuotaReached = selectedSet.size >= quota; 
        // quota is unused but kept in props to avoid changing call sites for now, or just ignore it.


        return (
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden mb-12">
                <div className="px-8 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                    <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${selectedSet.size > 0 ? 'bg-red-600' : 'bg-zinc-400'}`}></div>
                        <h3 className="text-xl font-bold text-zinc-900">{title}</h3>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${selectedSet.size > 0
                        ? 'bg-red-50 text-red-700 border-red-100'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                        }`}>
                        Selected: {selectedSet.size}
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
                                <th className="px-6 py-5 font-bold tracking-wider">Expire Date</th>
                                <th className="px-6 py-5 font-bold tracking-wider">AC Result</th>
                                <th className="px-6 py-5 font-bold tracking-wider">Phone</th>
                                <th className="px-6 py-5 font-bold tracking-wider">TC Result</th>
                                <th className="px-6 py-5 font-bold tracking-wider">Ubis</th>
                                <th className="px-6 py-5 font-bold tracking-wider">Availability</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {employees.length > 0 ? employees.map((employee: any) => {
                                const isSelected = selectedSet.has(employee.id);
                                const status = employee.availability_status || 'No Invitation';
                                const isAlreadyInBatch = status !== 'No Invitation';
                                const isDisabled = isAlreadyInBatch;

                                // Status badge logic
                                const lowerStatus = status.toLowerCase();
                                let badgeClass = "bg-zinc-100 text-zinc-600 border-zinc-200";
                                if (lowerStatus.includes("accepted")) badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                                else if (lowerStatus.includes("rejected")) badgeClass = "bg-red-50 text-red-700 border-red-100";
                                else if (lowerStatus.includes("sent")) badgeClass = "bg-amber-50 text-amber-700 border-amber-100";
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
                                        <td className="px-6 py-5 text-zinc-600 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <span>{formatDate(employee.expired)}</span>
                                                {(() => {
                                                    const dateStr = employee.expired;
                                                    if (!dateStr) return null;

                                                    let expireDate: Date | null = null;

                                                    // Try parsing common formats
                                                    // 1. Try ISO/standard format first
                                                    const d = new Date(dateStr);
                                                    if (!isNaN(d.getTime())) {
                                                        expireDate = d;
                                                    } else {
                                                        // 2. Try DD/MM/YYYY or DD-MM-YYYY (Common in ID)
                                                        const parts = dateStr.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
                                                        if (parts) {
                                                            const day = parseInt(parts[1], 10);
                                                            const month = parseInt(parts[2], 10) - 1; // Months are 0-indexed
                                                            const year = parseInt(parts[3], 10);
                                                            expireDate = new Date(year, month, day);
                                                        }
                                                    }

                                                    if (expireDate && !isNaN(expireDate.getTime())) {
                                                        const today = new Date();
                                                        today.setHours(0, 0, 0, 0);
                                                        expireDate.setHours(0, 0, 0, 0); // Normalize expire date just in case

                                                        if (today > expireDate) {
                                                            return (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 border border-red-200 uppercase tracking-wide">
                                                                    Expired
                                                                </span>
                                                            );
                                                        }
                                                    }

                                                    return null;
                                                })()}
                                            </div>
                                        </td>
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

            {/* Search and Filters */}
            <div className="flex flex-col space-y-4 mb-8">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    {/* Search Bar - Premium Style */}
                    <div className="relative flex-1 max-w-md w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name or NIK..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-12 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all shadow-sm text-sm"
                        />
                    </div>

                    {/* Filter Trigger Button */}
                    <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className={`px-5 py-3.5 rounded-2xl border font-bold flex items-center space-x-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${Object.keys(selectedFilters).length > 0
                            ? 'bg-zinc-900 text-white border-zinc-900 shadow-xl shadow-zinc-900/20'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 shadow-sm'
                            }`}
                    >
                        <div className="relative">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            {Object.keys(selectedFilters).length > 0 && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                        </div>
                        <span className="text-sm">Filter Options</span>
                        {Object.keys(selectedFilters).length > 0 && (
                            <div className="flex items-center justify-center bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full ring-2 ring-white">
                                {Object.values(selectedFilters).flat().length}
                            </div>
                        )}
                    </button>
                </div>

                {/* Active Filter Chips - Red Colored */}
                {Object.keys(selectedFilters).length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center animate-in fade-in slide-in-from-top-2 duration-300">
                        {Object.entries(selectedFilters).map(([column, values]) =>
                            values.map((val) => (
                                <button
                                    key={`${column}-${val}`}
                                    onClick={() => toggleFilterValue(column, val)}
                                    className="group inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 hover:border-red-200 transition-all shadow-sm"
                                >
                                    <span className="opacity-50 mr-1.5 text-[10px] uppercase tracking-wider">{FILTER_COLUMNS.find(c => c.key === column)?.label}</span>
                                    {val}
                                    <svg className="w-3.5 h-3.5 ml-2 opacity-40 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            ))
                        )}
                        <button
                            onClick={() => setSelectedFilters({})}
                            className="text-xs font-bold text-zinc-400 hover:text-red-600 ml-2 transition-colors flex items-center"
                        >
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Reset All
                        </button>
                    </div>
                )}
            </div>

            {/* Filter Modal - Simple & Clean Design */}
            {isFilterModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-zinc-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-zinc-900">Filters</h2>
                                <p className="text-xs text-zinc-500">Refine the candidate list</p>
                            </div>
                            <button
                                onClick={() => setIsFilterModalOpen(false)}
                                className="p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content - Single Column List */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {FILTER_COLUMNS.map((col) => (
                                <div key={col.key} className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">{col.label}</h3>
                                        {selectedFilters[col.key]?.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    const nextFilters = { ...selectedFilters };
                                                    delete nextFilters[col.key];
                                                    setSelectedFilters(nextFilters);
                                                }}
                                                className="text-[10px] font-bold text-red-600 hover:underline"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {getUniqueValues(col.key).map((value) => {
                                            const isSelected = selectedFilters[col.key]?.includes(value);
                                            return (
                                                <button
                                                    key={value}
                                                    onClick={() => toggleFilterValue(col.key, value)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${isSelected
                                                        ? 'bg-red-600 border-red-600 text-white'
                                                        : 'bg-white border-zinc-100 text-zinc-600 hover:border-zinc-300'
                                                        }`}
                                                >
                                                    {value}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                            <button
                                onClick={() => setSelectedFilters({})}
                                className="text-xs font-bold text-zinc-400 hover:text-zinc-900"
                            >
                                Reset All
                            </button>
                            <button
                                onClick={() => setIsFilterModalOpen(false)}
                                className="px-8 py-3 bg-zinc-950 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all text-sm shadow-lg shadow-zinc-950/10"
                            >
                                Show {filteredData.length} Candidates
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tables */}
            <TalentTable title="BP 1 Candidates" employees={bp1Employees} selectedSet={selectedBP1} quota={QUOTA_BP1} bp={1} />
            <TalentTable title="BP 2 Candidates" employees={bp2Employees} selectedSet={selectedBP2} quota={QUOTA_BP2} bp={2} />

            {/* Sticky Bar */}
            <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-zinc-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 flex justify-between items-center">
                <div className="flex items-center space-x-8 px-4">
                    <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-zinc-500">BP 1 Selection</span>
                        <span className={`text-2xl font-bold ${selectedBP1.size > 0 ? 'text-green-600' : 'text-zinc-900'}`}>{selectedBP1.size}</span>
                    </div>
                    <div className="w-px h-10 bg-zinc-200"></div>
                    <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-zinc-500">BP 2 Selection</span>
                        <span className={`text-2xl font-bold ${selectedBP2.size > 0 ? 'text-green-600' : 'text-zinc-900'}`}>{selectedBP2.size}</span>
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
                                        <label className="block text-base font-semibold text-zinc-700 mb-1">Location</label>
                                        <input
                                            type="text"
                                            value={locationBP1}
                                            onChange={(e) => setLocationBP1(e.target.value)}
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-base text-zinc-900 bg-white"
                                            placeholder="e.g. Telkom Hub"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-base font-semibold text-zinc-700 mb-1">Assessment Date</label>
                                            <input
                                                type="date"
                                                value={assessmentDateBP1}
                                                onChange={(e) => setAssessmentDateBP1(e.target.value)}
                                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-base text-zinc-900 bg-white accent-red-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-base font-semibold text-zinc-700 mb-1">Time</label>
                                            <input
                                                type="time"
                                                value={assessmentTimeBP1}
                                                onChange={(e) => setAssessmentTimeBP1(e.target.value)}
                                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-base text-zinc-900 bg-white accent-red-600"
                                            />
                                        </div>
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
                                        <label className="block text-base font-semibold text-zinc-700 mb-1">Location</label>
                                        <input
                                            type="text"
                                            value={locationBP2}
                                            onChange={(e) => setLocationBP2(e.target.value)}
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-base text-zinc-900 bg-white"
                                            placeholder="e.g. Grha Merah Putih"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-base font-semibold text-zinc-700 mb-1">Assessment Date</label>
                                            <input
                                                type="date"
                                                value={assessmentDateBP2}
                                                onChange={(e) => setAssessmentDateBP2(e.target.value)}
                                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-base text-zinc-900 bg-white accent-red-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-base font-semibold text-zinc-700 mb-1">Time</label>
                                            <input
                                                type="time"
                                                value={assessmentTimeBP2}
                                                onChange={(e) => setAssessmentTimeBP2(e.target.value)}
                                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-base text-zinc-900 bg-white accent-red-600"
                                            />
                                        </div>
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
                                disabled={isSubmitting || (isBP1Ready && (!locationBP1 || !assessmentDateBP1 || !assessmentTimeBP1)) || (isBP2Ready && (!locationBP2 || !assessmentDateBP2 || !assessmentTimeBP2))}
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

