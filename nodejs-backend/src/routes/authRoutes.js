// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { body, validationResult } = require('express-validator');

// Rate limiter para login - prevenir fuerza bruta
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos por ventana
    message: {
        success: false,
        message: 'Demasiados intentos de inicio de sesión. Por favor, intente de nuevo en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors.array()
        });
    }
    next();
};

// Validadores para registro
const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),

    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),

    body('cardId')
        .trim()
        .notEmpty().withMessage('El ID de tarjeta es requerido')
        .isLength({ min: 4, max: 20 }).withMessage('El ID de tarjeta debe tener entre 4 y 20 caracteres'),

    body('vehiclePlate')
        .trim()
        .notEmpty().withMessage('La placa del vehículo es requerida')
        .matches(/^[A-Z0-9]{6,8}$/i).withMessage('La placa debe tener entre 6 y 8 caracteres alfanuméricos')
];

// Validadores para login
const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe ser un email válido'),

    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
];

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Registrar un nuevo usuario
 *     description: Crea una nueva cuenta de usuario en el sistema
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - cardId
 *               - vehiclePlate
 *             properties:
 *               name:
 *                 type: string
 *                 example: Juan Pérez
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123
 *               cardId:
 *                 type: string
 *                 example: CARD12345
 *               vehiclePlate:
 *                 type: string
 *                 example: ABC1234
 *               role:
 *                 type: string
 *                 enum: [student, faculty, visitor, guard, admin]
 *                 example: student
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Datos inválidos o usuario ya existe
 */
router.post('/register', registerValidation, handleValidationErrors, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Iniciar sesión
 *     description: Autenticar usuario y obtener tokens JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', loginLimiter, loginValidation, handleValidationErrors, authController.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Renovar Access Token
 *     description: Obtener un nuevo Access Token usando el Refresh Token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token renovado exitosamente
 *       403:
 *         description: Refresh Token inválido o expirado
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Cerrar sesión
 *     description: Revocar el Refresh Token del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Autenticación
 *     summary: Obtener perfil del usuario actual
 *     description: Devuelve la información del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Usuario no encontrado
 */
const { protect } = require('../middleware/authMiddleware');
router.get('/me', protect, authController.getMe);

module.exports = router;