# 🧪 GUÍA DE TESTING

## Introducción

Este proyecto utiliza **Jest** como framework de testing y **Supertest** para testing de API REST.

---

## Instalación de Dependencias

```bash
npm install
```

---

## Ejecutar Tests

### Todos los tests:
```bash
npm test
```

### Tests en modo watch (se re-ejecutan con cambios):
```bash
npm run test:watch
```

### Solo tests de autenticación:
```bash
npm run test:auth
```

### Con cobertura de código:
```bash
npm test -- --coverage
```

---

## Estructura de Tests

```
__tests__/
├── auth.test.js           # Tests para autenticación
├── parking.test.js        # Tests para parqueo (próximo)
├── invoice.test.js        # Tests para facturas (próximo)
└── setup.js              # Setup global de Jest
```

---

## Escribir Tests

### Ejemplo básico:
```javascript
describe('Auth Controller', () => {
  it('Debe registrar un nuevo usuario', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        cardId: 'CARD123',
        vehiclePlate: 'ABC1234'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
  });
});
```

### Métodos útiles de Jest:
```javascript
expect(value).toBe(expected)           // Igualdad estricta
expect(value).toEqual(expected)        // Igualdad profunda
expect(array).toContain(item)          // Contiene elemento
expect(object).toHaveProperty('key')   // Tiene propiedad
expect(fn).toThrow(ErrorType)          // Lanza error
expect(promise).rejects.toThrow()      // Promise rechazado
```

---

## Testing de API REST

### Métodos HTTP:
```javascript
request(app)
  .get('/endpoint')
  .expect(200)

request(app)
  .post('/endpoint')
  .send({ data })
  .expect(201)

request(app)
  .put('/endpoint/id')
  .send({ updates })
  .expect(200)

request(app)
  .delete('/endpoint/id')
  .expect(204)
```

### Headers:
```javascript
request(app)
  .post('/api/auth/login')
  .set('Authorization', `Bearer ${token}`)
  .send(credentials)
```

---

## Fixtures y Mocking

### Crear datos de prueba:
```javascript
const testUser = {
  name: 'Test User',
  email: `test-${Date.now()}@example.com`,
  password: 'Password123!',
  cardId: `CARD${Date.now()}`,
  vehiclePlate: 'ABC1234'
};
```

### Mock de funciones:
```javascript
jest.mock('../src/config/redisClient');

const { getCache } = require('../src/config/redisClient');
getCache.mockResolvedValue(null);
```

---

## Buenas Prácticas

✅ **Haz:**
- Tests pequeños y enfocados
- Nombres descriptivos: `Debe registrar un nuevo usuario`
- Limpiar datos después de cada test
- Usar `beforeEach` y `afterEach`
- Testear casos de éxito y error

❌ **Evita:**
- Tests dependientes entre sí
- Hardcodear datos (usar fixtures)
- Esperar tiempos largos
- Tests de implementación interna
- Múltiples asserts por test

---

## Próximos Tests a Implementar

- [ ] **Parking Controller**: Entry, exit, status
- [ ] **Invoice Controller**: Generate, list, pay
- [ ] **Middleware**: Auth, errors, rate limiting
- [ ] **Utilities**: Token generation, audit logging
- [ ] **Integration**: Flujo completo entrada-salida

---

## Troubleshooting

### "Cannot find module"
```bash
# Limpiar cache de Jest
npm test -- --clearCache
```

### "Connection timeout"
Asegurar que MongoDB está corriendo:
```bash
# Linux/Mac
mongod

# Windows (si está instalado)
net start MongoDB
```

### "Tests no se ejecutan"
Revisar que los archivos terminen en `.test.js`:
```bash
# Nombres válidos:
auth.test.js
parking.test.js
invoice.test.js
```

---

## Cobertura de Código

Después de ejecutar `npm test`, ver reporte:
```
PASS  __tests__/auth.test.js

File       | % Stmts | % Branch | % Funcs | % Lines |
-----------|---------|----------|---------|---------|
All files  |   50    |    45    |   55    |   50    |
```

**Objetivo**: Mantener > 80% de cobertura

---

## Recursos

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Última actualización**: 12 de enero de 2026
