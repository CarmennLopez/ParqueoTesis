# 🤝 GUÍA DE CONTRIBUCIÓN

## Bienvenida

¡Gracias por tu interés en contribuir al Sistema de Gestión de Parqueo UMG! Esta guía te ayudará a realizar contribuciones de manera efectiva.

---

## 📋 Tabla de Contenidos

1. [Código de Conducta](#codigo-de-conducta)
2. [Antes de Empezar](#antes-de-empezar)
3. [Proceso de Contribución](#proceso-de-contribución)
4. [Estándares de Código](#estándares-de-código)
5. [Testing](#testing)
6. [Documentación](#documentación)
7. [Pull Requests](#pull-requests)
8. [Reportar Bugs](#reportar-bugs)
9. [Solicitar Funcionalidades](#solicitar-funcionalidades)

---

## 💬 Código de Conducta

### Comportamiento Esperado

- Sé respetuoso con los demás colaboradores
- Acepta crítica constructiva
- Enfócate en lo mejor para la comunidad
- Sé empático con otros desarrolladores

### Comportamiento Inaceptable

- Acoso, insultos o discriminación
- Contenido ofensivo o inapropiado
- Violación de privacidad
- Spam o trolling

---

## 🚀 Antes de Empezar

### 1. Configurar el Ambiente

```bash
# Clonar el repositorio
git clone https://github.com/your-org/TesisProyect.git
cd TesisProyect

# Instalar dependencias
npm install

# Crear rama de desarrollo
git checkout -b development
```

### 2. Leer la Documentación

- [README.md](README.md) - Introducción
- [QUICKSTART.md](QUICKSTART.md) - Setup rápido
- [ARCHITECTURE.md](ARCHITECTURE.md) - Diseño del sistema (si existe)
- [TESTING.md](TESTING.md) - Cómo hacer tests

### 3. Entender la Estructura

```
src/
├── controllers/   # Lógica de negocio
├── models/       # Esquemas MongoDB
├── routes/       # Definición de rutas
├── middleware/   # Interceptores
├── services/     # Servicios (MQTT, WebSockets)
└── utils/        # Funciones auxiliares
```

---

## 📝 Proceso de Contribución

### Paso 1: Crear un Issue

Antes de hacer grandes cambios, crea un issue describiendo:
- Qué problema resuelve
- Por qué es necesario
- Propuesta de solución (si tienes)

### Paso 2: Fork y Crear Rama

```bash
# Actualizar main
git checkout main
git pull origin main

# Crear rama con nombre descriptivo
git checkout -b feature/descripcion-corta
# o
git checkout -b bugfix/descripcion-corta
```

### Paso 3: Hacer Cambios

- Cambios pequeños y enfocados
- Commits descriptivos
- Seguir estándares de código

### Paso 4: Testing Local

```bash
# Ejecutar tests
npm test

# Verificar cobertura
npm test -- --coverage

# Linting
npm run lint
```

### Paso 5: Commit y Push

```bash
# Commit con mensaje descriptivo
git add .
git commit -m "feat: descripción del cambio"

# Push a tu fork
git push origin feature/descripcion-corta
```

### Paso 6: Pull Request

1. Abre un PR contra la rama `development`
2. Completa la plantilla de PR
3. Solicita revisión
4. Responde los comentarios de revisión

---

## 📐 Estándares de Código

### Naming Conventions

```javascript
// ✅ Bueno
const getUserById = async (userId) => { ... }
const isValidEmail = (email) => { ... }
class ParkingController { ... }

// ❌ Malo
const get_user_by_id = (u) => { ... }
const valid = (e) => { ... }
const parking = { ... }
```

### Estructura de Archivos

```javascript
// 1. Imports
const express = require('express');
const { validateRequest } = require('../middleware');

// 2. Constantes
const TIMEOUT_MS = 5000;

// 3. Exports (al final)
module.exports = router;
```

### Comentarios

```javascript
// ✅ Bueno - explicar el "por qué"
const MAX_RETRIES = 3; // Permitir 3 reintentos después de fallo de BD

// ❌ Malo - explicar lo obvio
const count = 0; // inicializar count a 0
```

### Manejo de Errores

```javascript
// ✅ Bueno
try {
  await updateUser(id, data);
  res.json({ message: 'User updated' });
} catch (error) {
  logger.error(`Error updating user ${id}:`, error);
  res.status(500).json({ detail: error.message });
}

// ❌ Malo
try {
  // lógica
} catch (e) {
  console.log('error');
}
```

---

## 🧪 Testing

### Escribir Tests

```javascript
// Tests deben estar en __tests__/
describe('Feature Name', () => {
  it('should do something specific', async () => {
    // Arrange
    const input = { ... };
    
    // Act
    const result = await function(input);
    
    // Assert
    expect(result).toEqual(expected);
  });
});
```

### Checklist antes de PR

- [ ] Tests escritos para código nuevo
- [ ] Tests existentes pasan
- [ ] Cobertura >= 50%
- [ ] Sin console.log o debugger
- [ ] Sin comentarios innecesarios

---

## 📚 Documentación

### Actualizar Documentación

Si cambias funcionalidad, actualiza:
- [README.md](README.md) - Si afecta instalación/uso
- [CHANGELOG.md](CHANGELOG.md) - Siempre
- [SECURITY.md](SECURITY.md) - Si afecta seguridad
- Comentarios en el código

### JSDoc para Funciones Públicas

```javascript
/**
 * Obtiene usuario por ID
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Datos del usuario
 * @throws {Error} Si el usuario no existe
 */
const getUserById = async (userId) => {
  // ...
};
```

---

## 🔄 Pull Requests

### Plantilla de PR

```markdown
## Descripción
Descripción breve de los cambios

## Tipo de Cambio
- [ ] Bug fix
- [ ] Feature nueva
- [ ] Breaking change
- [ ] Documentación

## Testing Realizado
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Checklist
- [ ] Código sigue los estándares
- [ ] Tests pasan
- [ ] Documentación actualizada
- [ ] Sin breaking changes (o documentado)

## Screenshots (si aplica)
<!-- Agrega screenshots de cambios visuales -->

## Notas Adicionales
<!-- Cualquier información relevante -->
```

### Criterios de Aprobación

- ✅ Mínimo 1 aprobación
- ✅ Tests pasando
- ✅ Sin conflictos de merge
- ✅ Documentación actualizada
- ✅ Código sigue estándares

---

## 🐛 Reportar Bugs

### Plantilla de Issue

```markdown
## Descripción del Bug
Descripción clara y concisa

## Pasos para Reproducir
1. Paso 1
2. Paso 2
3. ...

## Comportamiento Esperado
Qué debería suceder

## Comportamiento Actual
Qué sucede realmente

## Ambiente
- Node.js: [versión]
- OS: [Windows/Linux/Mac]
- Docker: [si/no]

## Logs Relevantes
```
[Pega logs aquí]
```

## Screenshots
[Si aplica]
```

### Buenos Reportes de Bug

✅ **Descriptivos** - Explican claramente el problema
✅ **Reproducibles** - Pasos claros para reproducir
✅ **Aislados** - Información no confidencial
✅ **Constructivos** - Sin lenguaje ofensivo

---

## ✨ Solicitar Funcionalidades

### Plantilla de Feature Request

```markdown
## Descripción
Descripción de la funcionalidad deseada

## Caso de Uso
Por qué se necesita esta funcionalidad

## Propuesta de Solución
Cómo podrías implementarla (opcional)

## Alternativas Consideradas
Otras soluciones posibles

## Contexto Adicional
Cualquier información relevante
```

---

## 🚦 Flujo de Trabajo

```
main (producción)
  ↑
  └─ release/v1.1.0 (pre-producción)
      ↑
      └─ development (integración)
          ↑
          └─ feature/mi-funcionalidad (tu rama)
```

### Ramas

- **main**: Producción estable
- **development**: Integración de features
- **feature/xxx**: Tu nueva funcionalidad
- **bugfix/xxx**: Corrección de bug
- **release/xxx**: Preparación de release

---

## 💡 Tips Útiles

### Antes de Hacer Cambios Grandes

1. Crea un issue para discutir
2. Espera feedback del equipo
3. Diseña en alto nivel primero
4. Divide en PRs pequeños si es posible

### Debugging

```bash
# Logs detallados
LOG_LEVEL=debug npm run dev

# Debugger de Node.js
node --inspect server.js

# Tests específicos
npm test -- __tests__/auth.test.js
```

### Performance

```bash
# Analizar tiempo de startup
time npm run dev

# Memory leak check
npm install -g clinic
clinic doctor -- node server.js
```

---

## 🎓 Recursos

### Documentación del Proyecto
- [README.md](README.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [TESTING.md](TESTING.md)
- [SECURITY.md](SECURITY.md)

### Recursos Externos
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Jest Documentation](https://jestjs.io/)

---

## 🎯 Qué Busca el Proyecto

### Contribuciones Bienvenidas

- ✅ Bug fixes
- ✅ Tests adicionales
- ✅ Mejoras de documentación
- ✅ Refactoring de código
- ✅ Features nuevas (con issue primero)
- ✅ Reportes de seguridad

### Contribuciones No Aceptadas

- ❌ Cambios en estructura sin discusión
- ❌ Features sin issue relacionado
- ❌ Código sin tests
- ❌ Contenido ofensivo
- ❌ Spam

---

## 📞 Preguntas?

- 📧 Email: dev@umg.edu.gt
- 💬 Abre una discussion en GitHub
- 🔗 Consulta la documentación

---

## 🙏 Gracias

¡Gracias por contribuir! Tu trabajo ayuda a mejorar el proyecto.

---

**Versión**: 1.0
**Última actualización**: 12 de enero de 2026
