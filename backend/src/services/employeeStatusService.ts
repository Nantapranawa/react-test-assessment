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

        const requiresAction = employee.availability_status !== "Sent";

        switch (aiResult.status) {
            case 'accepted':
                proposedStatus = "Accepted";
                notifType = requiresAction ? "action:Accepted" : "success";
                message = `${employee.nama} accepted: "${response}"`;
                break;
            case 'rejected':
                proposedStatus = "Rejected";
                notifType = requiresAction ? "action:Rejected" : "error";
                message = `${employee.nama} rejected: "${response}"`;
                break;
            case 'reschedule':
                proposedStatus = "Reschedule Requested";
                notifType = requiresAction ? "action:Reschedule Requested" : "warning";
                message = `${employee.nama} requested reschedule: "${response}"`;
                break;
            default:
                notifType = "info";
                message = `${employee.nama} response: "${response}"`;
                break;
        }

        const updateStatusDirectly = !requiresAction && proposedStatus !== "No Invitation";

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

        // Trigger Admin WhatsApp Notification if status changed to something meaningful
        if (proposedStatus !== "No Invitation") {
            try {
                let batch: any = null;
                if (employeeType === 'TS1') {
                    batch = await prisma.batchTS1.findFirst({
                        where: { employees: { some: { nik: employeeNik } } },
                        orderBy: { createdAt: 'desc' }
                    });
                } else {
                    batch = await prisma.batchTS2.findFirst({
                        where: { employees: { some: { nik: employeeNik } } },
                        orderBy: { createdAt: 'desc' }
                    });
                }

                const talent_solution = employeeType === 'TS1' ? 1 : 2;
                let admin = await prisma.user.findFirst({
                    where: { role: 'ADMIN', talent_solution, phone: { not: null } }
                });

                if (!admin) {
                    admin = await prisma.user.findFirst({
                        where: { role: 'ADMIN', talent_solution: 0, phone: { not: null } }
                    });
                }

                if (admin && admin.phone && batch) {
                    const assessmentDate = batch.assessmentDate
                        ? new Date(batch.assessmentDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                        : 'TBD';

                    await notificationService.sendAdminWhatsAppNotification({
                        phone: admin.phone,
                        user: admin.name || 'Admin',
                        name: employee.nama,
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

        return true;
    }
};
