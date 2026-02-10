
import { Router } from 'express';
import { createBatch, listBatches, getBatch, deleteBatch, replaceEmployee } from '../controllers/batchController';

const router = Router();

router.post('/', createBatch);
router.get('/', listBatches);
router.get('/:id', getBatch);
router.delete('/:id', deleteBatch);
router.post('/:id/replace-employee', replaceEmployee);

export default router;
