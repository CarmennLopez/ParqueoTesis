/**
 * Tests para el controlador de autenticación
 * Ejecutar con: npm test
 */

const request = require('supertest');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Mock del servidor Express para testing
const createTestApp = () => {
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  
  // Importar rutas
  const authRoutes = require('../src/routes/authRoutes');
  app.use('/api/auth', authRoutes);
  
  return app;
};

describe('Authentication Controller', () => {
  let app;
  let connection;

  beforeAll(async () => {
    // Conectar a base de datos de testing
    try {
      connection = await mongoose.connect(process.env.MONGODB_URI);
      app = createTestApp();
    } catch (error) {
      console.error('Error de conexión a MongoDB:', error);
    }
  });

  afterAll(async () => {
    // Limpiar conexión
    if (connection) {
      await mongoose.disconnect();
    }
  });

  describe('POST /api/auth/register', () => {
    it('Debe registrar un nuevo usuario con datos válidos', async () => {
      const newUser = {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'Password123!',
        cardId: `CARD${Date.now()}`,
        vehiclePlate: 'ABC1234'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.email).toBe(newUser.email);
    });

    it('No debe registrar con email duplicado', async () => {
      const duplicateUser = {
        name: 'Duplicate User',
        email: `dup-${Date.now()}@example.com`,
        password: 'Password123!',
        cardId: `CARD${Date.now()}`,
        vehiclePlate: 'XYZ9999'
      };

      // Primer registro
      const response1 = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser);
      
      expect(response1.status).toBe(201);

      // Segundo intento (debe fallar)
      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser);
      
      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('Debe login con credenciales válidas', async () => {
      const credentials = {
        email: `login-test-${Date.now()}@example.com`,
        password: 'Password123!'
      };

      // Registrar primero
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          ...credentials,
          name: 'Login Test',
          cardId: `CARD${Date.now()}`,
          vehiclePlate: 'LGN1234'
        });

      expect(registerResponse.status).toBe(201);

      // Intentar login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');
      expect(loginResponse.body).toHaveProperty('refreshToken');
    });

    it('No debe login con contraseña incorrecta', async () => {
      const credentials = {
        email: `wrong-test-${Date.now()}@example.com`,
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);
      
      expect(response.status).toBe(401);
      expect(response.body).toBeDefined();
    });
  });
});
