
import { Router } from 'express';
import { createBatch, listBatches, getBatch, deleteBatch, replaceEmployee, updateBatch, sendInvitations, rescheduleEmployee, addEmployee, removeEmployee } from '../controllers/batchController';

const router = Router();

/**
 * @openapi
 * /api/batches:
 *   post:
 *     summary: Create a new batch
 *     responses:
 *       201:
 *         description: Batch created
 *   get:
 *     summary: List all batches
 *     responses:
 *       200:
 *         description: Array of batches
 */
router.post('/', createBatch);
router.get('/', listBatches);

/**
 * @openapi
 * /api/batches/{id}:
 *   get:
 *     summary: Get batch details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Batch details
 *   delete:
 *     summary: Delete a batch
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Batch deleted
 */
router.get('/:id', getBatch);
router.delete('/:id', deleteBatch);

/**
 * @openapi
 * /api/batches/{id}/replace-employee:
 *   post:
 *     summary: Replace an employee in a batch
 *     responses:
 *       200:
 *         description: Employee replaced
 */
router.post('/:id/replace-employee', replaceEmployee);

/**
 * @openapi
 * /api/batches/{id}/add-employee:
 *   post:
 *     summary: Add an employee to a batch
 *     responses:
 *       200:
 *         description: Employee added
 */
router.post('/:id/add-employee', addEmployee);

/**
 * @openapi
 * /api/batches/{id}/remove-employee:
 *   post:
 *     summary: Remove an employee from a batch
 *     responses:
 *       200:
 *         description: Employee removed
 */
router.post('/:id/remove-employee', removeEmployee);

/**
 * @openapi
 * /api/batches/reschedule-employee:
 *   post:
 *     summary: Reschedule an employee assessment
 *     responses:
 *       200:
 *         description: Assessment rescheduled
 */
router.post('/reschedule-employee', rescheduleEmployee);

/**
 * @openapi
 * /api/batches/{id}/send-invitations:
 *   post:
 *     summary: Send invitations to employees in a batch
 *     responses:
 *       200:
 *         description: Invitations sent
 */
router.post('/:id/send-invitations', sendInvitations);

/**
 * @openapi
 * /api/batches/{id}:
 *   put:
 *     summary: Update batch details
 *     responses:
 *       200:
 *         description: Batch updated
 */
router.put('/:id', updateBatch);

export default router;
