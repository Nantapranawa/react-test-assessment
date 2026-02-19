'use client';

import { useState, useMemo } from 'react';
import { useData } from '../../lib/DataContext';
import { useRouter } from 'next/navigation';

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

const isExpired = (dateInput: string | Date | null | undefined): boolean => {
    if (!dateInput) return false;

    let expireDate: Date | null = null;

    if (typeof dateInput === 'string' && /^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/.test(dateInput)) {
        const parts = dateInput.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
        if (parts) {
            const day = parseInt(parts[1], 10);
            const month = parseInt(parts[2], 10) - 1;
            const year = parseInt(parts[3], 10);
            expireDate = new Date(year, month, day);
        }
    } else {
        const d = new Date(dateInput);
        if (!isNaN(d.getTime())) {
            expireDate = d;
        }
    }

    if (expireDate && !isNaN(expireDate.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expireDate.setHours(0, 0, 0, 0);
        return today > expireDate;
    }

    return false;
};

interface TalentTableProps {
    title: string;
    employees: any[];
    selectedSet: Set<string>;
    quota: number;
    bp: number;
    onToggleSelection: (e: any, nik: string, bp: number) => void;
    onRowClick: (employee: any) => void;
    onDeleteRow: (nik: string) => void;
    isEditMode: boolean;
}


const TalentTable = ({ title, employees, selectedSet, quota, bp, onToggleSelection, onRowClick, onDeleteRow, isEditMode }: TalentTableProps) => {
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
                            {isEditMode && <th className="px-6 py-5 font-bold tracking-wider">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {employees.length > 0 ? employees.map((employee: any, index: number) => {
                            const isSelected = selectedSet.has(employee.nik);
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
                                <tr key={employee.id}
                                    onClick={() => onRowClick(employee)}
                                    className={`hover:bg-zinc-50/80 transition-all duration-200 group cursor-pointer ${isSelected ? 'bg-red-50/40' : ''}`}>
                                    <td className="px-6 py-5">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                disabled={isDisabled}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => onToggleSelection(e, employee.nik, bp)}
                                                className="w-5 h-5 text-red-600 bg-white border-zinc-300 rounded-lg focus:ring-red-500 focus:ring-offset-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-zinc-500 font-medium">{index + 1}</td>
                                    <td className="px-6 py-5 font-bold text-zinc-900 whitespace-nowrap">{employee.nama}</td>
                                    <td className="px-6 py-5 text-zinc-500 font-mono text-sm">{employee.nik}</td>
                                    <td className="px-6 py-5 text-zinc-600 font-medium whitespace-nowrap">{employee.posisi}</td>
                                    <td className="px-6 py-5 text-zinc-600">{employee.eligible}</td>
                                    <td className="px-6 py-5 text-zinc-600 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            <span>{formatDate(employee.expired)}</span>
                                            {isExpired(employee.expired) && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 border border-red-200 uppercase tracking-wide">
                                                    Expired
                                                </span>
                                            )}
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
                                    {isEditMode && (
                                        <td className="px-6 py-5">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteRow(employee.nik);
                                                }}
                                                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Remove Employee"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    )}
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

export default function TalentManagementPage() {
    const { tableData, loading, refreshData } = useData();
    const router = useRouter();



    /**
     * Determines the primary priority tier (1-6) based on:
     *   1. Expired + High Potential
     *   2. Expired + Promotable
     *   3. Not Expired + High Potential
     *   4. Not Expired + Promotable
     *   5. Expired + (neither High Potential nor Promotable)
     *   6. Not Expired + (neither High Potential nor Promotable)
     */
    const getPriorityTier = (employee: any): number => {
        const expired = isExpired(employee.expired);
        const tcResult = (employee.tc_result || '').toLowerCase().trim();
        const isHighPotential = tcResult.includes('high potential');
        const isPromotable = tcResult.includes('promotable');

        if (expired && isHighPotential) return 1;
        if (expired && isPromotable) return 2;
        if (!expired && isHighPotential) return 3;
        if (!expired && isPromotable) return 4;
        if (expired) return 5;   // Expired but neither HP nor Promotable
        return 6;                // Not expired, neither HP nor Promotable
    };

    /**
     * Returns secondary sort keys as an array of numeric ranks:
     *   [ubisRank, eligibilityRank, readinessRank]
     *
     * UBIS: OK=0, NOK=1, other=2
     * Eligibility: Eligible=0, Not Eligible=1, other=2
     * Readiness (ac_result): Ready=0, Ready with Development=1, Not Ready=2, other=3
     */
    const getSecondarySortKeys = (employee: any): [number, number, number] => {
        // UBIS Status
        const ubis = (employee.usulan_ubis || '').toUpperCase().trim();
        let ubisRank = 2;
        if (ubis === 'OK') ubisRank = 0;
        else if (ubis === 'NOK') ubisRank = 1;

        // Eligibility Status
        const elig = (employee.eligible || '').toLowerCase().trim();
        let eligRank = 2;
        if (elig === 'eligible') eligRank = 0;
        else if (elig === 'not eligible') eligRank = 1;

        // Readiness Status (ac_result)
        const readiness = (employee.ac_result || '').toLowerCase().trim();
        let readinessRank = 3;
        if (readiness === 'ready') readinessRank = 0;
        else if (readiness === 'ready with development') readinessRank = 1;
        else if (readiness === 'not ready') readinessRank = 2;

        return [ubisRank, eligRank, readinessRank];
    };

    /**
     * Comparator function for sorting employees by priority.
     * First by primary tier, then by secondary keys (UBIS → Eligibility → Readiness).
     */
    const priorityComparator = (a: any, b: any): number => {
        const tierA = getPriorityTier(a);
        const tierB = getPriorityTier(b);
        if (tierA !== tierB) return tierA - tierB;

        const [ubisA, eligA, readA] = getSecondarySortKeys(a);
        const [ubisB, eligB, readB] = getSecondarySortKeys(b);

        if (ubisA !== ubisB) return ubisA - ubisB;
        if (eligA !== eligB) return eligA - eligB;
        return readA - readB;
    };

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBP1, setSelectedBP1] = useState<Set<string>>(new Set());
    const [selectedBP2, setSelectedBP2] = useState<Set<string>>(new Set());
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

    // Employee Detail & Reschedule State
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [isEmployeeDetailModalOpen, setIsEmployeeDetailModalOpen] = useState(false);

    // Reschedule State
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [rescheduleLocation, setRescheduleLocation] = useState('');
    const [isRescheduling, setIsRescheduling] = useState(false);

    // Add Employee State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newEmployee, setNewEmployee] = useState<any>({
        nama: '',
        nik: '',
        bp: 1,
        posisi: '',
        phone: '',
        eligible: 'Eligible',
        tc_result: '',
        ac_result: '',
        usulan_ubis: 'OK',
        expired: ''
    });

    // Edit Mode State
    const [isEditMode, setIsEditMode] = useState(false);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Notification State
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');

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

    // Filter Data Logic (with Priority Sorting applied)
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

        // Apply Priority Sorting
        data = [...data].sort(priorityComparator);

        return data;
    }, [tableData, searchTerm, selectedFilters]);

    const bp1Employees = useMemo(() => filteredData.filter((e: any) => e.bp === 1), [filteredData]);
    const bp2Employees = useMemo(() => filteredData.filter((e: any) => e.bp === 2), [filteredData]);

    // Handlers
    const toggleSelection = (e: any, nik: string, bp: number) => {
        if (bp === 1) {
            const newSet = new Set(selectedBP1);
            if (newSet.has(nik)) {
                newSet.delete(nik);
            } else {
                newSet.add(nik);
            }
            setSelectedBP1(newSet);
        } else if (bp === 2) {
            const newSet = new Set(selectedBP2);
            if (newSet.has(nik)) {
                newSet.delete(nik);
            } else {
                newSet.add(nik);
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
                        employeeNiks: Array.from(selectedBP1),
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
                        employeeNiks: Array.from(selectedBP2),
                        batchName: "BP 2 Batch"
                    })
                }));
            }

            const responses = await Promise.all(promises);
            const results = await Promise.all(responses.map(r => r.json()));

            const failures = results.filter(r => !r.success);

            if (failures.length === 0) {
                await refreshData();
                setIsModalOpen(false); // Close the modal
                setNotificationMessage('Batch created successfully');
                setShowNotification(true);
                setTimeout(() => {
                    router.push('/batch-management');
                }, 2000);
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

    const handleEmployeeClick = (employee: any) => {
        setSelectedEmployee(employee);
        setIsEmployeeDetailModalOpen(true);
    };

    const handleRescheduleClick = () => {
        if (!selectedEmployee) return;
        setRescheduleLocation('');
        setRescheduleDate('');
        setRescheduleTime('');
        setIsRescheduleModalOpen(true);
    };

    const handleAddEmployee = async () => {
        if (!newEmployee.nama || !newEmployee.nik) {
            alert("Name and NIK are required");
            return;
        }

        setIsAdding(true);
        try {
            const res = await fetch('http://localhost:8000/api/data/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newEmployee,
                    talent_solution: 1
                })
            });
            const result = await res.json();

            if (result.success) {
                setIsAddModalOpen(false);
                setNewEmployee({
                    nama: '',
                    nik: '',
                    bp: 1,
                    posisi: '',
                    phone: '',
                    eligible: 'Eligible',
                    tc_result: '',
                    ac_result: '',
                    usulan_ubis: 'OK',
                    expired: ''
                });
                await refreshData();
                setNotificationMessage('Employee added successfully');
                setShowNotification(true);
                setTimeout(() => setShowNotification(false), 3000);
            } else {
                alert('Failed to add employee: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to add employee');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteEmployee = (nik: string) => {
        setEmployeeToDelete(nik);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteEmployee = async () => {
        if (!employeeToDelete) return;
        setIsDeleting(true);

        try {
            const res = await fetch(`http://localhost:8000/api/data/employees/${employeeToDelete}?talent_solution=1`, {
                method: 'DELETE'
            });
            const result = await res.json();

            if (result.success) {
                await refreshData();
                setNotificationMessage('Employee removed successfully');
                setShowNotification(true);
                setTimeout(() => setShowNotification(false), 3000);
                setIsDeleteModalOpen(false);
                setEmployeeToDelete(null);
            } else {
                alert('Failed to remove employee: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to remove employee');
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmReschedule = async () => {
        if (!selectedEmployee || !rescheduleDate || !rescheduleTime || !rescheduleLocation) {
            alert("Please fill in all fields.");
            return;
        }

        setIsRescheduling(true);
        try {
            const dateTime = `${rescheduleDate}T${rescheduleTime}:00`;
            const res = await fetch('http://localhost:8000/api/batches/reschedule-employee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeNik: selectedEmployee.nik,
                    location: rescheduleLocation,
                    assessmentDate: dateTime
                })
            });
            const result = await res.json();

            if (result.success) {
                setIsRescheduleModalOpen(false);
                setIsEmployeeDetailModalOpen(false);
                setSelectedEmployee(null);
                await refreshData();
                setNotificationMessage('Employee rescheduled successfully');
                setShowNotification(true);
                setTimeout(() => setShowNotification(false), 3000);
            } else {
                alert('Failed to reschedule: ' + result.error);
            }
        } catch (error) {
            console.error('Failed to reschedule', error);
            alert('Failed to reschedule');
        } finally {
            setIsRescheduling(false);
        }
    };



    if (loading) return <div className="p-10 text-center text-zinc-500">Loading data...</div>;

    return (
        <div className="p-8 pb-32"> {/* pb-32 for sticky bar space */}

            {/* Header */}
            <div className="flex justify-between items-start mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Talent Solution <span className="text-red-600">I</span></h1>
                    <p className="text-zinc-500 text-xl">Select candidates for the new batch.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-all flex items-center space-x-2 border ${isEditMode
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>{isEditMode ? 'Done Editing' : 'Edit List'}</span>
                    </button>
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
                    {isEditMode && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-6 py-2.5 bg-white text-zinc-900 border border-zinc-200 rounded-lg font-semibold shadow-sm hover:bg-zinc-50 hover:shadow-md transition-all flex items-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Add Employee</span>
                        </button>
                    )}
                </div>
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
            <TalentTable title="BP 1 Candidates" employees={bp1Employees} selectedSet={selectedBP1} quota={QUOTA_BP1} bp={1} onToggleSelection={toggleSelection} onRowClick={handleEmployeeClick} onDeleteRow={handleDeleteEmployee} isEditMode={isEditMode} />
            <TalentTable title="BP 2 Candidates" employees={bp2Employees} selectedSet={selectedBP2} quota={QUOTA_BP2} bp={2} onToggleSelection={toggleSelection} onRowClick={handleEmployeeClick} onDeleteRow={handleDeleteEmployee} isEditMode={isEditMode} />

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
                                            {Array.from(selectedBP1).map(nik => {
                                                const emp = tableData?.data.find((e: any) => e.nik === nik);
                                                return <li key={nik} className="truncate text-xs">• {emp?.nama}</li>
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
                                            {Array.from(selectedBP2).map(nik => {
                                                const emp = tableData?.data.find((e: any) => e.nik === nik);
                                                return <li key={nik} className="truncate text-xs">• {emp?.nama}</li>
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

            {/* Employee Detail Modal */}
            {isEmployeeDetailModalOpen && selectedEmployee && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/20 backdrop-blur-[2px] p-4 animate-in fade-in duration-200" onClick={() => setIsEmployeeDetailModalOpen(false)}>
                    <div
                        className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-bold text-xl">
                                    {selectedEmployee.nama.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-900 leading-tight">{selectedEmployee.nama}</h2>
                                    <p className="text-xs text-zinc-500 font-mono mt-0.5">{selectedEmployee.nik}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEmployeeDetailModalOpen(false)}
                                className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                {/* Left Column: Basic Info */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Employment Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <span className="block text-s text-zinc-500 mb-1">Position</span>
                                            <span className="text-sm font-semibold text-zinc-900">{selectedEmployee.posisi}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="block text-s text-zinc-500 mb-1">Band Position</span>
                                                <span className="text-sm font-semibold text-zinc-900">BP {selectedEmployee.bp}</span>
                                            </div>
                                            <div>
                                                <span className="block text-s text-zinc-500 mb-1">Eligibility</span>
                                                <span className="text-sm font-semibold text-zinc-900">
                                                    {selectedEmployee.eligible}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="block text-s text-zinc-500 mb-1">Phone Number</span>
                                                <span className="text-sm font-semibold text-zinc-900">{selectedEmployee.phone || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="block text-s text-zinc-500 mb-1">Expiry Date</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-semibold text-zinc-900">{formatDate(selectedEmployee.expired)}</span>
                                                    {(() => {
                                                        const dateStr = selectedEmployee.expired;
                                                        if (!dateStr) return null;
                                                        let expireDate: Date | null = null;
                                                        const d = new Date(dateStr);
                                                        if (!isNaN(d.getTime())) {
                                                            expireDate = d;
                                                        } else {
                                                            const parts = dateStr.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
                                                            if (parts) {
                                                                const day = parseInt(parts[1], 10);
                                                                const month = parseInt(parts[2], 10) - 1;
                                                                const year = parseInt(parts[3], 10);
                                                                expireDate = new Date(year, month, day);
                                                            }
                                                        }
                                                        if (expireDate && !isNaN(expireDate.getTime())) {
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            expireDate.setHours(0, 0, 0, 0);
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
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Results & Status */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Results & Status</h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                                <span className="block text-[11px] text-zinc-500 mb-1 uppercase font-bold">AC Result</span>
                                                <span className="text-base font-semibold text-zinc-900">{selectedEmployee.ac_result}</span>
                                            </div>
                                            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                                <span className="block text-[11px] text-zinc-500 mb-1 uppercase font-bold">TC Result</span>
                                                <span className="text-base font-semibold text-zinc-900">{selectedEmployee.tc_result}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="block text-s text-zinc-500 mb-1">Availability Status</span>
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${(() => {
                                                const s = (selectedEmployee.availability_status || 'No Invitation').toLowerCase();
                                                if (s.includes('accepted')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
                                                if (s.includes('rejected')) return 'bg-red-50 text-red-700 border-red-100';
                                                if (s.includes('sent')) return 'bg-amber-50 text-amber-700 border-amber-100';
                                                if (s.includes('reschedule')) return 'bg-blue-50 text-blue-700 border-blue-100';
                                                if (s.includes('draft')) return 'bg-orange-50 text-orange-700 border-orange-100';
                                                return 'bg-zinc-100 text-zinc-600 border-zinc-200';
                                            })()}`}>
                                                {selectedEmployee.availability_status || 'No Invitation'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 border-t border-zinc-100 bg-zinc-50/50 flex justify-end space-x-3">
                            {(selectedEmployee.availability_status || '').toLowerCase().includes('reschedule') && (
                                <button
                                    onClick={handleRescheduleClick}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-all shadow-sm flex items-center space-x-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <span>Reschedule Assessment</span>
                                </button>
                            )}
                            <button
                                onClick={() => setIsEmployeeDetailModalOpen(false)}
                                className="px-4 py-2 border border-zinc-200 text-zinc-600 rounded-lg font-bold text-sm hover:bg-zinc-50 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {isRescheduleModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-950/20 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200">
                        <div className="px-8 py-6 border-b border-zinc-100 bg-zinc-50/50">
                            <h3 className="text-lg font-bold text-zinc-900 leading-tight">Reschedule Assessment</h3>
                            <p className="text-xs text-zinc-500 mt-1">Updating session for <span className="font-bold text-zinc-900">{selectedEmployee?.nama}</span></p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Proposed Location</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={rescheduleLocation}
                                        onChange={(e) => setRescheduleLocation(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all outline-none placeholder-zinc-400"
                                        placeholder="e.g. Office Hall A"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">New Date</label>
                                    <input
                                        type="date"
                                        value={rescheduleDate}
                                        onChange={(e) => setRescheduleDate(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">New Time</label>
                                    <input
                                        type="time"
                                        value={rescheduleTime}
                                        onChange={(e) => setRescheduleTime(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 border-t border-zinc-100 bg-zinc-50/50 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsRescheduleModalOpen(false)}
                                className="px-4 py-2 text-zinc-600 font-bold text-sm hover:text-zinc-900 transition-all"
                                disabled={isRescheduling}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmReschedule}
                                disabled={isRescheduling}
                                className="px-5 py-2 bg-zinc-900 text-white font-bold text-sm rounded-lg hover:bg-zinc-800 shadow-sm transition-all disabled:opacity-50 flex items-center space-x-2"
                            >
                                {isRescheduling ? (
                                    <>
                                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span>Saving...</span>
                                    </>
                                ) : 'Update Schedule'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Employee Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/20 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200">
                        <div className="px-8 py-6 border-b border-zinc-100 bg-zinc-50/50">
                            <h3 className="text-lg font-bold text-zinc-900 leading-tight">Add New Employee</h3>
                        </div>

                        <div className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1">NIK *</label>
                                    <input
                                        type="text"
                                        value={newEmployee.nik}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, nik: e.target.value })}
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 bg-white"
                                        placeholder="NIK"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        value={newEmployee.nama}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, nama: e.target.value })}
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 bg-white"
                                        placeholder="Full Name"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1">Band Position</label>
                                    <select
                                        value={newEmployee.bp}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, bp: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white text-zinc-900"
                                    >
                                        <option value={1}>BP 1</option>
                                        <option value={2}>BP 2</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1">Position</label>
                                    <input
                                        type="text"
                                        value={newEmployee.posisi}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, posisi: e.target.value })}
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 bg-white"
                                        placeholder="Job Position"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={newEmployee.phone}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 bg-white"
                                        placeholder="Phone Number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1">Expire Date</label>
                                    <input
                                        type="date"
                                        value={newEmployee.expired}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, expired: e.target.value })}
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-900 bg-white"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1">AC Result</label>
                                    <select
                                        value={newEmployee.ac_result}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, ac_result: e.target.value })}
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white text-zinc-900"
                                    >
                                        <option value="">Select...</option>
                                        <option value="Ready">Ready</option>
                                        <option value="Ready with Development">Ready with Development</option>
                                        <option value="Not Ready">Not Ready</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1">TC Result</label>
                                    <input
                                        type="text"
                                        value={newEmployee.tc_result}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, tc_result: e.target.value })}
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 bg-white"
                                        placeholder="e.g. High Potential"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1">Ubis</label>
                                    <select
                                        value={newEmployee.usulan_ubis}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, usulan_ubis: e.target.value })}
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white text-zinc-900"
                                    >
                                        <option value="OK">OK</option>
                                        <option value="NOK">NOK</option>
                                        <option value="Unknown">Unknown</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1">Eligibility</label>
                                    <select
                                        value={newEmployee.eligible}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, eligible: e.target.value })}
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white text-zinc-900"
                                    >
                                        <option value="Eligible">Eligible</option>
                                        <option value="Not Eligible">Not Eligible</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 border-t border-zinc-100 bg-zinc-50/50 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-4 py-2 text-zinc-600 font-bold text-sm hover:text-zinc-900 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddEmployee}
                                disabled={isAdding}
                                className="px-5 py-2 bg-zinc-900 text-white font-bold text-sm rounded-lg hover:bg-zinc-800 shadow-sm transition-all disabled:opacity-50"
                            >
                                {isAdding ? 'Adding...' : 'Add Employee'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200">
                        <div className="px-8 py-6 border-b border-zinc-100 bg-red-50/30 flex items-center space-x-4">
                            <div className="p-3 bg-red-100 text-red-600 rounded-2xl shadow-sm">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 leading-tight">Remove Employee?</h3>
                                <p className="text-xs text-zinc-500 mt-0.5">This action cannot be undone.</p>
                            </div>
                        </div>

                        <div className="p-8">
                            <p className="text-zinc-600 text-sm leading-relaxed">
                                Are you sure you want to remove this employee from the Talent Pool? They will no longer be available for batch selection.
                            </p>
                        </div>

                        <div className="px-8 py-5 border-t border-zinc-100 bg-zinc-50/50 flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setEmployeeToDelete(null);
                                }}
                                className="px-4 py-2 border border-zinc-200 text-zinc-600 rounded-lg font-bold text-sm hover:bg-white hover:border-zinc-300 transition-all shadow-sm"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteEmployee}
                                className="px-5 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center space-x-2"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span>Removing...</span>
                                    </>
                                ) : (
                                    <span>Remove Employee</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Notification */}
            {showNotification && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="bg-emerald-50 border border-emerald-200 shadow-lg px-6 py-4 rounded-xl flex items-center space-x-3">
                        <div className="p-2 bg-emerald-100 rounded-full">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-emerald-900">Success</h4>
                            <p className="text-xs text-emerald-700 font-medium">{notificationMessage}</p>
                        </div>
                        <button
                            onClick={() => setShowNotification(false)}
                            className="ml-4 text-emerald-500 hover:text-emerald-700"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}

