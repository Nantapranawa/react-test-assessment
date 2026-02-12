import { Router } from 'express';
import { aiController } from '../controllers/aiController';

const router = Router();

router.post('/process', aiController.process);
router.get('/status', aiController.status);
router.post('/analyze-response', aiController.analyzeEmployeeResponse);

export default router;
