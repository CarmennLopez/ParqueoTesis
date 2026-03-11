# Guía de Uso: API Swagger 🚀

Esta documentación explica detalladamente cómo utilizar y probar los endpoints del sistema de parqueo a través de la interfaz interactiva de Swagger.

## 📍 Acceso
La documentación está disponible en tiempo real mientras el servidor está corriendo:
- **Local:** [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **Red Local:** `http://TU-IP:5000/api-docs`

---

## 🔐 1. Autenticación y Seguridad

Antes de probar la mayoría de los endpoints, necesitas un **Token de Acceso**.

### Cómo obtener el Token:
1. Ve al endpoint `POST /api/auth/login`.
2. Haz clic en **Try it out** y envía tus credenciales.
3. Copia el valor de `accessToken` de la respuesta satisfactoria.

### Cómo Aplicar el Token en Swagger:
1. Haz clic en el botón verde **Authorize** (arriba a la derecha).
2. En el campo de valor, escribe: `Bearer ` seguido de tu token (Ejm: `Bearer eyJhbGci...`).
3. Haz clic en **Authorize** y luego **Close**.
*Los candados de los endpoints ahora aparecerán cerrados, indicando que tienes permiso.*

---

## 🛰️ 2. Endpoints Principales

### 👤 Módulo Estudiante / Usuario Final
- **`GET /api/parking/lots`**: Muestra todos los parqueos disponibles y cuántos espacios libres tienen. Útil para el mapa inicial. Integra WebSockets para actualización real-time.
- **`POST /api/parking/assign`**: Solicita un espacio automático. El sistema te asignará el más cercano disponible basándose en tu ubicación.
- **`GET /api/parking/current-assignment`**: Devuelve tu información de asignación activa en el parqueo actual.
- **`POST /api/parking/release`**: Libera tu espacio al salir.

### 📊 Módulo Administrador (Nuevos Endpoints)
- **`POST /api/parking/admin/lots`**: Permite crear dinámicamente nuevos parqueos definiendo coordenadas, nombre y capacidad.
- **`PATCH /api/parking/admin/lots/{id}`**: Actualiza coordenadas o capacidad. El sistema regenera los espacios inteligentemente.
- **`GET /api/parking/admin/stats/dashboard`**: Resumen en tiempo real de ocupación de todos los lotes.

### 👮 Módulo Guardia (Garita)
- **`POST /api/parking/gate/open`**: Abre manualmente la talanquera física (IoT) enviando señales al Gateway MQTT.

---

## 🛠️ 3. Pruebas Técnicas (Health & IoT)
- **`/health/readiness`**: Verifica que la Base de Datos y Redis estén conectados correctamente.
- **`POST /api/iot/lpr/event`**: Simula una cámara inteligente detectando una placa. Es el endpoint que conecta el hardware con el software.

---

> [!TIP]
> **Esquemas de Datos:** Al final de la página de Swagger, verás una sección llamada **Schemas**. Ahí puedes ver la estructura exacta (campos, tipos de datos, obligatoriedad) de cada objeto (Usuario, Sesión, Parqueo) que maneja el sistema.
