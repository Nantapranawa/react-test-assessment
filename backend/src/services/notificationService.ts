import axios from 'axios';
import { prisma } from '../lib/prisma';
import { normalizePhone } from '../utils/phoneUtils';

export const notificationService = {
    async sendAdminWhatsAppNotification(data: {
        phone: string;
        user: string;
        name: string;
        status: string;
        assessment: string;
        tanggal: string;
        lokasi: string;
        batch: string;
    }) {
        try {
            const { phone, user, name, status, assessment, tanggal, lokasi, batch } = data;

            const OCA_API_URL = "https://wa01.ocatelkom.co.id/api/v2/push/message";
            const TEMPLATE_CODE_ID = process.env.OCA_TEMPLATE_ADMIN_NOTIF_ID || "";
            const JWT_TOKEN = process.env.OCA_JWT_TOKEN || "";

            if (!JWT_TOKEN || !TEMPLATE_CODE_ID) {
                console.error("Missing OCA Env Variables for Admin Notification");
                return { success: false, error: "Configuration Error" };
            }

            const formattedPhone = normalizePhone(phone);

            const payload = {
                "phone_number": formattedPhone,
                "message": {
                    "type": "template",
                    "template": {
                        "template_code_id": TEMPLATE_CODE_ID,
                        "payload": [
                            {
                                "position": "body",
                                "parameters": [
                                    { "type": "text", "text": String(user) },
                                    { "type": "text", "text": String(name) },
                                    { "type": "text", "text": String(status) },
                                    { "type": "text", "text": String(assessment) },
                                    { "type": "text", "text": String(tanggal) },
                                    { "type": "text", "text": String(lokasi) },
                                    { "type": "text", "text": String(batch) }
                                ]
                            }
                        ]
                    }
                }
            };

            console.log(`[NotificationService] Sending Admin Notification to ${formattedPhone}...`);

            const response = await axios.post(OCA_API_URL, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': JWT_TOKEN
                }
            });

            return { success: response.data?.success || false, data: response.data };
        } catch (error: any) {
            console.error("Error in notificationService.sendAdminWhatsAppNotification:", error.message);
            return { success: false, error: error.message };
        }
    },

    async sendReschedulePromptNotification(data: {
        phone: string;
        name: string;
        assessment: string;
        tanggal: string;
    }) {
        try {
            const { phone, name, assessment, tanggal } = data;

            const OCA_API_URL = "https://wa01.ocatelkom.co.id/api/v2/push/message";
            const TEMPLATE_CODE_ID = process.env.OCA_TEMPLATE_RESCHEDULE_PROMPT_ID || "b20e7df6-random-tempalte-id";
            const JWT_TOKEN = process.env.OCA_JWT_TOKEN || "";

            if (!JWT_TOKEN || !TEMPLATE_CODE_ID) {
                console.error("Missing OCA Env Variables for Reschedule Prompt");
                return { success: false, error: "Configuration Error" };
            }

            const formattedPhone = normalizePhone(phone);

            const payload = {
                "phone_number": formattedPhone,
                "message": {
                    "type": "template",
                    "template": {
                        "template_code_id": TEMPLATE_CODE_ID,
                        "payload": [
                            {
                                "position": "body",
                                "parameters": [
                                    { "type": "text", "text": String(name) },
                                    { "type": "text", "text": String(assessment) },
                                    { "type": "text", "text": String(tanggal) }
                                ]
                            }
                        ]
                    }
                }
            };

            console.log(`[NotificationService] Sending Reschedule Prompt Notification to ${formattedPhone} (${name})...`);

            const response = await axios.post(OCA_API_URL, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': JWT_TOKEN
                }
            });

            return { success: response.data?.success || false, data: response.data };
        } catch (error: any) {
            console.error("Error in notificationService.sendReschedulePromptNotification:", error.message);
            return { success: false, error: error.message };
        }
    }
};
