/**
 * __tests__/setup.js - Setup para Jest
 */

const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Cargar variables de entorno para testing
dotenv.config({ path: '.env.test' });

// Timeout global para requests
jest.setTimeout(30000);

// Cleanup después de todos los tests
afterAll(async () => {
  // Desconectar de MongoDB
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  
  // Esperar un poco para que todo se cierre
  await new Promise(resolve => setTimeout(resolve, 500));
});
