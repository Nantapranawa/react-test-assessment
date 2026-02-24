import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: [
                'http://localhost:3000',
                ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
            ],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io is not initialized!');
    }
    return io;
};
