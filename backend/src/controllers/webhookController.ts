import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { aiService } from '../services/aiService';

export const webhookController = {
    // WhatsApp webhook ingestion
    async receiveWhatsAppWebhook(req: Request, res: Response) {
        try {
            const { from, message } = req.body;
            console.log('Received WhatsApp Webhook:', JSON.stringify(req.body));

            if (!from || !message?.content?.text) {
                return res.status(400).json({ success: false, error: 'Invalid payload format' });
            }

            const phoneStr = from.toString().replace(/\D/g, '');
            const searchPhone = phoneStr.replace(/^(62|0)/, '');

            let employee = null;

            if (searchPhone.length > 5) {
                let emp1 = await prisma.employeeTS1.findFirst({
                    where: { phone: { endsWith: searchPhone } }
                });
                if (emp1) {
                    employee = emp1;
                } else {
                    let emp2 = await prisma.employeeTS2.findFirst({
                        where: { phone: { endsWith: searchPhone } }
                    });
                    if (emp2) {
                        employee = emp2;
                    }
                }
            }

            if (!employee) {
                console.log(`Webhook received but no employee found for phone: ${from}`);
                return res.status(404).json({ success: false, error: 'Employee not found' });
            }

            console.log(`Ingested message from ${employee.nama} (${employee.nik}).`);

            // AUTOMATIC TRIGGER (BACKGROUND)
            // We call this without 'await' to keep the webhook response fast
            aiService.analyzeResponse(employee.nik, message.content.text).catch((err: any) => {
                console.error("Delayed AI analysis failed:", err.message);
            });

            return res.status(200).json({
                success: true,
                message: 'Webhook received and employee identified. Analysis triggered in background.',
                data: {
                    nik: employee.nik,
                    nama: employee.nama,
                    message: message.content.text
                }
            });
        } catch (error: any) {
            console.error("Webhook Error:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
