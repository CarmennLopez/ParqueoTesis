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
 * @route POST /api/auth/register
 * @desc Registrar un nuevo usuario
 * @access Public
 */
router.post('/register', registerValidation, handleValidationErrors, authController.register);

/**
 * @route POST /api/auth/login
 * @desc Iniciar sesión
 * @access Public
 */
router.post('/login', loginLimiter, loginValidation, handleValidationErrors, authController.login);

module.exports = router;