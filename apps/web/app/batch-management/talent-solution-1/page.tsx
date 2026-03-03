'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '../../lib/DataContext';

interface Batch {
    id: number;
    batchName: string | null;
    location: string;
    assessmentDate: string;
    createdAt: string;
    _count: {
        employees: number;
    };
    employees?: { id: number; nik: string; bp: number; availability_status: string }[];
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

    // Message Modal State
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageBatch, setMessageBatch] = useState<Batch | null>(null);
    const [messageLoading, setMessageLoading] = useState(false);


    // Edit Batch State
    const [isEditingBatch, setIsEditingBatch] = useState(false);
    const [editLocation, setEditLocation] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editTime, setEditTime] = useState('');
    const [isSavingBatch, setIsSavingBatch] = useState(false);

    // Send Confirmation State
    const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);
    const [isSendingInvitations, setIsSendingInvitations] = useState(false);

    // Reschedule State
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [reschedulingEmployee, setReschedulingEmployee] = useState<any>(null);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [rescheduleLocation, setRescheduleLocation] = useState('');
    const [isRescheduling, setIsRescheduling] = useState(false);

    // Add Employee State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addSearchTerm, setAddSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Staged Changes State
    const [stagedEmployees, setStagedEmployees] = useState<any[]>([]);

    // Notification State
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');

    // Resend State
    const [isResendingRecord, setIsResendingRecord] = useState<Record<number, boolean>>({});
    const [now, setNow] = useState<number>(0);
    const [isResendConfirmOpen, setIsResendConfirmOpen] = useState(false);
    const [employeeToResend, setEmployeeToResend] = useState<any>(null);

    useEffect(() => {
        setNow(Date.now());
        const timer = setInterval(() => setNow(Date.now()), 10000);
        return () => clearInterval(timer);
    }, []);

    const handleResendMessage = async (employeeId: number) => {
        if (!selectedBatch) return;
        setIsResendingRecord(prev => ({ ...prev, [employeeId]: true }));
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/batches/${selectedBatch.id}/send-invitations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId })
            });
            const result = await res.json();
            if (result.success) {
                fetchBatches();
                handleViewDetails(selectedBatch.id);
                setNotificationMessage('Invitation resent successfully');
                setShowNotification(true);
                setTimeout(() => setShowNotification(false), 3000);
            } else {
                alert('Failed to resend: ' + result.error);
            }
        } catch (error) {
            console.error('Failed to resend message', error);
            alert('Failed to resend message');
        } finally {
            setIsResendingRecord(prev => ({ ...prev, [employeeId]: false }));
        }
    };

    const handleConfirmResend = async () => {
        if (!employeeToResend) return;
        await handleResendMessage(employeeToResend.id);
        setIsResendConfirmOpen(false);
        setEmployeeToResend(null);
    };

    const formatDate = (dateInput: string | Date | null | undefined) => {
        if (!dateInput) return '-';
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return String(dateInput);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // ── Priority Sorting Helpers ──
    const isExpired = (dateInput: string | Date | null | undefined): boolean => {
        if (!dateInput) return false;
        let expireDate: Date | null = null;
        if (typeof dateInput === 'string' && /^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/.test(dateInput)) {
            const parts = dateInput.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
            if (parts) {
                expireDate = new Date(parseInt(parts[3], 10), parseInt(parts[2], 10) - 1, parseInt(parts[1], 10));
            }
        } else {
            const d = new Date(dateInput);
            if (!isNaN(d.getTime())) expireDate = d;
        }
        if (expireDate && !isNaN(expireDate.getTime())) {
            const today = new Date(); today.setHours(0, 0, 0, 0); expireDate.setHours(0, 0, 0, 0);
            return today > expireDate;
        }
        return false;
    };

    const getPriorityTier = (employee: any): number | null => {
        const expired = isExpired(employee.expired);
        const tcResult = (employee.tc_result || '').toLowerCase().trim();
        const isHP = tcResult.includes('high potential');
        const isProm = tcResult.includes('promotable');
        if (expired && isHP) return 1;
        if (expired && isProm) return 2;
        if (!expired && isHP) return 3;
        if (!expired && isProm) return 4;
        return null;
    };

    const getSecondarySortKeys = (employee: any): [number, number, number] => {
        const ubis = (employee.usulan_ubis || '').toUpperCase().trim();
        let ubisRank = 2;
        if (ubis === 'OK') ubisRank = 0;
        else if (ubis === 'NOK') ubisRank = 1;

        const elig = (employee.eligible || '').toLowerCase().trim();
        let eligRank = 2;
        if (elig === 'eligible') eligRank = 0;
        else if (elig === 'not eligible') eligRank = 1;

        const readiness = (employee.ac_result || '').toLowerCase().trim();
        let readinessRank = 3;
        if (readiness === 'ready') readinessRank = 0;
        else if (readiness === 'ready with development') readinessRank = 1;
        else if (readiness === 'not ready') readinessRank = 2;

        return [ubisRank, eligRank, readinessRank];
    };

    const priorityComparator = (a: any, b: any): number => {
        const tierA = getPriorityTier(a);
        const tierB = getPriorityTier(b);

        if (tierA !== null && tierB !== null) {
            if (tierA !== tierB) return tierA - tierB;
            const [ubisA, eligA, readA] = getSecondarySortKeys(a);
            const [ubisB, eligB, readB] = getSecondarySortKeys(b);
            if (ubisA !== ubisB) return ubisA - ubisB;
            if (eligA !== eligB) return eligA - eligB;
            return readA - readB;
        }

        if (tierA !== null) return -1;
        if (tierB !== null) return 1;

        return 0;
    };

    const { tableData, refreshData: refreshTalentPool } = useData();

    useEffect(() => {
        fetchBatches();
        const interval = setInterval(fetchBatches, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchBatches = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/batches`);
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
        setIsEditingBatch(false); // Reset edit mode
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/batches/${id}`);
            const result = await res.json();
            if (result.success) {
                // Sort once initially to establish stable rows
                const sortedEmployees = [...(result.data.employees || [])].sort((a: any, b: any) => {
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

    const handleEditBatchClick = () => {
        if (!selectedBatch) return;
        setEditLocation(selectedBatch.location);
        const dateObj = new Date(selectedBatch.assessmentDate);
        setEditDate(dateObj.toISOString().split('T')[0]);
        setEditTime(dateObj.toTimeString().slice(0, 5));
        setStagedEmployees([...(selectedBatch.employees || [])]);
        setIsEditingBatch(true);
    };

    const handleCancelEdit = () => {
        setIsEditingBatch(false);
    };

    const handleSaveBatch = async () => {
        if (!selectedBatch) return;
        setIsSavingBatch(true);
        try {
            const dateTime = `${editDate}T${editTime}:00`;
            const originalDate = new Date(selectedBatch.assessmentDate).toISOString().split('T')[0];
            const originalTime = new Date(selectedBatch.assessmentDate).toTimeString().slice(0, 5);

            // Compare employees
            const originalEmployeeNiks = selectedBatch.employees?.map((e: any) => e.nik) || [];
            const currentEmployeeNiks = stagedEmployees.map((e: any) => e.nik);
            const hasEmployeeChanges = JSON.stringify(originalEmployeeNiks) !== JSON.stringify(currentEmployeeNiks);

            const hasChanged = editLocation !== selectedBatch.location ||
                editDate !== originalDate ||
                editTime !== originalTime ||
                hasEmployeeChanges;

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/batches/${selectedBatch.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location: editLocation,
                    assessmentDate: dateTime,
                    employeeNiks: currentEmployeeNiks
                })
            });
            const result = await res.json();
            if (result.success) {
                if (hasChanged) {
                    setNotificationMessage('Batch updated successfully');
                    setShowNotification(true);
                    setTimeout(() => setShowNotification(false), 3000);
                }
                setIsEditingBatch(false);
                fetchBatches();
                handleViewDetails(selectedBatch.id);
                refreshTalentPool();
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Failed to save batch', error);
            alert('Failed to save batch');
        } finally {
            setIsSavingBatch(false);
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/batches/${batchToDelete}`, {
                method: 'DELETE',
            });
            const result = await res.json();
            if (result.success) {
                // Refresh batches
                fetchBatches();
                setIsDeleteModalOpen(false);
                setBatchToDelete(null);
                setNotificationMessage('Batch deleted successfully');
                setShowNotification(true);
                setTimeout(() => setShowNotification(false), 3000);
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

    const handleReplaceEmployee = async (newEmployeeNik: string) => {
        if (!selectedBatch || !replacingEmployee) return;

        // If in edit mode, just stage the change locally
        if (isEditingBatch) {
            try {
                // Use existing tableData instead of fetching
                if (tableData?.data) {
                    const newEmp = tableData.data.find((e: any) => e.nik === newEmployeeNik);
                    if (newEmp) {
                        // Check BP
                        if (newEmp.bp !== replacingEmployee.bp) {
                            alert(`New employee BP (${newEmp.bp}) must match replaced employee BP (${replacingEmployee.bp})`);
                            return;
                        }

                        const updatedStaged = stagedEmployees.map(emp =>
                            emp.nik === replacingEmployee.nik ? { ...newEmp, availability_status: "Batch Draft" } : emp
                        );
                        setStagedEmployees(updatedStaged);
                        setIsReplaceModalOpen(false);
                        setReplacingEmployee(null);
                        setReplaceSearchTerm('');
                    }
                }
            } catch (error) {
                console.error("Failed to stage replacement", error);
            }
            return;
        }

        setIsReplacing(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/batches/${selectedBatch.id}/replace-employee`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    oldEmployeeNik: replacingEmployee.nik,
                    newEmployeeNik
                })
            });
            const result = await res.json();
            if (result.success) {
                if (selectedBatch && replacingEmployee) {
                    const updatedEmployees = selectedBatch.employees?.map(emp =>
                        emp.nik === replacingEmployee.nik ? result.data : emp
                    );
                    setSelectedBatch({ ...selectedBatch, employees: updatedEmployees });
                }

                fetchBatches();
                refreshTalentPool();

                setIsReplaceModalOpen(false);
                setReplacingEmployee(null);
                setReplaceSearchTerm('');

                setNotificationMessage('Employee replaced successfully');
                setShowNotification(true);
                setTimeout(() => setShowNotification(false), 3000);
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

    const handleOpenMessageModal = async (id: number) => {
        setMessageLoading(true);
        setIsMessageModalOpen(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/batches/${id}`);
            const result = await res.json();
            if (result.success) {
                // Sort once initially to establish stable rows
                const sortedEmployees = [...(result.data.employees || [])].sort((a: any, b: any) => {
                    if (a.bp !== b.bp) return a.bp - b.bp;
                    return a.id - b.id;
                });
                setMessageBatch({ ...result.data, employees: sortedEmployees });
            }
        } catch (error) {
            console.error('Failed to fetch batch details', error);
        } finally {
            setMessageLoading(false);
        }
    };

    const handleSendMessageClick = () => {
        setIsSendConfirmOpen(true);
    };

    const confirmSendMessage = async () => {
        if (!messageBatch) return;
        setIsSendingInvitations(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/batches/${messageBatch.id}/send-invitations`, {
                method: 'POST',
            });
            const result = await res.json();
            if (result.success) {
                setIsSendConfirmOpen(false);
                setIsMessageModalOpen(false);
                fetchBatches();
                refreshTalentPool();
                // alert('Invitations sent and status updated to "Sent"');
            } else {
                alert('Failed to send invitations: ' + result.error);
            }
        } catch (error) {
            console.error('Failed to send message', error);
            alert('Failed to send message');
        } finally {
            setIsSendingInvitations(false);
        }
    };

    const handleRescheduleClick = (employee: any) => {
        setReschedulingEmployee(employee);
        // Pre-fill with current batch details or empty?
        // Let's pre-fill for convenience
        if (selectedBatch) {
            setRescheduleLocation(selectedBatch.location);
            const dateObj = new Date(selectedBatch.assessmentDate);
            setRescheduleDate(dateObj.toISOString().split('T')[0]);
            setRescheduleTime(dateObj.toTimeString().slice(0, 5));
        }
        setIsRescheduleModalOpen(true);
    };

    const confirmReschedule = async () => {
        if (!reschedulingEmployee || !rescheduleDate || !rescheduleTime || !rescheduleLocation) {
            alert("Please fill in all fields.");
            return;
        }

        setIsRescheduling(true);
        try {
            const dateTime = `${rescheduleDate}T${rescheduleTime}:00`;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/batches/reschedule-employee`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeNik: reschedulingEmployee.nik,
                    location: rescheduleLocation,
                    assessmentDate: dateTime
                })
            });
            const result = await res.json();

            if (result.success) {
                // Update local state: remove the employee from the current batch view
                if (selectedBatch) {
                    const updatedEmployees = selectedBatch.employees?.filter(e => e.nik !== reschedulingEmployee.nik);
                    setSelectedBatch({ ...selectedBatch, employees: updatedEmployees, _count: { employees: (selectedBatch._count?.employees || 1) - 1 } });
                }

                setIsRescheduleModalOpen(false);
                setReschedulingEmployee(null);
                fetchBatches(); // Refresh main list
                refreshTalentPool();

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

    const handleAddEmployee = async (employeeNik: string) => {
        if (!selectedBatch) return;

        // If in edit mode, stage locally
        if (isEditingBatch) {
            try {
                // Use existing tableData instead of fetching
                if (tableData?.data) {
                    const newEmp = tableData.data.find((e: any) => e.nik === employeeNik);
                    if (newEmp) {
                        // Check BP
                        const batchBp = stagedEmployees.length > 0 ? stagedEmployees[0].bp : null;
                        if (batchBp !== null && newEmp.bp !== batchBp) {
                            alert(`Employee BP (${newEmp.bp}) does not match Batch BP (${batchBp})`);
                            return;
                        }

                        setStagedEmployees([...stagedEmployees, { ...newEmp, availability_status: "Batch Draft" }]);
                        setIsAddModalOpen(false);
                        setAddSearchTerm('');
                    }
                }
            } catch (error) {
                console.error("Failed to stage addition", error);
            }
            return;
        }

        setIsAdding(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/batches/${selectedBatch.id}/add-employee`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeNik })
            });
            const result = await res.json();
            if (result.success) {
                if (result.data) {
                    const sortedEmployees = [...(result.data.employees || [])].sort((a: any, b: any) => {
                        if (a.bp !== b.bp) return a.bp - b.bp;
                        return a.id - b.id;
                    });
                    setSelectedBatch({ ...result.data, employees: sortedEmployees });
                } else {
                    handleViewDetails(selectedBatch.id);
                }

                setIsAddModalOpen(false);
                fetchBatches();
                refreshTalentPool();

                setNotificationMessage('Employee added successfully');
                setShowNotification(true);
                setTimeout(() => setShowNotification(false), 3000);
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Failed to add employee', error);
            alert('Failed to add employee');
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveEmployee = async (employeeNik: string) => {
        if (isEditingBatch) {
            setStagedEmployees(stagedEmployees.filter(e => e.nik !== employeeNik));
            return;
        }

        if (!selectedBatch) return;

        if (!confirm("Are you sure you want to remove this employee?")) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/batches/${selectedBatch.id}/remove-employee`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeNik })
            });
            const result = await res.json();
            if (result.success) {
                const updatedEmployees = selectedBatch.employees?.filter(e => e.nik !== employeeNik);
                setSelectedBatch({ ...selectedBatch, employees: updatedEmployees, _count: { employees: (selectedBatch._count?.employees || 1) - 1 } });
                fetchBatches();
                refreshTalentPool();
                setNotificationMessage('Employee removed successfully');
                setShowNotification(true);
                setTimeout(() => setShowNotification(false), 3000);
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Failed to remove employee', error);
            alert('Failed to remove employee');
        }
    };

    const filteredCandidates = useMemo(() => {
        if (!tableData?.data || !replacingEmployee) return [];
        const lowerSearch = replaceSearchTerm.toLowerCase();
        const currentEmployees = isEditingBatch ? stagedEmployees : (selectedBatch?.employees || []);

        const filtered = tableData.data.filter((emp: any) => {
            // An employee is available if they have "No Invitation" status
            // OR if they were originally in this batch and we are currently editing it
            const isOriginalMember = selectedBatch?.employees?.some((e: any) => e.nik === emp.nik);
            const isAvailable = emp.availability_status === "No Invitation" || (isEditingBatch && isOriginalMember);
            const isInCurrentDraft = currentEmployees.some((e: any) => e.nik === emp.nik);

            return emp.bp === replacingEmployee.bp &&
                isAvailable &&
                !isInCurrentDraft &&
                (emp.nama.toLowerCase().includes(lowerSearch) || emp.nik.toString().includes(lowerSearch));
        });
        return [...filtered].sort(priorityComparator);
    }, [tableData, replacingEmployee, replaceSearchTerm, isEditingBatch, stagedEmployees, selectedBatch]);

    const availableCandidates = useMemo(() => {
        if (!tableData?.data || !selectedBatch) return [];
        const lowerSearch = addSearchTerm.toLowerCase();

        const currentEmployees = isEditingBatch ? stagedEmployees : (selectedBatch.employees || []);
        // Determine target BP from original batch if draft is empty, otherwise from draft
        const targetBp = currentEmployees.length > 0 ? currentEmployees[0].bp : selectedBatch.employees?.[0]?.bp;

        if (!targetBp) return [];

        const filtered = tableData.data.filter((emp: any) => {
            const isOriginalMember = selectedBatch?.employees?.some((e: any) => e.nik === emp.nik);
            const isAvailable = emp.availability_status === "No Invitation" || (isEditingBatch && isOriginalMember);
            const isInCurrentDraft = currentEmployees.some((e: any) => e.nik === emp.nik);

            return emp.bp === targetBp &&
                isAvailable &&
                !isInCurrentDraft &&
                (emp.nama.toLowerCase().includes(lowerSearch) || emp.nik.toString().includes(lowerSearch));
        });
        return [...filtered].sort(priorityComparator);
    }, [tableData, selectedBatch, addSearchTerm, isEditingBatch, stagedEmployees]);

    if (loading) return <div className="p-10 text-center text-zinc-500">Loading batches...</div>;

    return (
        <div className="p-8">
            <div className="mb-10 flex flex-col gap-0.5">
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                    Batch <span className="text-red-600">Management (TS I)</span>
                </h1>
                <p className="text-zinc-500 text-sm font-medium">
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
                            <thead className="bg-zinc-50 border-b border-zinc-100 text-sm uppercase text-zinc-500 font-semibold">
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
                                        <td className="px-6 py-4 text-zinc-600">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{formatDate(batch.assessmentDate)}</span>
                                                <span className="text-xs text-zinc-500">{new Date(batch.assessmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-zinc-100 text-zinc-700 text-sm px-2 py-1 rounded-full border border-zinc-200 font-medium">
                                                {batch._count?.employees || 0} Employees
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 text-base">{formatDate(batch.createdAt)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-between w-full">
                                                <button
                                                    onClick={() => handleViewDetails(batch.id)}
                                                    className="text-red-600 hover:text-red-700 font-medium text-base transition-colors"
                                                >
                                                    View Details
                                                </button>
                                                <div className="flex items-center space-x-4">
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
                                                    {(() => {
                                                        const isSent = batch.employees?.some(e => e.availability_status.toLowerCase() === "sent");
                                                        return (
                                                            <button
                                                                onClick={() => !isSent && handleOpenMessageModal(batch.id)}
                                                                disabled={isSent}
                                                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isSent
                                                                    ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
                                                                    : 'bg-zinc-900 text-white hover:bg-red-600'
                                                                    }`}
                                                            >
                                                                {isSent ? 'Message Sent' : 'Send Message'}
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
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
                            <thead className="bg-zinc-50 border-b border-zinc-100 text-sm uppercase text-zinc-500 font-semibold">
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
                                        <td className="px-6 py-4 text-zinc-600">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{formatDate(batch.assessmentDate)}</span>
                                                <span className="text-xs text-zinc-500">{new Date(batch.assessmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-zinc-100 text-zinc-700 text-sm px-2 py-1 rounded-full border border-zinc-200 font-medium">
                                                {batch._count?.employees || 0} Employees
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 text-base">{formatDate(batch.createdAt)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-between w-full">
                                                <button
                                                    onClick={() => handleViewDetails(batch.id)}
                                                    className="text-red-600 hover:text-red-700 font-medium text-base transition-colors"
                                                >
                                                    View Details
                                                </button>
                                                <div className="flex items-center space-x-4">
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
                                                    {(() => {
                                                        const isSent = batch.employees?.some(e => e.availability_status.toLowerCase() === "sent");
                                                        return (
                                                            <button
                                                                onClick={() => !isSent && handleOpenMessageModal(batch.id)}
                                                                disabled={isSent}
                                                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isSent
                                                                    ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
                                                                    : 'bg-zinc-900 text-white hover:bg-red-600'
                                                                    }`}
                                                            >
                                                                {isSent ? 'Message Sent' : 'Send Message'}
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
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
                        <div className="p-6 border-b border-zinc-100 flex justify-between items-start bg-zinc-50/50">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-zinc-900 mb-2">Batch Details #{selectedBatch?.id}</h2>
                                {isEditingBatch ? (
                                    <div className="flex space-x-4 items-end animate-in fade-in duration-200">
                                        <div className="flex-1 max-w-xs">
                                            <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase tracking-wider">Location</label>
                                            <input
                                                type="text"
                                                value={editLocation}
                                                onChange={(e) => setEditLocation(e.target.value)}
                                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-base text-zinc-900 bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase tracking-wider">Date</label>
                                            <input
                                                type="date"
                                                value={editDate}
                                                onChange={(e) => setEditDate(e.target.value)}
                                                className="px-3 py-2 border border-zinc-300 rounded-lg text-base text-zinc-900 bg-white accent-[#e11d48]"
                                                style={{ colorScheme: 'light' }}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase tracking-wider">Time</label>
                                            <input
                                                type="time"
                                                value={editTime}
                                                onChange={(e) => setEditTime(e.target.value)}
                                                className="px-3 py-2 border border-zinc-300 rounded-lg text-base text-zinc-900 bg-white accent-[#e11d48]"
                                                style={{ colorScheme: 'light' }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-zinc-500">
                                        {selectedBatch?.location} - {selectedBatch?.assessmentDate && formatDate(selectedBatch.assessmentDate)}
                                        <span className="ml-2 font-mono bg-zinc-100 px-2 py-0.5 rounded text-xs text-zinc-600">
                                            {selectedBatch?.assessmentDate && new Date(selectedBatch.assessmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                {isEditingBatch ? (
                                    <>
                                        <button
                                            onClick={handleSaveBatch}
                                            disabled={isSavingBatch}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-600/20 disabled:opacity-50 transition-all flex items-center space-x-2"
                                        >
                                            {isSavingBatch ? (
                                                <span>Saving...</span>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    <span>Save Changes</span>
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            disabled={isSavingBatch}
                                            className="px-4 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-bold text-sm hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {(() => {
                                            const isEditable = true;
                                            return (
                                                <button
                                                    onClick={handleEditBatchClick}
                                                    disabled={!isEditable}
                                                    className={`px-4 py-2 border rounded-lg font-bold text-sm transition-colors flex items-center space-x-2 ${isEditable
                                                        ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300'
                                                        : 'bg-zinc-50 border-zinc-100 text-zinc-400 cursor-not-allowed'
                                                        }`}
                                                    title={isEditable ? "Edit Batch Details" : "Cannot edit: No editable employees found"}
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    <span>Edit Batch</span>
                                                </button>
                                            );
                                        })()}
                                        <button onClick={() => setIsDetailsOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors p-2">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="p-0 overflow-y-auto flex-1">
                            {detailsLoading ? (
                                <div className="p-10 text-center text-zinc-400">Loading details...</div>
                            ) : selectedBatch?.employees ? (
                                <table className="w-full text-left">
                                    <thead className="bg-zinc-50 border-b border-zinc-100 text-sm uppercase text-zinc-500">
                                        <tr>
                                            <th className="px-6 py-3">Selection Type (BP)</th>
                                            <th className="px-6 py-3">Name</th>
                                            <th className="px-6 py-3">NIK</th>
                                            <th className="px-6 py-3">Phone</th>
                                            <th className="px-6 py-3">Assessment Date</th>
                                            <th className="px-6 py-3">Position</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {(isEditingBatch ? stagedEmployees : selectedBatch.employees)?.map((emp: any) => {
                                            const status = emp.availability_status || 'No Invitation';
                                            const lowerStatus = status.toLowerCase();
                                            let badgeClass = "bg-zinc-100 text-zinc-600 border-zinc-200";
                                            if (lowerStatus.includes("accepted")) badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                                            else if (lowerStatus.includes("rejected")) badgeClass = "bg-red-50 text-red-700 border-red-100";
                                            else if (lowerStatus.includes("sent")) badgeClass = "bg-amber-50 text-amber-700 border-amber-100";
                                            else if (lowerStatus.includes("pending")) badgeClass = "bg-yellow-50 text-yellow-800 border-yellow-200";
                                            else if (lowerStatus.includes("reschedule")) badgeClass = "bg-blue-50 text-blue-700 border-blue-100";
                                            else if (lowerStatus.includes("draft")) badgeClass = "bg-orange-50 text-orange-700 border-orange-100";

                                            return (
                                                <tr key={emp.id} className="hover:bg-zinc-50/30">
                                                    <td className="px-6 py-3 font-medium text-zinc-900">BP {emp.bp}</td>
                                                    <td className="px-6 py-3 text-zinc-900 font-bold">{emp.nama}</td>
                                                    <td className="px-6 py-3 text-zinc-500 font-mono text-sm">{emp.nik}</td>
                                                    <td className="px-6 py-3 text-zinc-500 font-mono text-sm">{emp.phone || '-'}</td>
                                                    <td className="px-6 py-3 text-zinc-600 text-base">
                                                        <div className="flex flex-col">
                                                            <span>{selectedBatch.assessmentDate && formatDate(selectedBatch.assessmentDate)}</span>
                                                            <span className="text-xs text-zinc-400">{selectedBatch.assessmentDate && new Date(selectedBatch.assessmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 text-zinc-500 text-base">{emp.posisi}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${badgeClass}`}>
                                                            {status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <div className="flex items-center justify-end space-x-4 whitespace-nowrap">
                                                            {(isEditingBatch && !lowerStatus.includes("sent")) && (
                                                                <div className="flex items-center justify-end space-x-4">
                                                                    <button
                                                                        onClick={() => {
                                                                            setReplacingEmployee(emp);
                                                                            setIsReplaceModalOpen(true);
                                                                        }}
                                                                        className="text-sm font-bold text-zinc-900 hover:text-red-600 transition-colors uppercase tracking-tight underline underline-offset-4"
                                                                    >
                                                                        Replace
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleRemoveEmployee(emp.nik)}
                                                                        className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-tight underline underline-offset-4"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            )}
                                                            {lowerStatus.includes("reschedule") && (
                                                                <button
                                                                    onClick={() => handleRescheduleClick(emp)}
                                                                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded shadow-sm hover:bg-red-700 transition-colors uppercase tracking-wide flex items-center space-x-1"
                                                                >
                                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                    <span>Reschedule</span>
                                                                </button>
                                                            )}
                                                            {(lowerStatus.includes("pending") || lowerStatus.includes("rejected")) && (() => {
                                                                const getMinutesPassed = () => {
                                                                    if (!emp.updatedAt) return 15;
                                                                    let t = new Date(emp.updatedAt).getTime();
                                                                    let diff = now - t;
                                                                    if (diff < -300000) diff += 7 * 60 * 60 * 1000;
                                                                    return diff / 60000;
                                                                };
                                                                const elapsed = getMinutesPassed();
                                                                const canResend = !isResendingRecord[emp.id] && elapsed >= 15;
                                                                const remaining = Math.max(0, Math.ceil(15 - elapsed));

                                                                return (
                                                                    <button
                                                                        onClick={() => {
                                                                            setEmployeeToResend(emp);
                                                                            setIsResendConfirmOpen(true);
                                                                        }}
                                                                        disabled={!canResend}
                                                                        className={`px-3 py-1.5 text-xs font-bold rounded shadow-sm transition-colors uppercase tracking-wide flex items-center space-x-1 ${!canResend ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                                                        title={!canResend ? `You can resend after ${remaining} minutes` : "Resend Invitation"}
                                                                    >
                                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                                        <span>{isResendingRecord[emp.id] ? 'Sending...' : 'Resend'}</span>
                                                                    </button>
                                                                );
                                                            })()}
                                                        </div>
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

                        <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end space-x-3">
                            {/* Add Employee Button - Only show when editing batch */}
                            {isEditingBatch && (
                                <button
                                    onClick={() => {
                                        setAddSearchTerm('');
                                        setIsAddModalOpen(true);
                                    }}
                                    className="px-4 py-2 bg-zinc-900 border border-zinc-900 rounded-lg text-white font-bold text-sm hover:bg-zinc-800 transition-colors shadow-sm flex items-center space-x-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    <span>Add Employee</span>
                                </button>
                            )}
                            {!isEditingBatch && (
                                <button
                                    onClick={() => setIsDetailsOpen(false)}
                                    className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-600 font-medium text-sm hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {
                showNotification && (
                    <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-5 duration-300">
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3">
                            <div className="bg-emerald-100 rounded-full p-1">
                                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-sm">Success</p>
                                <p className="text-xs text-emerald-600">{notificationMessage}</p>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Replacement Modal */}
            {
                isReplaceModalOpen && (
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
                                    <thead className="bg-zinc-100 border-b border-zinc-200 text-xs uppercase text-zinc-500 font-bold sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3">Candidate Name</th>
                                            <th className="px-6 py-3">NIK</th>
                                            <th className="px-6 py-3">Position</th>
                                            <th className="px-6 py-3">TC Result</th>
                                            <th className="px-6 py-3 text-right pr-10">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {filteredCandidates.length > 0 ? filteredCandidates.map((candidate: any) => (
                                            <tr key={candidate.id} className="hover:bg-red-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-zinc-900 truncate">{candidate.nama}</div>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-500 font-mono text-sm">{candidate.nik}</td>
                                                <td className="px-6 py-4 text-zinc-600 text-base truncate">{candidate.posisi}</td>
                                                <td className="px-6 py-4 text-zinc-600 text-sm">{candidate.tc_result || '-'}</td>
                                                <td className="px-6 py-4 text-right pr-6">
                                                    <button
                                                        onClick={() => handleReplaceEmployee(candidate.nik)}
                                                        disabled={isReplacing}
                                                        className="bg-zinc-900 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-all uppercase tracking-tight"
                                                    >
                                                        {isReplacing ? '...' : 'Select'}
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-zinc-400 italic text-sm">
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
                )
            }
            {/* Delete Confirmation Modal */}
            {
                isDeleteModalOpen && (
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
                                    Are you sure you want to delete this batch? All employees in this batch will be reverted to <strong className="text-zinc-900">"No Invitation"</strong> status and will be available for selection again.
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
                )
            }

            {/* Message Modal */}
            {
                isMessageModalOpen && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                            {/* Header */}
                            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-900 text-white">
                                <div>
                                    <h2 className="text-xl font-bold">Send Batch Status Message</h2>
                                    <div className="mt-1 flex items-center space-x-4 text-base text-zinc-400">
                                        <span className="flex items-center">
                                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {messageBatch?.location}
                                        </span>
                                        <span className="flex items-center">
                                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {messageBatch?.assessmentDate && new Date(messageBatch.assessmentDate).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center">
                                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {messageBatch?.assessmentDate && new Date(messageBatch.assessmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => setIsMessageModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="flex flex-1 overflow-hidden">
                                {/* Left Panel: Employee List */}
                                <div className="w-2/3 border-r border-zinc-100 flex flex-col bg-zinc-50/30">
                                    <div className="p-4 bg-zinc-50 border-b border-zinc-200">
                                        <h3 className="font-semibold text-zinc-700 text-sm uppercase tracking-wide">Recipients ({messageBatch?.employees?.length || 0})</h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-0">
                                        {messageLoading ? (
                                            <div className="flex items-center justify-center h-full text-zinc-400">Loading recipients...</div>
                                        ) : (
                                            <table className="w-full text-left text-lg">
                                                <thead className="bg-zinc-100 text-zinc-500 font-semibold sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2">Name</th>
                                                        <th className="px-4 py-2">NIK</th>
                                                        <th className="px-4 py-2 text-right">Phone</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-100 bg-white">
                                                    {messageBatch?.employees?.map((emp: any) => (
                                                        <tr key={emp.id} className="hover:bg-zinc-50 transition-colors">
                                                            <td className="px-4 py-3 font-medium text-zinc-900">{emp.nama}</td>
                                                            <td className="px-4 py-3 text-zinc-500 font-mono">{emp.nik}</td>
                                                            <td className="px-4 py-3 text-zinc-500 font-mono text-right">{emp.phone || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>

                                {/* Right Panel: Message Configuration */}
                                <div className="w-1/3 flex flex-col bg-white p-6 justify-between overflow-y-auto">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-zinc-900 mb-2">WhatsApp Invitation</h3>
                                            <p className="text-sm text-zinc-500 leading-relaxed">
                                                You are about to send assessment invitations to all selected recipients via WhatsApp (OCA).
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wide">Message Preview</label>
                                            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 text-sm text-zinc-800 font-mono leading-relaxed whitespace-pre-wrap shadow-inner relative max-h-[350px] overflow-y-auto custom-scrollbar">
                                                <div className="absolute top-2 right-2 text-xs font-bold text-zinc-300 pointer-events-none select-none">OCA TEMPLATE</div>
                                                {`Assalamualaikum [Name],

Anda telah terpilih untuk mengikuti Assessment Center PT Telkom Indonesia.

📅 Tanggal : ${messageBatch?.assessmentDate ? new Date(messageBatch.assessmentDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '[Tanggal]'}
📍 Lokasi : ${messageBatch?.location || '[Lokasi]'}
🎯 Batch : ${messageBatch?.batchName || 'Assessment Batch'}

Mohon konfirmasi kehadiran Anda dengan menekan salah satu tombol di bawah ini:

✅ Iya — Saya bisa hadir sesuai jadwal
🔄 Reschedule — Saya ingin mengganti jadwal
❌ Tidak — Saya tidak bisa hadir

Terima kasih atas perhatian Anda.

Hormat kami,
PT Telkom Indonesia`}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-6 border-t border-zinc-50">
                                        <button
                                            onClick={handleSendMessageClick}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center justify-center space-x-2 transform active:scale-[0.98]"
                                            disabled={!messageBatch}
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                            <span>Send via WhatsApp</span>
                                        </button>
                                        <button
                                            onClick={() => setIsMessageModalOpen(false)}
                                            className="w-full bg-white border border-zinc-200 text-zinc-600 font-bold py-3 px-4 rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
                                <button
                                    onClick={() => setIsMessageModalOpen(false)}
                                    className="px-6 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-600 font-bold text-sm hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm uppercase tracking-wide"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Send Confirmation Modal */}
            {
                isSendConfirmOpen && (
                    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-zinc-100 flex items-center space-x-4 bg-green-50/50">
                                <div className="p-3 bg-green-100 text-green-600 rounded-full">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-zinc-900">Send Invitations?</h3>
                                    <p className="text-base text-zinc-500">Confirm WhatsApp Broadcast</p>
                                </div>
                            </div>

                            <div className="p-6">
                                <p className="text-zinc-600 text-base leading-relaxed">
                                    Are you sure you want to send invitations to <strong className="text-zinc-900">{messageBatch?.employees?.length} employees</strong> in this batch? This will update their status to <strong className="text-zinc-900">"Pending"</strong>.
                                </p>
                            </div>

                            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end space-x-3">
                                <button
                                    onClick={() => setIsSendConfirmOpen(false)}
                                    className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 font-medium text-base rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm"
                                    disabled={isSendingInvitations}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmSendMessage}
                                    className="px-4 py-2 bg-green-600 text-white font-bold text-base rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 disabled:opacity-50"
                                    disabled={isSendingInvitations}
                                >
                                    {isSendingInvitations ? 'Sending...' : 'Yes, Send Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Reschedule Modal */}
            {
                isRescheduleModalOpen && (
                    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-900 text-white">
                                <div>
                                    <h3 className="text-lg font-bold">Reschedule Assessment</h3>
                                    <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-bold">
                                        For: <span className="text-white">{reschedulingEmployee?.nama}</span>
                                    </p>
                                </div>
                                <button onClick={() => setIsRescheduleModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase tracking-wider">New Location</label>
                                    <input
                                        type="text"
                                        value={rescheduleLocation}
                                        onChange={(e) => setRescheduleLocation(e.target.value)}
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none text-zinc-900 placeholder:text-zinc-500"
                                        placeholder="Enter location..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase tracking-wider">New Date</label>
                                        <input
                                            type="date"
                                            value={rescheduleDate}
                                            onChange={(e) => setRescheduleDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none text-zinc-900 placeholder:text-zinc-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase tracking-wider">New Time</label>
                                        <input
                                            type="time"
                                            value={rescheduleTime}
                                            onChange={(e) => setRescheduleTime(e.target.value)}
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none text-zinc-900 placeholder:text-zinc-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end space-x-3">
                                <button
                                    onClick={() => setIsRescheduleModalOpen(false)}
                                    className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 font-medium text-sm rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm"
                                    disabled={isRescheduling}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmReschedule}
                                    disabled={isRescheduling}
                                    className="px-4 py-2 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 shadow-lg shadow-red-600/20 disabled:opacity-50 transition-all"
                                >
                                    {isRescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Resend Confirmation Modal */}
            {
                isResendConfirmOpen && (
                    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-zinc-100 flex items-center space-x-4 bg-blue-50/50">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-zinc-900">Resend Invitation?</h3>
                                    <p className="text-base text-zinc-500">Confirm WhatsApp Broadcast</p>
                                </div>
                            </div>

                            <div className="p-6">
                                <p className="text-zinc-600 text-base leading-relaxed">
                                    Are you sure you want to resend the invitation to <strong className="text-zinc-900">{employeeToResend?.nama}</strong>? They will receive another WhatsApp message.
                                </p>
                            </div>

                            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setIsResendConfirmOpen(false);
                                        setEmployeeToResend(null);
                                    }}
                                    className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 font-medium text-base rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm"
                                    disabled={employeeToResend ? isResendingRecord[employeeToResend.id] : false}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmResend}
                                    className="px-4 py-2 bg-blue-600 text-white font-bold text-base rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                    disabled={employeeToResend ? isResendingRecord[employeeToResend.id] : false}
                                >
                                    {(employeeToResend && isResendingRecord[employeeToResend.id]) ? 'Sending...' : 'Yes, Resend Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Add Employee Modal */}
            {
                isAddModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-900 text-white">
                                <div>
                                    <h2 className="text-xl font-bold">Add Employee to Batch</h2>
                                    <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-bold">
                                        Target BP: <span className="text-red-500">BP {selectedBatch?.employees?.[0]?.bp || '?'}</span>
                                    </p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
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
                                        value={addSearchTerm}
                                        onChange={(e) => setAddSearchTerm(e.target.value)}
                                        className="block w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="overflow-y-auto flex-1 p-0">
                                <table className="w-full text-left table-fixed">
                                    <thead className="bg-zinc-100 border-b border-zinc-200 text-xs uppercase text-zinc-500 font-bold sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3">Candidate Name</th>
                                            <th className="px-6 py-3">NIK</th>
                                            <th className="px-6 py-3">Position</th>
                                            <th className="px-6 py-3">TC Result</th>
                                            <th className="px-6 py-3 text-right pr-6">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {availableCandidates.length > 0 ? availableCandidates.map((candidate: any) => (
                                            <tr key={candidate.id} className="hover:bg-red-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-zinc-900 truncate">{candidate.nama}</div>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-500 font-mono text-sm">{candidate.nik}</td>
                                                <td className="px-6 py-4 text-zinc-600 text-base truncate">{candidate.posisi}</td>
                                                <td className="px-6 py-4 text-zinc-600 text-sm">{candidate.tc_result || '-'}</td>
                                                <td className="px-6 py-4 text-right pr-6">
                                                    <button
                                                        onClick={() => handleAddEmployee(candidate.nik)}
                                                        disabled={isAdding}
                                                        className="bg-zinc-900 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-green-600 disabled:opacity-50 transition-all uppercase tracking-tight"
                                                    >
                                                        {isAdding ? '...' : 'Add'}
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-zinc-400 italic text-sm">
                                                    No eligible candidates found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-zinc-500 hover:text-zinc-900 font-bold text-xs uppercase tracking-widest transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
