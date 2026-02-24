import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

import http from 'http';
import { initSocket } from './socket';

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const port = process.env.PORT || 8000;

// Middleware
const allowedOrigins = [
    'http://localhost:3000',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Global Mutation Broadcast Middleware
app.use('/api', (req, res, next) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        res.on('finish', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Determine what was updated based on url to be efficient
                try {
                    const io = require('./socket').getIO();

                    if (req.originalUrl.includes('/webhooks') || req.originalUrl.includes('/notifications') || req.originalUrl.includes('/analyze-response')) {
                        io.emit('notification_updated');
                    }

                    if (!req.originalUrl.includes('/webhooks') && !req.originalUrl.includes('/analyze-response')) {
                        io.emit('data_updated');
                    }
                } catch (e) { /* ignore if socket not ready */ }
            }
        });
    }
    next();
});

// Main Routing
app.use('/api', router);

// Root health check
app.get('/', (req, res) => {
    res.json({ status: 'running', message: 'Backend Server is healthy' });
});

server.listen(Number(port), '0.0.0.0', () => {
    console.log(`Backend server running at http://0.0.0.0:${port}`);
});
