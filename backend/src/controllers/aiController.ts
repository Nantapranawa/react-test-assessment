import { Request, Response } from 'express';
import { aiService } from '../services/aiService';
import { prisma } from '../lib/prisma';
import { employeeStatusService } from '../services/employeeStatusService';
import { keywordAnalysisService } from '../services/keywordAnalysisService';

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

            console.log(`Received pre-analyzed status from AI Service: ${aiStatus}`);

            const aiResult = {
                status: aiStatus,
                reason: reason || '',
                proposedDate: proposedDate || '',
                replyMessage: replyMessage || ''
            };

            await employeeStatusService.updateStatus(employeeNik, response, aiResult);

            res.json({
                success: true,
                message: "Response processed and recorded via AI Service.",
                aiAnalysis: aiResult
            });

        } catch (error: any) {
            console.error("Error in analyzeEmployeeResponse:", error);
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

            try {
                // Try Call AI Service
                const aiResult = await aiService.analyzeResponse(employeeNik, text);
                return res.status(200).json({
                    success: true,
                    message: "AI analysis triggered successfully via AI Service",
                    aiResponse: aiResult
                });
            } catch (aiError: any) {
                console.warn(`AI Service failed for manual trigger, falling back to keywords: ${aiError.message}`);

                // Fallback to local keyword logic
                const fallbackResult = keywordAnalysisService.analyze(text);
                await employeeStatusService.updateStatus(employeeNik, text, fallbackResult);

                return res.status(200).json({
                    success: true,
                    message: "AI Service unavailable. Status updated via Backend Keyword Fallback.",
                    fallbackResult
                });
            }
        } catch (error: any) {
            console.error("Analysis Trigger Error:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
