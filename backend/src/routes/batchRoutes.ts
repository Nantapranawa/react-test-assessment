
import { Router } from 'express';
import { createBatch, listBatches, getBatch, deleteBatch, replaceEmployee, updateBatch, sendInvitations, rescheduleEmployee, addEmployee, removeEmployee } from '../controllers/batchController';

const router = Router();

router.post('/', createBatch);
router.get('/', listBatches);
router.get('/:id', getBatch);
router.delete('/:id', deleteBatch);
router.post('/:id/replace-employee', replaceEmployee);
router.post('/:id/add-employee', addEmployee);
router.post('/:id/remove-employee', removeEmployee);
router.post('/reschedule-employee', rescheduleEmployee);
router.post('/:id/send-invitations', sendInvitations);
router.put('/:id', updateBatch);

export default router;
