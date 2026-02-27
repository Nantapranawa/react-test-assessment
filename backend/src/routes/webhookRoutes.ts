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

/**
 * @openapi
 * /api/webhooks/delivery:
 *   post:
 *     summary: Receive WhatsApp delivery status webhook from OCA
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               msgid:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               status:
 *                 type: string
 *               timestamp:
 *                 type: string
 *               error:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                   reason:
 *                     type: string
 *     responses:
 *       200:
 *         description: Delivery status processed successfully
 *       400:
 *         description: Invalid payload format
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
router.post('/delivery', webhookController.receiveDeliveryStatusWebhook);

export default router;
