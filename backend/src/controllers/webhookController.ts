import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { employeeStatusService } from '../services/employeeStatusService';
import { getIO } from '../socket';
import { normalizePhone } from '../utils/phoneUtils';
import { aiService } from '../services/aiService';

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

            const searchPhone = normalizePhone(from);

            let employee = null;

            if (searchPhone.length > 5) {
                let emp1 = await prisma.employeeTS1.findFirst({
                    where: { phone: { endsWith: searchPhone.slice(-10) } }
                });
                if (emp1) {
                    employee = emp1;
                } else {
                    let emp2 = await prisma.employeeTS2.findFirst({
                        where: { phone: { endsWith: searchPhone.slice(-10) } }
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

            const exactMsg = message.content.text.trim();

            let statusAction = {
                status: 'unknown',
                reason: 'No strict keyword matched',
                proposedDate: '',
                replyMessage: ''
            };

            if (exactMsg === 'IYA') {
                statusAction.status = 'accepted';
                statusAction.reason = 'Exact match: IYA';
            } else if (exactMsg === 'TIDAK') {
                statusAction.status = 'rejected';
                statusAction.reason = 'Exact match: TIDAK';
            } else if (exactMsg === 'RESCHEDULE') {
                statusAction.status = 'reschedule';
                statusAction.reason = 'Exact match: RESCHEDULE';
            } else if (employee.availability_status === 'Reschedule Requested') {
                const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
                if (dateRegex.test(exactMsg)) {
                    statusAction.status = 'reschedule';
                    statusAction.proposedDate = exactMsg;
                    statusAction.reason = 'Provided valid reschedule date format';
                } else {
                    console.log(`Sending to AI Service to parse date for ${employee.nik}`);
                    try {
                        await aiService.analyzeResponse(employee.nik, message.content.text);
                        return res.status(200).json({ success: true, message: 'Message sent to AI' });
                    } catch (err: any) {
                        console.error('Failed to parse date with AI Service:', err.message);
                    }
                }
            }

            try {
                await employeeStatusService.updateStatus(employee.nik, message.content.text, statusAction);
                console.log(`Processed message for ${employee.nik}: ${statusAction.status}`);
            } catch (err: any) {
                console.error(`Status update failed for ${employee.nik}:`, err.message);
            } finally {
                // Emit to frontend clients via Socket.io
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

                    if (statusAction.status !== 'unknown') {
                        // Also trigger a full table refresh if status changed
                        io.emit('data_updated');
                    }
                    console.log(`Websocket emitted for ${employee.nik}.`);
                } catch (socketError) {
                    console.error("Socket error on webhook emission:", socketError);
                }
            }

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

            const searchPhone = normalizePhone(phone_number);

            let employee = null;
            let isTS2 = false;

            if (searchPhone.length > 5) {
                let emp1 = await prisma.employeeTS1.findFirst({
                    where: { phone: { endsWith: searchPhone.slice(-10) } }
                });
                if (emp1) {
                    employee = emp1;
                    isTS2 = false;
                } else {
                    let emp2 = await prisma.employeeTS2.findFirst({
                        where: { phone: { endsWith: searchPhone.slice(-10) } }
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
