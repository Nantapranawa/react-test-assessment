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
            } else {
                await prisma.$transaction([
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

            res.json({
                success: true,
                message: "Response processed and recorded.",
                aiAnalysis: aiResult
            });

        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Manually trigger AI analysis
    async triggerAIAnalysis(req: Request, res: Response) {
        try {
            const { employeeNik, text } = req.body;

            if (!employeeNik || !text) {
                return res.status(400).json({ success: false, error: "Missing employeeNik or text" });
            }

            console.log(`Manually triggering AI analysis for ${employeeNik}...`);

            // Call AI Service
            const aiResult = await aiService.analyzeResponse(employeeNik, text);

            return res.status(200).json({
                success: true,
                message: "AI analysis triggered successfully",
                aiResponse: aiResult
            });
        } catch (error: any) {
            console.error("Analysis Trigger Error:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
