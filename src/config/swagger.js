const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Sistema de Parqueo UMG',
            version: '2.0.0',
            description: 'Documentación de la API REST para el sistema de gestión de parqueo de la Universidad Mariano Gálvez.',
            contact: {
                name: 'Soporte Técnico',
                email: 'soporte@umg.edu.gt',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Servidor Local (Dev)',
            },
            {
                url: 'http://192.168.1.104:5000',
                description: 'Servidor Red Local (Móvil)',
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/**/*.js', './src/models/*.js'], // Archivos locales (recursivo en routes)
};

const specs = swaggerJsdoc(options);
module.exports = specs;
