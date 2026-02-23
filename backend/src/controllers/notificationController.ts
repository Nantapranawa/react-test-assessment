import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Get all notifications
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const { talent_solution } = req.query;
        let notifications: any[] = [];
        let unreadCount = 0;

        if (talent_solution === 'all') {
            const notifs1 = await prisma.notificationTS1.findMany({
                orderBy: { createdAt: 'desc' },
                include: { employee: { select: { nama: true, posisi: true } } },
                take: 25
            });
            const notifs2 = await prisma.notificationTS2.findMany({
                orderBy: { createdAt: 'desc' },
                include: { employee: { select: { nama: true, posisi: true } } },
                take: 25
            });

            // Tag them so frontend knows where they came from
            const tagged1 = notifs1.map(n => ({ ...n, talent_solution: 1 }));
            const tagged2 = notifs2.map(n => ({ ...n, talent_solution: 2 }));

            // Combine and sort by date
            notifications = [...tagged1, ...tagged2].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ).slice(0, 50);

            const unread1 = await prisma.notificationTS1.count({ where: { isRead: false } });
            const unread2 = await prisma.notificationTS2.count({ where: { isRead: false } });
            unreadCount = unread1 + unread2;
        } else if (talent_solution === '2' || Number(talent_solution) === 2) {
            const notifs = await prisma.notificationTS2.findMany({
                orderBy: { createdAt: 'desc' },
                include: { employee: { select: { nama: true, posisi: true } } },
                take: 50
            });
            notifications = notifs.map(n => ({ ...n, talent_solution: 2 }));
            unreadCount = await prisma.notificationTS2.count({ where: { isRead: false } });
        } else {
            // Default to TS1
            const notifs = await prisma.notificationTS1.findMany({
                orderBy: { createdAt: 'desc' },
                include: { employee: { select: { nama: true, posisi: true } } },
                take: 50
            });
            notifications = notifs.map(n => ({ ...n, talent_solution: 1 }));
            unreadCount = await prisma.notificationTS1.count({ where: { isRead: false } });
        }

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount
            }
        });
    } catch (error: any) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { talent_solution } = req.query;
        const ts = talent_solution === '2' || Number(talent_solution) === 2 ? 2 : 1;

        if (ts === 2) {
            await prisma.notificationTS2.update({
                where: { id: parseInt(id) },
                data: { isRead: true }
            });
        } else {
            await prisma.notificationTS1.update({
                where: { id: parseInt(id) },
                data: { isRead: true }
            });
        }
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Mark all as read
export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const { talent_solution } = req.query;

        if (talent_solution === 'all') {
            await Promise.all([
                prisma.notificationTS1.updateMany({
                    where: { isRead: false },
                    data: { isRead: true }
                }),
                prisma.notificationTS2.updateMany({
                    where: { isRead: false },
                    data: { isRead: true }
                })
            ]);
        } else if (talent_solution === '2' || Number(talent_solution) === 2) {
            await prisma.notificationTS2.updateMany({
                where: { isRead: false },
                data: { isRead: true }
            });
        } else {
            await prisma.notificationTS1.updateMany({
                where: { isRead: false },
                data: { isRead: true }
            });
        }
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
