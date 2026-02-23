import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

const app = express();
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

// Main Routing
app.use('/api', router);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root health check
app.get('/', (req, res) => {
    res.json({ status: 'running', message: 'Backend Server is healthy' });
});

app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Backend server running at http://0.0.0.0:${port}`);
});
