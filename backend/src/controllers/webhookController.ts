import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { aiService } from '../services/aiService';
import { keywordAnalysisService } from '../services/keywordAnalysisService';
import { employeeStatusService } from '../services/employeeStatusService';
import { getIO } from '../socket';

export const webhookController = {
    // WhatsApp webhook ingestion
    async receiveWhatsAppWebhook(req: Request, res: Response) {
        try {
            const { from, to, timestamp, message } = req.body;
            console.log(`[Webhook] Incoming from ${from} to ${to} at ${timestamp}`);

            if (!from || !message?.content?.text) {
                console.error("Invalid Webhook Payload:", req.body);
                return res.status(400).json({ success: false, error: 'Invalid payload format' });
            }

            // Only process text messages as per the provided example
            if (message.content.type && message.content.type !== 'text') {
                return res.status(200).json({ success: true, message: 'Message type not supported for analysis' });
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

            console.log(`Ingested message from ${employee.nama} (${employee.nik}). Content: ${message.content.text}`);

            // AUTOMATIC AI TRIGGER from Webhook (BACKGROUND)
            aiService.analyzeResponse(employee.nik, message.content.text)
                .then(() => {
                    console.log(`AI completely finished processing for ${employee.nik}`);
                })
                .catch(async (err: any) => {
                    console.error(`AI Analysis failed for ${employee.nik}:`, err.message);
                    console.log(`Falling back to backend keyword logic for ${employee.nik}...`);
                    try {
                        const fallbackResult = keywordAnalysisService.analyze(message.content.text);
                        await employeeStatusService.updateStatus(employee.nik, message.content.text, fallbackResult);
                        console.log(`Fallback keyword analysis completed for ${employee.nik} with status: ${fallbackResult.status}`);
                    } catch (fallbackErr: any) {
                        console.error(`Fallback keyword analysis also failed for ${employee.nik}:`, fallbackErr.message);
                    }
                })
                .finally(() => {
                    // Emit to frontend clients via Socket.io AFTER AI finishes (or fails)
                    try {
                        const io = getIO();
                        io.emit('whatsapp_message_received', {
                            employee: {
                                nik: employee.nik,
                                nama: employee.nama,
                                phone: employee.phone
                            },
                            message: message.content.text,
                            timestamp: timestamp || new Date().toISOString()
                        });
                        console.log(`Websocket emitted for ${employee.nik} because AI is done.`);
                    } catch (socketError) {
                        console.error("Socket error on webhook emission:", socketError);
                    }
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
    },

    // WhatsApp Delivery Status Webhook
    async receiveDeliveryStatusWebhook(req: Request, res: Response) {
        try {
            const { msgid, phone_number, status, timestamp, error } = req.body;
            console.log(`[Delivery Webhook] Incoming from ${phone_number} with status ${status}`);

            if (!phone_number || !status) {
                return res.status(400).json({ success: false, error: 'Invalid payload format' });
            }

            const phoneStr = phone_number.toString().replace(/\D/g, '');
            const searchPhone = phoneStr.replace(/^(62|0)/, '');

            let employee = null;
            let isTS2 = false;

            if (searchPhone.length > 5) {
                let emp1 = await prisma.employeeTS1.findFirst({
                    where: { phone: { endsWith: searchPhone } }
                });
                if (emp1) {
                    employee = emp1;
                    isTS2 = false;
                } else {
                    let emp2 = await prisma.employeeTS2.findFirst({
                        where: { phone: { endsWith: searchPhone } }
                    });
                    if (emp2) {
                        employee = emp2;
                        isTS2 = true;
                    }
                }
            }

            if (!employee) {
                console.log(`Delivery Webhook received but no employee found for phone: ${phone_number}`);
                return res.status(404).json({ success: false, error: 'Employee not found' });
            }

            console.log(`Delivery status for ${employee.nama} (${employee.nik}) is ${status}`);

            let newStatus = employee.availability_status;

            if (status === 'failed' || status === 'rejected') {
                newStatus = 'Pending';
            } else if (status === 'delivered' || status === 'read') {
                newStatus = 'Sent';
            }

            if (newStatus !== employee.availability_status) {
                if (isTS2) {
                    await prisma.employeeTS2.update({
                        where: { id: employee.id },
                        data: { availability_status: newStatus }
                    });
                } else {
                    await prisma.employeeTS1.update({
                        where: { id: employee.id },
                        data: { availability_status: newStatus }
                    });
                }

                // Emit to frontend clients via Socket.io
                try {
                    const io = getIO();
                    io.emit('employee_status_updated', {
                        nik: employee.nik,
                        nama: employee.nama,
                        status: newStatus,
                        timestamp: timestamp || new Date().toISOString()
                    });
                    console.log(`Websocket emitted for delivery status update: ${employee.nik} -> ${newStatus}`);
                } catch (socketError) {
                    console.error("Socket error on delivery webhook emission:", socketError);
                }
            }

            return res.status(200).json({
                success: true,
                message: 'Delivery webhook processed successfully',
                data: {
                    nik: employee.nik,
                    status: newStatus
                }
            });
        } catch (err: any) {
            console.error("Delivery Webhook Error:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
};
