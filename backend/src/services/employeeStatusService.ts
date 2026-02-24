import { prisma } from '../lib/prisma';

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
        let status = "No Invitation";
        let notifType = "info";
        let message = "";

        switch (aiResult.status) {
            case 'accepted':
                status = "Accepted";
                notifType = "success";
                message = `${employee.nama} accepted: "${response}"`;
                break;
            case 'rejected':
                status = "Rejected";
                notifType = "error";
                message = `${employee.nama} rejected: "${response}"`;
                break;
            case 'reschedule':
                status = "Reschedule Requested";
                notifType = "warning";
                message = `${employee.nama} requested reschedule: "${response}"`;
                break;
            default:
                notifType = "info";
                message = `${employee.nama} response: "${response}"`;
                break;
        }

        if (employeeType === 'TS1') {
            return await prisma.$transaction([
                prisma.employeeTS1.update({
                    where: { id: employee.id },
                    data: { availability_status: status }
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
            return await prisma.$transaction([
                prisma.employeeTS2.update({
                    where: { id: employee.id },
                    data: { availability_status: status }
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
        }
    }
};
