import { Request, Response } from 'express';
import { aiService } from '../services/aiService';

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
    }
};
