import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { comparePhones } from '../utils/phoneUtils';

export const authController = {
    /**
     * Login with NIK and password
     * POST /api/auth/login
     * Body: { nik_user: string, password: string }
     */
    login: async (req: Request, res: Response) => {
        try {
            const { nik_user, password, phone } = req.body;

            if (!nik_user || !password || !phone) {
                return res.status(400).json({
                    success: false,
                    error: 'NIK, password, and WhatsApp number are required'
                });
            }

            // Find user by NIK
            let user = await prisma.user.findUnique({
                where: { nik_user: nik_user }
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid NIK, password, or phone number'
                });
            }

            // Check password (simple comparison for now)
            if (user.password !== password) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid NIK, password, or phone number'
                });
            }

            // Check phone number with normalization (08/628/etc)
            if (!comparePhones(user.phone, phone)) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid NIK, password, or phone number'
                });
            }

            // Return user data (exclude password)
            const { password: _, ...userData } = user;

            return res.json({
                success: true,
                data: userData
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
     * Get current user by NIK
     * GET /api/auth/me?nik_user=xxx
     */
    getMe: async (req: Request, res: Response) => {
        try {
            const { nik_user } = req.query;

            if (!nik_user) {
                return res.status(400).json({
                    success: false,
                    error: 'NIK is required'
                });
            }

            const user = await prisma.user.findUnique({
                where: { nik_user: nik_user as string }
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            const { password: _, ...userData } = user;

            return res.json({
                success: true,
                data: userData
            });
        } catch (error) {
            console.error('GetMe error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
     * Get all users (for admin/debugging)
     * GET /api/auth/users
     */
    getUsers: async (req: Request, res: Response) => {
        try {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    name: true,
                    nik_user: true,
                    talent_solution: true,
                    role: true
                }
            });

            return res.json({
                success: true,
                data: users
            });
        } catch (error) {
            console.error('GetUsers error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
};
