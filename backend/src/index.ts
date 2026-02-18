import express from 'express';
import cors from 'cors';
import router from './routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

const app = express();
const port = 8000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
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

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});
