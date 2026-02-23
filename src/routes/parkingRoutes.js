// src/routes/parkingRoutes.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const parkingController = require('../controllers/parking');
const { USER_ROLES } = require('../config/constants');
const distributedRateLimit = require('../middleware/rateLimitMiddleware');
const { checkSolvency } = require('../middleware/solvencyMiddleware');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// LOTES DE PARQUEO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/parking/lots:
 *   get:
 *     tags: [Parqueo]
 *     summary: Listar lotes de parqueo
 *     description: Retorna todos los lotes registrados con su disponibilidad de espacios en tiempo real.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de lotes obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:               { type: integer, example: 1 }
 *                       name:             { type: string,  example: "Lote Norte" }
 *                       totalSpaces:      { type: integer, example: 50 }
 *                       availableSpaces:  { type: integer, example: 23 }
 *                       hourlyRate:       { type: number,  example: 5.00 }
 *                       location:
 *                         type: object
 *                         properties:
 *                           lat: { type: number, example: 14.6349 }
 *                           lng: { type: number, example: -90.5069 }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Parqueo]
 *     summary: Crear lote de parqueo (Admin)
 *     description: Crea un nuevo lote de parqueo con sus espacios. Requiere rol `admin`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParkingLotRequest'
 *     responses:
 *       201:
 *         description: Lote creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/lots', protect, parkingController.getParkingLots);
router.post('/lots', protect, authorize(USER_ROLES.ADMIN), parkingController.createParkingLot || ((req, res) => res.json({ message: 'Endpoint en desarrollo' })));

// ─────────────────────────────────────────────────────────────────────────────
// FLUJO PRINCIPAL: ENTRADA → PAGO → SALIDA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/parking/assign:
 *   post:
 *     tags: [Parqueo]
 *     summary: Asignar espacio de parqueo (Entrada)
 *     description: |
 *       Asigna el primer espacio libre del lote al usuario autenticado.
 *       - El usuario debe tener **solvencia vigente** (si es estudiante).
 *       - Marca la hora de entrada y actualiza el estado del espacio en tiempo real (WebSocket).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignRequest'
 *     responses:
 *       200:
 *         description: Espacio asignado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:      { type: string,  example: "Espacio asignado con éxito" }
 *                 parkingLot:   { type: string,  example: "Lote Norte" }
 *                 space:        { type: string,  example: "A-5" }
 *                 entryTime:    { type: string,  format: date-time }
 *                 info:         { type: string,  example: "Tarifa al salir." }
 *       400:
 *         description: El usuario ya tiene un espacio asignado o datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       402:
 *         description: Usuario no solvente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "No tiene solvencia vigente para acceder al parqueo"
 *       404:
 *         description: No hay espacios disponibles en el lote
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "No hay espacios disponibles"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/assign', protect, checkSolvency, parkingController.assignSpace);

/**
 * @swagger
 * /api/parking/pay:
 *   post:
 *     tags: [Parqueo]
 *     summary: Pagar tarifa de parqueo
 *     description: |
 *       Registra el pago de la tarifa calculada por el tiempo de permanencia.
 *       Debe llamarse **antes** de `/api/parking/release`.
 *       > Limitado a **3 intentos por minuto** (rate limit).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PayRequest'
 *     responses:
 *       200:
 *         description: Pago registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:    { type: boolean, example: true }
 *                 message:    { type: string,  example: "Pago registrado." }
 *                 amount:     { type: number,  example: 15.50 }
 *                 duration:   { type: string,  example: "3h 5min" }
 *       400:
 *         description: El usuario no tiene espacio asignado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Demasiados intentos de pago
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/pay',
    protect,
    distributedRateLimit('pay', 3, 60),
    parkingController.payParking
);

/**
 * @swagger
 * /api/parking/release:
 *   post:
 *     tags: [Parqueo]
 *     summary: Liberar espacio de parqueo (Salida)
 *     description: |
 *       Registra la salida del usuario, libera el espacio asignado y abre la barrera de salida.
 *       Actualiza disponibilidad en tiempo real vía WebSocket.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Salida exitosa, espacio liberado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "¡Salida exitosa! Espacio A-5 liberado." }
 *       400:
 *         description: Usuario no tiene espacio asignado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/release', protect, parkingController.releaseSpace);

// ─────────────────────────────────────────────────────────────────────────────
// ADMINISTRACIÓN / DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/parking/status:
 *   get:
 *     tags: [Parqueo]
 *     summary: Estado actual del parqueo (Dashboard)
 *     description: |
 *       Retorna el estado de ocupación de todos los lotes y espacios.
 *       Acceso permitido a roles: `admin`, `guard`, `faculty`.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado del parqueo obtenido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       lotId:           { type: integer, example: 1 }
 *                       name:            { type: string,  example: "Lote Norte" }
 *                       totalSpaces:     { type: integer, example: 50 }
 *                       occupiedSpaces:  { type: integer, example: 27 }
 *                       availableSpaces: { type: integer, example: 23 }
 *                       occupancyRate:   { type: string,  example: "54%" }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/status',
    protect,
    authorize(USER_ROLES.ADMIN, USER_ROLES.GUARD, USER_ROLES.FACULTY),
    parkingController.getParkingStatus
);

/**
 * @swagger
 * /api/parking/gate/open:
 *   post:
 *     tags: [Parqueo]
 *     summary: Abrir barrera del parqueo
 *     description: |
 *       Envía señal MQTT para abrir la barrera de entrada o salida.
 *       Acceso: `admin`, `guard`, `faculty`, `student`.
 *       > Limitado a **5 aperturas por minuto** por usuario.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gate:
 *                 type: string
 *                 enum: [GATE_MAIN_ENTRY, GATE_MAIN_EXIT]
 *                 default: GATE_MAIN_ENTRY
 *                 example: "GATE_MAIN_ENTRY"
 *     responses:
 *       200:
 *         description: Señal de apertura enviada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Barrera abierta"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       429:
 *         description: Demasiadas aperturas en poco tiempo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/gate/open',
    protect,
    authorize(USER_ROLES.ADMIN, USER_ROLES.GUARD, USER_ROLES.FACULTY, USER_ROLES.STUDENT),
    distributedRateLimit('gate_open', 5, 60),
    parkingController.openGate
);

// ─────────────────────────────────────────────────────────────────────────────
// SOLVENCIA MENSUAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/parking/solvency/{userId}:
 *   put:
 *     tags: [Solvencia]
 *     summary: Actualizar solvencia de un usuario
 *     description: |
 *       Marca a un usuario como **solvente** por N meses (1–12).
 *       Si ya tiene solvencia vigente, la extiende desde su fecha actual de vencimiento.
 *       Acceso: `admin`, `guard`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 5
 *         description: ID numérico del usuario a actualizar
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SolvencyUpdateRequest'
 *     responses:
 *       200:
 *         description: Solvencia actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string,  example: "Solvencia actualizada correctamente por 1 mes(es)" }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:              { type: integer }
 *                     name:            { type: string  }
 *                     email:           { type: string  }
 *                     cardId:          { type: string  }
 *                     isSolvent:       { type: boolean, example: true }
 *                     solvencyExpires: { type: string, format: date-time }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/solvency/:userId',
    protect,
    authorize(USER_ROLES.ADMIN, USER_ROLES.GUARD),
    parkingController.updateSolvency
);

/**
 * @swagger
 * /api/parking/solvency/{cardId}:
 *   get:
 *     tags: [Solvencia]
 *     summary: Consultar solvencia por carné
 *     description: |
 *       Consulta el estado de solvencia de un usuario por su **número de carné**.
 *       Retorna información detallada incluyendo días restantes y si el rol está exento.
 *       Acceso: todos los usuarios autenticados.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *           example: "12345678"
 *         description: Número de carné estudiantil
 *     responses:
 *       200:
 *         description: Información de solvencia obtenida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:                  { type: integer }
 *                     name:                { type: string,  example: "Carmen Lopez" }
 *                     email:               { type: string  }
 *                     role:                { type: string,  example: "student" }
 *                     cardId:              { type: string,  example: "12345678" }
 *                     vehiclePlate:        { type: string,  example: "UMG-001" }
 *                     currentParkingSpace: { type: string,  example: "A-5", nullable: true }
 *                 solvency:
 *                   type: object
 *                   properties:
 *                     isSolvent:       { type: boolean, example: true }
 *                     isExemptRole:    { type: boolean, example: false }
 *                     solvencyExpires: { type: string, format: date-time }
 *                     daysRemaining:   { type: integer, example: 15 }
 *                     status:          { type: string, example: "VIGENTE (15 días restantes)" }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: No se encontró usuario con ese carné
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/solvency/:cardId',
    protect,
    parkingController.checkSolvencyByCardId
);

/**
 * @swagger
 * /api/parking/solvency-report:
 *   get:
 *     tags: [Solvencia]
 *     summary: Reporte de solvencia de todos los estudiantes (Admin)
 *     description: |
 *       Genera un reporte completo con el estado de solvencia de todos los estudiantes.
 *       Ordenado por fecha de vencimiento (los que vencen primero aparecen primero).
 *       Acceso: `admin`.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reporte de solvencia
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total:   { type: integer, example: 120 }
 *                     solvent: { type: integer, example: 95 }
 *                     expired: { type: integer, example: 25 }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:              { type: integer  }
 *                       name:            { type: string   }
 *                       email:           { type: string   }
 *                       cardId:          { type: string   }
 *                       vehiclePlate:    { type: string   }
 *                       isSolvent:       { type: boolean  }
 *                       solvencyExpires: { type: string, format: date-time }
 *                       daysRemaining:   { type: integer  }
 *                       status:          { type: string, enum: [VIGENTE, VENCIDA] }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/solvency-report',
    protect,
    authorize(USER_ROLES.ADMIN),
    parkingController.getSolvencyReport
);

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS DE SIMULACIÓN (Solo para Demo/Testing)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/parking/simulate/fill:
 *   post:
 *     tags: [Simulación]
 *     summary: Simular lote lleno (Testing)
 *     description: |
 *       Marca todos los espacios de un lote como **ocupados** para probar el comportamiento del sistema cuando no hay disponibilidad.
 *       > ⚠️ Solo para entornos de testing/demo.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [parkingLotId]
 *             properties:
 *               parkingLotId: { type: integer, example: 1 }
 *     responses:
 *       200:
 *         description: Lote marcado como lleno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/simulate/fill',
    protect,
    parkingController.simulateFill
);

/**
 * @swagger
 * /api/parking/simulate/empty:
 *   post:
 *     tags: [Simulación]
 *     summary: Simular lote vacío (Testing)
 *     description: |
 *       Marca todos los espacios de un lote como **disponibles**.
 *       > ⚠️ Solo para entornos de testing/demo.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [parkingLotId]
 *             properties:
 *               parkingLotId: { type: integer, example: 1 }
 *     responses:
 *       200:
 *         description: Lote vaciado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/simulate/empty',
    protect,
    parkingController.simulateEmpty
);

module.exports = router;
