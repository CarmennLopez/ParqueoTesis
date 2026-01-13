# 🅿️ Soporte para Múltiples Parqueos

## Descripción General

El sistema ahora soporta **múltiples parqueos simultáneamente**. Un usuario puede estacionar en diferentes parqueos en diferentes ocasiones.

---

## Cambios Implementados

### 1. **Modelo de Usuario (User)**
Se agregó el campo `currentParkingLot`:
```javascript
currentParkingLot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    default: null
}
```

### 2. **Controlador de Parqueo**

#### Nuevo Endpoint: Listar Parqueos
```http
GET /api/parking/lots
```

**Respuesta:**
```json
{
  "message": "Parqueos disponibles",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Parqueo Principal",
      "location": { "type": "Point", "coordinates": [0, 0] },
      "totalSpaces": 100,
      "occupiedSpaces": 45,
      "availableSpaces": 55
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Parqueo Secundario",
      "location": { "type": "Point", "coordinates": [-90.5, 14.5] },
      "totalSpaces": 50,
      "occupiedSpaces": 20,
      "availableSpaces": 30
    }
  ]
}
```

#### Asignar Espacio (MODIFICADO)
```http
POST /api/parking/assign
```

**Cuerpo requerido:**
```json
{
  "parkingLotId": "507f1f77bcf86cd799439011"
}
```

El campo `parkingLotId` ahora es **obligatorio**.

**Cambios:**
- ✅ Valida que se proporcione el `parkingLotId`
- ✅ Busca el parqueo por ID en lugar de por nombre
- ✅ Almacena la referencia del parqueo en `user.currentParkingLot`
- ✅ Mensaje de respuesta ahora incluye el nombre del parqueo

### 3. **Estado del Parqueo (MODIFICADO)**
```http
GET /api/parking/status?parkingLotId=507f1f77bcf86cd799439011
```

O (alternativo):
```http
GET /api/parking/status?parkingLotName=Parqueo%20Principal
```

**Cambios:**
- ✅ Ahora retorna `parkingLotId` en la respuesta
- ✅ Soporta búsqueda por ID o nombre
- ✅ Si no especifica parqueo, retorna el primero disponible

---

## Casos de Uso

### Caso 1: Usuario estaciona en múltiples parqueos
```bash
# 1. Obtener lista de parqueos disponibles
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/parking/lots

# 2. Estacionar en Parqueo Principal
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"parkingLotId": "507f1f77bcf86cd799439011"}' \
  http://localhost:3000/api/parking/assign

# 3. Pagar y salir del Parqueo Principal
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/parking/pay

curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/parking/release

# 4. Estacionar en Parqueo Secundario
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"parkingLotId": "507f1f77bcf86cd799439012"}' \
  http://localhost:3000/api/parking/assign
```

### Caso 2: Admin revisa estado de múltiples parqueos
```bash
# Estado del Parqueo Principal
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:3000/api/parking/status?parkingLotId=507f1f77bcf86cd799439011"

# Estado del Parqueo Secundario
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:3000/api/parking/status?parkingLotId=507f1f77bcf86cd799439012"
```

---

## Migración desde Versión Anterior

### Para Clientes API Existentes:

**ANTES:**
```json
{
  "space": "A-01",
  "entryTime": "2024-01-12T15:30:00Z"
}
```

**AHORA:**
```json
{
  "parkingLot": "Parqueo Principal",
  "space": "A-01",
  "entryTime": "2024-01-12T15:30:00Z"
}
```

**Lo que deben cambiar:**
1. Llamar a `/api/parking/lots` primero para obtener IDs
2. Pasar `parkingLotId` en el cuerpo de `POST /api/parking/assign`
3. Actualizar parsers para leer `parkingLot` en la respuesta

---

## Configuración en la BD

### Seeder de Múltiples Parqueos
```javascript
// seeders/seedMultipleParkingLots.js
const parkingLots = [
  {
    name: 'Parqueo Principal',
    location: { type: 'Point', coordinates: [-90.5, 14.5] },
    totalSpaces: 100,
    spaces: generateSpaces('A', 100)
  },
  {
    name: 'Parqueo Secundario',
    location: { type: 'Point', coordinates: [-90.52, 14.48] },
    totalSpaces: 50,
    spaces: generateSpaces('B', 50)
  },
  {
    name: 'Parqueo VIP',
    location: { type: 'Point', coordinates: [-90.48, 14.52] },
    totalSpaces: 20,
    spaces: generateSpaces('V', 20)
  }
];
```

---

## Características Futuras

### ✨ Próximas Mejoras:
- [ ] Dashboard con mapa de múltiples parqueos
- [ ] Historial de estacionamientos por usuario
- [ ] Reservas de espacios en múltiples parqueos
- [ ] Reportes comparativos entre parqueos
- [ ] Búsqueda de parqueo cercano por GPS
- [ ] Integración con sistemas IoT por parqueo

---

## Troubleshooting

### Error: "Debe proporcionar el ID del parqueo"
**Causa:** No envió `parkingLotId` en el cuerpo de la solicitud.
**Solución:** 
```json
{
  "parkingLotId": "ID_VALIDO_DEL_PARQUEO"
}
```

### Error: "Parqueo no encontrado"
**Causa:** El `parkingLotId` no existe en la BD.
**Solución:** 
1. Verificar el ID con `GET /api/parking/lots`
2. Asegurarse de que el parqueo existe en MongoDB

### Campo `currentParkingLot` es null
**Causa:** Usuario asignado antes de actualizar el modelo.
**Solución:** 
1. Liberar el espacio actual: `POST /api/parking/release`
2. Asignar nuevamente con el `parkingLotId` correcto

---

## Versión
- **v1.1.0+** - Soporte para múltiples parqueos activado
- **Fecha:** 12 de enero de 2026
- **Estado:** ✅ Producción

