import { Router } from 'express';
import { webhookController } from '../controllers/webhookController';

const router = Router();

/**
 * @openapi
 * /inbound-message:
 *   post:
 *     summary: Receive WhatsApp webhook from OCA
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/inbound-message', webhookController.receiveWhatsAppWebhook);

export default router;
