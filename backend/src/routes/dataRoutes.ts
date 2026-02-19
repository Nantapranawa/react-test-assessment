import { Router } from 'express';
import { getRoot, getData, uploadExcel, createEmployee, deleteEmployee } from '../controllers/dataController';
import { upload } from '../middleware/upload';

const router = Router();

/**
 * @openapi
 * /api/data:
 *   get:
 *     summary: Health check for data routes
 *     responses:
 *       200:
 *         description: Returns a success message
 */
router.get("/", getRoot); //hello world

/**
 * @openapi
 * /api/data/list:
 *   get:
 *     summary: Retrieve a list of employees
 *     responses:
 *       200:
 *         description: List of employees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
 */
router.get("/list", getData); // cuman array alice bob charlie

/**
 * @openapi
 * /api/data/upload-excel:
 *   post:
 *     summary: Upload employee data via Excel
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post("/upload-excel", upload.single('file'), uploadExcel);
router.post("/employees", createEmployee);
router.delete("/employees/:nik", deleteEmployee);

export default router;
