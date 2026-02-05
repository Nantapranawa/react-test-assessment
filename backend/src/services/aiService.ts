import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

export const aiService = {
    async processData(data: any) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/process`, { data });
            return response.data;
        } catch (error) {
            console.error('Error calling AI Service:', error);
            throw new Error('Failed to process data with AI service');
        }
    },

    async checkHealth() {
        try {
            const response = await axios.get(AI_SERVICE_URL);
            return response.data;
        } catch (error) {
            console.error('AI Service health check failed:', error);
            return { status: 'down' };
        }
    }
};
