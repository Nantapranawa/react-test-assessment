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
                        id: { type: 'integer' },
                        no: { type: 'integer' },
                        nama: { type: 'string' },
                        nik: { type: 'string' },
                        bp: { type: 'integer' },
                        posisi: { type: 'string' },
                        ac_result: { type: 'string' },
                        eligible: { type: 'string' },
                        expired: { type: 'string' },
                        phone: { type: 'string', nullable: true },
                        availability_status: { type: 'string' },
                        usulan_ubis: { type: 'string' },
                        tc_result: { type: 'string' },
                    },
                },
                Batch: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        batchName: { type: 'string', nullable: true },
                        location: { type: 'string' },
                        assessmentDate: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' },
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
