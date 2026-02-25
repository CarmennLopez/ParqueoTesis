/**
 * __tests__/auth.test.js - Tests para el controlador de autenticación
 * Ejecutar con: npm test o npm run test:auth
 */

const request = require('supertest');
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

  beforeAll(async () => {
    // Conectar a base de datos de testing (PostgreSQL via Sequelize)
    try {
      const { sequelize } = require('../src/config/database');
      await sequelize.authenticate();
      console.log('✅ Conectado a PostgreSQL para testing');
      app = createTestApp();
    } catch (error) {
      console.error('❌ Error de conexión a PostgreSQL:', error.message);
      throw error;
    }
  });

  afterAll(async () => {
    // La conexión se cierra en setup.js (afterAll global)
  });

  describe('POST /api/auth/register', () => {
    it('Debe registrar un nuevo usuario con datos válidos', async () => {
      const newUser = {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'Password123!',
        cardId: `CARD${Date.now()}`,
        vehiclePlate: `T${Date.now().toString().slice(-7)}`
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.email).toBe(newUser.email);
    });

    it('No debe registrar con email duplicado', async () => {
      const ts = Date.now();
      const duplicateUser = {
        name: 'Duplicate User',
        email: `dup-${ts}@example.com`,
        password: 'Password123!',
        cardId: `DUP${ts}`,
        vehiclePlate: `D${ts.toString().slice(-7)}`
      };

      // Primer registro
      const response1 = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser);

      expect(response1.status).toBe(201);

      // Segundo intento con mismo email (debe fallar)
      const duplicateUser2 = { ...duplicateUser, cardId: `DUP${ts}2`, vehiclePlate: `D${ts.toString().slice(-6)}2` };
      const response2 = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser2);

      expect(response2.status).toBe(400);
      expect(response2.body).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('Debe login con credenciales válidas', async () => {
      const ts = Date.now();
      const credentials = {
        email: `login-test-${ts}@example.com`,
        password: 'Password123!'
      };

      // Registrar primero
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          ...credentials,
          name: 'Login Test',
          cardId: `LGN${ts}`,
          vehiclePlate: `L${ts.toString().slice(-7)}`
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
