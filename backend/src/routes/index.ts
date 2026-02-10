import { Router } from 'express';
import aiRoutes from './aiRoutes';
import dataRoutes from './dataRoutes';
import batchRoutes from './batchRoutes';
import { aiController } from '../controllers/aiController';

import { uploadExcel } from '../controllers/dataController';
import { upload } from '../middleware/upload';

const router = Router();

// Domain-specific routes
router.use('/ai', aiRoutes);      // Endpoints: /api/ai/process, /api/ai/status
router.use('/data', dataRoutes);  // Endpoints: /api/data/, /api/data/list, etc.
router.use('/batches', batchRoutes);


// Legacy/Frontend compatibility routes (mapped to /api/...)
router.post('/process', aiController.process);
router.post('/upload-excel', upload.single('file'), uploadExcel);

export default router;
