const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth');
const { googleLogin } = require('../controllers/auth/google.controller');
const handleValidationErrors = require('../middleware/validationMiddleware');
const { registerValidation, loginValidation } = require('../middleware/validators/authValidators');
const { protect } = require('../middleware/authMiddleware');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Demasiados intentos. Intente en 15 minutos.' },
    standardHeaders: true, legacyHeaders: false,
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Autenticación]
 *     summary: Registrar un nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [student, faculty, visitor, guard, admin] }
 *               vehiclePlate: { type: string }
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/register', registerValidation, handleValidationErrors, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Autenticación]
 *     summary: Iniciar sesión con credenciales tradicionales
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 accessToken: { type: string }
 *                 user: { type: object }
 *       401:
 *         description: Credenciales incorrectas
 */
router.post('/login', loginLimiter, loginValidation, handleValidationErrors, authController.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Autenticación]
 *     summary: Refrescar el token de acceso
 *     responses:
 *       200:
 *         description: Nuevo token generado
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Autenticación]
 *     summary: Cerrar sesión activa
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Autenticación]
 *     summary: Obtener el perfil del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del perfil incluyendo estado de parqueo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer }
 *                 name: { type: string }
 *                 email: { type: string }
 *                 role: { type: string }
 *                 currentParkingLotId: { type: integer }
 *                 currentParkingSpace: { type: string }
 *                 currentParkingLot: { type: string }
 *                 entryTime: { type: string, format: date-time }
 */
router.get('/me', protect, authController.getMe);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     tags: [Autenticación]
 *     summary: Autenticación con Google (Social Login)
 *     description: Solo se permiten correos @miumg.edu.gt
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken: { type: string }
 *     responses:
 *       200:
 *         description: Autenticación exitosa
 */
router.post('/google', googleLogin);

/**
 * @swagger
 * /api/auth/switch-role:
 *   post:
 *     tags: [Autenticación]
 *     summary: Cambiar el rol del usuario (Solo pruebas/Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string }
 */
router.post('/switch-role', protect, authController.switchRole);

module.exports = router;