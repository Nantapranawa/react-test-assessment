import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead, resolveNotificationAction, sendAdminWhatsAppNotification } from '../controllers/notificationController';

const router = Router();

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: Retrieve notifications
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', getNotifications);

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark a notification as read
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put('/:id/read', markAsRead);

/**
 * @openapi
 * /api/notifications/{id}/resolve:
 *   post:
 *     summary: Resolve an action notification
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               talent_solution:
 *                 type: number
 *               action:
 *                 type: string
 *               proposedStatus:
 *                 type: string
 *     responses:
 *       200:
 *         description: Action resolved successfully
 */
router.post('/:id/resolve', resolveNotificationAction);

/**
 * @openapi
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put('/read-all', markAllAsRead);

/**
 * @openapi
 * /api/notifications/notify-admin-whatsapp:
 *   post:
 *     summary: Send WhatsApp notification to Admin when a recipient updates their status
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               user:
 *                 type: string
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *               assessment:
 *                 type: string
 *               tanggal:
 *                 type: string
 *               lokasi:
 *                 type: string
 *               batch:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin WhatsApp notification sent successfully
 */
router.post('/notify-admin-whatsapp', sendAdminWhatsAppNotification);

export default router;
