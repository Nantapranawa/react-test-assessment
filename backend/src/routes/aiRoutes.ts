import { Router } from 'express';
import { aiController } from '../controllers/aiController';

const router = Router();

/**
 * @openapi
 * /api/ai/process:
 *   post:
 *     summary: Process AI request
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/process', aiController.process);

/**
 * @openapi
 * /api/ai/status:
 *   get:
 *     summary: Get AI service status
 *     responses:
 *       200:
 *         description: AI Service status
 */
router.get('/status', aiController.status);

/**
 * @openapi
 * /api/ai/analyze-response:
 *   post:
 *     summary: Analyze employee response
 *     responses:
 *       200:
 *         description: AI Analysis complete
 */
router.post('/analyze-response', aiController.analyzeEmployeeResponse);

export default router;
