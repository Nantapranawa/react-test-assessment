import { Router } from 'express';
import { webhookController } from '../controllers/webhookController';

const router = Router();

/**
 * @openapi
 * /api/webhooks/whatsapp:
 *   post:
 *     summary: Receive WhatsApp webhook from OCA
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/whatsapp', webhookController.receiveWhatsAppWebhook);

export default router;
