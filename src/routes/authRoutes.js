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
 *     summary: Registrar usuario
 */
router.post('/register', registerValidation, handleValidationErrors, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Autenticación]
 *     summary: Iniciar sesión
 */
router.post('/login', loginLimiter, loginValidation, handleValidationErrors, authController.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Autenticación]
 *     summary: Renovar Access Token
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Autenticación]
 *     summary: Cerrar sesión
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Autenticación]
 *     summary: Perfil usuario
 */
router.get('/me', protect, authController.getMe);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     tags: [Autenticación]
 *     summary: Login con Google (solo @miumg.edu.gt)
 */
router.post('/google', googleLogin);

/**
 * @route POST /api/auth/switch-role
 * @desc Cambiar rol de usuario (solo para pruebas)
 * @access Private
 */
router.post('/switch-role', protect, authController.switchRole);

module.exports = router;