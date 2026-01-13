/**
 * jest.config.js - Configuración de Jest para testing
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/config/**'
  ],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20
    }
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/logs/'
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: false
};
