import { Router } from 'express';
import { webhookController } from '../controllers/webhookController';

const router = Router();

/**
 * @openapi
 * /api/webhooks/whatsapp:
 *   post:
 *     summary: Receive WhatsApp webhook from OCA
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *               to:
 *                 type: string
 *               timestamp:
 *                 type: string
 *               message:
 *                 type: object
 *                 properties:
 *                   content:
 *                     type: object
 *                     properties:
 *                       text:
 *                         type: string
 *                       type:
 *                         type: string
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid payload format
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
router.post('/whatsapp', webhookController.receiveWhatsAppWebhook);

export default router;
