import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Assessment Planning Platform API',
            version: '1.0.0',
            description: 'API documentation for the Assessment Planning Platform Backend',
            contact: {
                name: 'API Support',
            },
        },
        servers: [
            {
                url: 'http://localhost:8000',
                description: 'Development server',
            },
        ],
        components: {
            schemas: {
                Employee: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        nik: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        status: { type: 'string' },
                        tc_result: { type: 'string' },
                        batchId: { type: 'string', nullable: true },
                    },
                },
                Batch: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        status: { type: 'string' },
                        employees: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Employee' },
                        },
                    },
                },
            },
        },
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
