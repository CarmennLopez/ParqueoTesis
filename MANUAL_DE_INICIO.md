# 🚗 Sistema de Gestión de Parqueo

Sistema de parqueo inteligente con API Gateway, autenticación JWT y documentación Swagger.

---

## 🚀 Inicio Rápido

### **1. Requisitos**
- Docker Desktop instalado y corriendo

### **2. Levantar el proyecto**
```bash
docker-compose up -d
```

### **3. Verificar**
```bash
docker ps
```
Debes ver 4 contenedores corriendo.

### **4. Abrir Swagger**
```
http://localhost:5000/api-docs/
```

---

## 🧪 Probar el API

1. **Registrarse:** `POST /api/auth/register`
2. **Login:** `POST /api/auth/login` → Copiar `accessToken`
3. **Autorizar:** Click en 🔓 "Authorize" → Pegar token
4. **Probar endpoints:** Cualquier endpoint ahora funcionará

---

## 🔧 Comandos Útiles

```bash
# Ver logs
docker logs parking-backend -f

# Reiniciar
docker-compose restart

# Detener
docker-compose down

# Reconstruir (después de cambios)
docker-compose up -d --build
```

---

## 📊 URLs

- **Swagger UI:** http://localhost:5000/api-docs/
- **API Gateway:** http://localhost:5000
- **Health Check:** http://localhost:5000/api/health

---

## 📚 Documentación

- `ENDPOINTS_DOCUMENTADOS.md` - Lista de todos los endpoints
- `RESUMEN_CAMBIOS_REALIZADOS.md` - Cambios recientes

---

## ⚠️ Problemas Conocidos

**Error en `POST /api/parking/assign`:**
- MongoDB standalone no soporta transacciones
- Los demás 15 endpoints funcionan correctamente

**Swagger muestra datos viejos:**
- Limpia caché: `Ctrl + Shift + R`
- O usa modo incógnito: `Ctrl + Shift + N`
