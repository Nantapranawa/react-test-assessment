import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Get all notifications
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const notifications = await prisma.notification.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                employee: {
                    select: {
                        nama: true,
                        posisi: true
                    }
                }
            },
            take: 50
        });

        // Count unread
        const unreadCount = await prisma.notification.count({
            where: { isRead: false }
        });

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.notification.update({
            where: { id: parseInt(id) },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Mark all as read
export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        await prisma.notification.updateMany({
            where: { isRead: false },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Simulate AI Service analysis (Mock function)
// This function acts as a placeholder for the future AI service integration.
// It analyzes the employee's response message to determine their intent/status.
// MOVED TO aiController.ts as analyzeEmployeeResponse

// Simulate employee response (Accept, Reject, Reschedule)
// MOVED TO aiController.ts as analyzeEmployeeResponse
