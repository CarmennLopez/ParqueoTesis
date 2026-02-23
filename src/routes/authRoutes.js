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
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Autenticación]
 *     summary: Registrar nuevo usuario
 *     description: Crea una nueva cuenta en el sistema. El rol por defecto es `student`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: El correo o carné ya está registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "El correo ya está registrado"
 */
router.post('/register', registerValidation, handleValidationErrors, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Autenticación]
 *     summary: Iniciar sesión
 *     description: |
 *       Autentica un usuario y retorna un **access token** (JWT, válido 15 min)
 *       y un **refresh token** (válido 7 días).
 *       > Limitado a **5 intentos** por cada 15 minutos (rate limit).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Credenciales inválidas"
 *       429:
 *         description: Demasiados intentos — rate limit activo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Demasiados intentos. Intente en 15 minutos."
 */
router.post('/login', loginLimiter, loginValidation, handleValidationErrors, authController.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Autenticación]
 *     summary: Renovar Access Token
 *     description: |
 *       Usa el **refresh token** para obtener un nuevo access token sin
 *       necesidad de volver a hacer login.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIs..."
 *     responses:
 *       200:
 *         description: Nuevo access token generado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIs..."
 *       401:
 *         description: Refresh token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Autenticación]
 *     summary: Cerrar sesión
 *     description: Invalida el refresh token del usuario en la base de datos.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIs..."
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Sesión cerrada"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Autenticación]
 *     summary: Obtener perfil del usuario autenticado
 *     description: Retorna los datos del usuario dueño del JWT enviado en el header.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:            { type: integer, example: 1 }
 *                     name:          { type: string,  example: "Carmen Lopez" }
 *                     email:         { type: string,  example: "carmen@miumg.edu.gt" }
 *                     role:          { type: string,  example: "student" }
 *                     cardId:        { type: string,  example: "12345678" }
 *                     vehiclePlate:  { type: string,  example: "UMG-001" }
 *                     isSolvent:     { type: boolean, example: true }
 *                     solvencyExpires: { type: string, format: date-time }
 *                     currentParkingSpace: { type: string, example: "A-5", nullable: true }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', protect, authController.getMe);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     tags: [Autenticación]
 *     summary: Login con Google OAuth2
 *     description: |
 *       Autentica al usuario con un token de Google.
 *       **Solo se aceptan correos institucionales** `@miumg.edu.gt`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_token]
 *             properties:
 *               id_token:
 *                 type: string
 *                 description: Token ID de Google obtenido desde Google Sign-In
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZC..."
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Token inválido o correo no institucional
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Solo se permiten correos @miumg.edu.gt"
 */
router.post('/google', googleLogin);

module.exports = router;