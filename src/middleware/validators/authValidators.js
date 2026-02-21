const { body, validationResult } = require('express-validator');

const registerValidation = [
    // Middleware para normalizar nombres de campos (snake_case -> camelCase)
    (req, res, next) => {
        if (req.body.card_id) req.body.cardId = req.body.card_id;
        if (req.body.vehicle_plate) req.body.vehiclePlate = req.body.vehicle_plate;
        next();
    },

    body('name')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),

    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe ser un email válido')
        .matches(/@miumg\.edu\.gt$/).withMessage('El email debe ser del dominio @miumg.edu.gt')
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
        .matches(/^[A-Z0-9\-]{4,10}$/i).withMessage('La placa debe tener entre 4 y 10 caracteres (letras, números y guiones)'),
];

const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe ser un email válido'),

    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
];

module.exports = { registerValidation, loginValidation };
