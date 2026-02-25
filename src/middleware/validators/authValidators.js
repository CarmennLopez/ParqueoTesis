const { body } = require('express-validator');

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

const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe ser un email válido'),

    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
];

module.exports = { registerValidation, loginValidation };
