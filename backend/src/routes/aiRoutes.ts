import { Router } from 'express';
import { aiController } from '../controllers/aiController';

const router = Router();

router.post('/process', aiController.process);
router.get('/status', aiController.status);

export default router;
