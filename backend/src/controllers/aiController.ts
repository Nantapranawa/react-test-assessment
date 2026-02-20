import { Request, Response } from 'express';
import { aiService } from '../services/aiService';
import { prisma } from '../lib/prisma';

export const aiController = {
    async process(req: Request, res: Response) {
        try {
            const data = req.body;
            const result = await aiService.processData(data);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async status(req: Request, res: Response) {
        try {
            const health = await aiService.checkHealth();
            res.json({
                backend: 'up',
                ai_service: health
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    // New AI-driven response analysis
    async analyzeEmployeeResponse(req: Request, res: Response) {
        try {
            // 'response' = original message
            // 'aiStatus' = status determined by Python AI Service (REQUIRED)
            // 'reason' / 'proposedDate' = additional details provided by Python AI
            const { employeeNik, response, aiStatus, reason, proposedDate, replyMessage } = req.body;

            if (!employeeNik || !response) {
                return res.status(400).json({ success: false, error: "Missing employeeNik or response" });
            }

            if (!aiStatus) {
                return res.status(400).json({ success: false, error: "Missing aiStatus from AI Service. Use the AI Service to analyze first." });
            }

            const employee = await prisma.employeeTS1.findUnique({
                where: { nik: employeeNik }
            });

            if (!employee) {
                return res.status(404).json({ success: false, error: "Employee not found" });
            }

            // We trust the status provided by the AI service (Python)
            console.log(`Received pre-analyzed status from AI Service: ${aiStatus}`);

            const aiResult = {
                status: aiStatus,
                reason: reason || '',
                proposedDate: proposedDate || '',
                replyMessage: replyMessage || ''
            };

            // Determine system status based on AI result
            let status = "No Invitation";
            let notifType = "info";
            let message = "";

            switch (aiResult.status) {
                case 'accepted':
                    status = "Accepted";
                    notifType = "success";
                    message = `${employee.nama} has ACCEPTED the invitation (AI Verified).`;
                    break;
                case 'rejected':
                    status = "Rejected";
                    notifType = "error";
                    message = `${employee.nama} has REJECTED the invitation (AI Verified).${aiResult.reason ? ` Reason: ${aiResult.reason}` : ''}`;
                    break;
                case 'reschedule':
                    status = "Reschedule Requested";
                    notifType = "warning";
                    if (aiResult.proposedDate) {
                        message = `${employee.nama} requested RESCHEDULE (AI Verified). Details: ${aiResult.proposedDate}`;
                    } else {
                        message = `${employee.nama} requested RESCHEDULE but did NOT provide a date/time.`;
                        if (aiResult.replyMessage) {
                            message += ` AI Reply: "${aiResult.replyMessage}"`;
                        }
                    }
                    break;
                default:
                    // Unknown status from AI
                    notifType = "info";
                    message = `Manual review needed for ${employee.nama}. AI Status: ${aiResult.status}`;
                    break;
            }

            await prisma.$transaction([
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

            res.json({
                success: true,
                message: "Response processed and recorded.",
                aiAnalysis: aiResult
            });

        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
