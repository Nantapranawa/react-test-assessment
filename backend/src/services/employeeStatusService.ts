import { prisma } from '../lib/prisma';
import { notificationService } from './notificationService';

export interface AIAnalysisResult {
    status: string;
    reason?: string;
    proposedDate?: string;
    replyMessage?: string;
}

export const employeeStatusService = {
    async updateStatus(employeeNik: string, response: string, aiResult: AIAnalysisResult) {
        let employeeType = 'TS1';
        let employee: any = await prisma.employeeTS1.findUnique({
            where: { nik: employeeNik }
        });

        if (!employee) {
            employee = await prisma.employeeTS2.findUnique({
                where: { nik: employeeNik }
            });
            employeeType = 'TS2';
        }

        if (!employee) {
            throw new Error(`Employee with NIK ${employeeNik} not found`);
        }

        // Determine system status based on AI/Keyword result
        let proposedStatus = "No Invitation";
        let notifType = "info";
        let message = "";

        // Status can only be updated if it's already sent or in a response state
        const canUpdateStatus = ["Sent", "Accepted", "Rejected", "Reschedule Requested"].includes(employee.availability_status);

        switch (aiResult.status) {
            case 'accepted':
                proposedStatus = "Accepted";
                notifType = "success";
                message = `${employee.nama} accepted: "${response}"`;
                break;
            case 'rejected':
                proposedStatus = "Rejected";
                notifType = "error";
                message = `${employee.nama} rejected: "${response}"`;
                break;
            case 'reschedule':
                proposedStatus = "Reschedule Requested";
                notifType = "warning";
                if (aiResult.proposedDate) {
                    message = `${employee.nama} requested reschedule to: ${aiResult.proposedDate}`;
                } else {
                    message = `${employee.nama} requested reschedule: "${response}"`;
                }
                break;
            default:
                notifType = "info";
                message = `${employee.nama} response: "${response}"`;
                break;
        }

        const updateStatusDirectly = canUpdateStatus && proposedStatus !== "No Invitation";

        if (aiResult.status !== 'unknown') {
            if (employeeType === 'TS1') {
                if (updateStatusDirectly) {
                    await prisma.$transaction([
                        prisma.employeeTS1.update({
                            where: { id: employee.id },
                            data: { availability_status: proposedStatus }
                        }),
                        prisma.notificationTS1.create({
                            data: {
                                message,
                                type: notifType,
                                employeeId: employee.id,
                                isRead: false
                            }
                        })
                    ]);
                } else {
                    await prisma.notificationTS1.create({
                        data: {
                            message,
                            type: notifType,
                            employeeId: employee.id,
                            isRead: false
                        }
                    });
                }
            } else {
                if (updateStatusDirectly) {
                    await prisma.$transaction([
                        prisma.employeeTS2.update({
                            where: { id: employee.id },
                            data: { availability_status: proposedStatus }
                        }),
                        prisma.notificationTS2.create({
                            data: {
                                message,
                                type: notifType,
                                employeeId: employee.id,
                                isRead: false
                            }
                        })
                    ]);
                } else {
                    await prisma.notificationTS2.create({
                        data: {
                            message,
                            type: notifType,
                            employeeId: employee.id,
                            isRead: false
                        }
                    });
                }
            }
        }

        let batch: any = null;
        try {
            if (employeeType === 'TS1') {
                batch = await prisma.batchTS1.findFirst({
                    where: { employees: { some: { nik: employeeNik } } },
                    orderBy: { createdAt: 'desc' },
                    include: { employees: true }
                });
            } else {
                batch = await prisma.batchTS2.findFirst({
                    where: { employees: { some: { nik: employeeNik } } },
                    orderBy: { createdAt: 'desc' },
                    include: { employees: true }
                });
            }
        } catch (e: any) {
            console.error("Failed to fetch batch inside updateStatus:", e.message);
        }

        // Trigger Admin WhatsApp Notification if status changed to something meaningful
        if (proposedStatus !== "No Invitation") {
            try {
                const talent_solution = employeeType === 'TS1' ? 1 : 2;
                let admin = await prisma.user.findFirst({
                    where: { role: 'ADMIN', talent_solution, phone: { not: null } }
                });

                if (!admin) {
                    admin = await prisma.user.findFirst({
                        where: { role: 'ADMIN', talent_solution: 0, phone: { not: null } }
                    });
                }

                let shouldSendNotif = false;
                let notificationName = employee.nama;

                if (proposedStatus === "Rejected" || proposedStatus === "Reschedule Requested") {
                    shouldSendNotif = true;
                } else if (proposedStatus === "Accepted") {
                    if (batch && batch.employees) {
                        const allAccepted = batch.employees.every((emp: any) => emp.availability_status === "Accepted");
                        if (allAccepted) {
                            shouldSendNotif = true;
                            notificationName = "Semua Peserta";
                        }
                    }
                }

                if (shouldSendNotif && admin && admin.phone && batch) {
                    const assessmentDate = batch.assessmentDate
                        ? new Date(batch.assessmentDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                        : 'TBD';

                    await notificationService.sendAdminWhatsAppNotification({
                        phone: admin.phone,
                        user: admin.name || 'Admin',
                        name: notificationName,
                        status: proposedStatus, // This is the categorical status
                        assessment: batch.assessmentType || 'Assessment',
                        tanggal: assessmentDate,
                        lokasi: batch.location || 'Sudah Ditentukan',
                        batch: batch.batchName || 'Batch No Name'
                    });
                }
            } catch (notifErr: any) {
                console.error("Failed to trigger admin notification:", notifErr.message);
            }
        }

        // Trigger Reschedule Prompt Notification to Employee if they didn't provide a date
        if (proposedStatus === "Reschedule Requested" && !aiResult.proposedDate && employee.phone) {
            try {
                const assessmentName = batch?.assessmentType || 'Assessment';
                const assessmentDate = batch && batch.assessmentDate
                    ? new Date(batch.assessmentDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                    : 'TBD';

                await notificationService.sendReschedulePromptNotification({
                    phone: employee.phone,
                    name: employee.nama,
                    assessment: assessmentName,
                    tanggal: assessmentDate
                });
            } catch (promptErr: any) {
                console.error("Failed to send reschedule prompt notification:", promptErr.message);
            }
        }

        return true;
    }
};
