
import { Router } from 'express';
import { createBatch, listBatches, getBatch } from '../controllers/batchController';

const router = Router();

router.post('/', createBatch);
router.get('/', listBatches);
router.get('/:id', getBatch);

export default router;
