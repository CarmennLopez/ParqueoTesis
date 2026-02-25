/**
 * __tests__/setup.js - Setup global para Jest (PostgreSQL/Sequelize)
 */

const dotenv = require('dotenv');

// Cargar variables de entorno para testing
dotenv.config({ path: '.env.test' });

// Timeout global para requests
jest.setTimeout(30000);

// Cleanup después de todos los tests
afterAll(async () => {
  // Cerrar la conexión de Sequelize a PostgreSQL
  try {
    const { sequelize } = require('../src/config/database');
    if (sequelize) {
      await sequelize.close();
    }
  } catch (e) {
    // Ignorar errores al cerrar
  }

  // Esperar un poco para que todo se cierre
  await new Promise(resolve => setTimeout(resolve, 500));
});
