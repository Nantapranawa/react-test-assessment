import { Router } from 'express';
import { authController } from '../controllers/authController';

const router = Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login with NIK and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nik_user
 *               - password
 *             properties:
 *               nik_user:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authController.login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get current user info
 *     parameters:
 *       - in: query
 *         name: nik_user
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User data returned
 *       404:
 *         description: User not found
 */
router.get('/me', authController.getMe);

/**
 * @openapi
 * /api/auth/users:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', authController.getUsers);

export default router;
