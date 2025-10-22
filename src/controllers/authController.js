// src/controllers/authController.js
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, cardId, vehiclePlate } = req.body;

  // Verificar si el usuario ya existe
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error('El usuario con este correo ya existe.');
  }

  // Crear el nuevo usuario
  const newUser = new User({
    name,
    email,
    password, // La contraseña se encriptará automáticamente por el middleware pre-save del modelo
    cardId,
    vehiclePlate
  });

  await newUser.save();
  res.status(201).json({ message: 'Usuario registrado exitosamente.' });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Verificar si el usuario existe
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    res.status(401); // 401 Unauthorized es más apropiado para login fallido
    throw new Error('Credenciales inválidas.');
  }

  // Crear y firmar el token JWT
  const token = jwt.sign(
    { id: user._id, hasPaid: user.hasPaid },
    process.env.JWT_SECRET,
    { expiresIn: '1h' } // El token expira en 1 hora
  );

  res.status(200).json({
    message: 'Inicio de sesión exitoso.',
    token,
    hasPaid: user.hasPaid
  });
});