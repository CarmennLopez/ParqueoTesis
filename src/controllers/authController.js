// src/controllers/authController.js
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

/**
 * @desc Registrar un nuevo usuario
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, cardId, vehiclePlate } = req.body;

  // Validar que todos los campos requeridos estén presentes
  if (!name || !email || !password || !cardId || !vehiclePlate) {
    res.status(400);
    throw new Error('Todos los campos son requeridos: name, email, password, cardId, vehiclePlate');
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Formato de email inválido');
  }

  // Validar requisitos de contraseña (mínimo 8 caracteres, al menos una mayúscula y un número)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(password)) {
    res.status(400);
    throw new Error('La contraseña debe tener al menos 8 caracteres, incluir una mayúscula y un número');
  }

  // Validar formato de placa (6-8 caracteres alfanuméricos)
  const plateRegex = /^[A-Z0-9]{6,8}$/i;
  if (!plateRegex.test(vehiclePlate)) {
    res.status(400);
    throw new Error('La placa del vehículo debe tener entre 6 y 8 caracteres alfanuméricos');
  }

  // Verificar si el usuario ya existe (email, cardId o vehiclePlate duplicados)
  const existingUserByEmail = await User.findOne({ email });
  if (existingUserByEmail) {
    res.status(400);
    throw new Error('Ya existe un usuario con este correo electrónico');
  }

  const existingUserByCardId = await User.findOne({ cardId });
  if (existingUserByCardId) {
    res.status(400);
    throw new Error('Ya existe un usuario con este ID de tarjeta');
  }

  const existingUserByPlate = await User.findOne({ vehiclePlate: vehiclePlate.toUpperCase() });
  if (existingUserByPlate) {
    res.status(400);
    throw new Error('Ya existe un usuario con esta placa de vehículo');
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

  res.status(201).json({
    message: 'Usuario registrado exitosamente',
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
  });
});

/**
 * @desc Iniciar sesión de usuario
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validar que los campos estén presentes
  if (!email || !password) {
    res.status(400);
    throw new Error('Email y contraseña son requeridos');
  }

  // Verificar si el usuario existe
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    res.status(401); // 401 Unauthorized es más apropiado para login fallido
    throw new Error('Credenciales inválidas');
  }

  // Crear y firmar el token JWT
  const token = jwt.sign(
    { id: user._id, role: user.role }, // Incluimos el rol en el token
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '24h' } // Token expira en 24h por defecto
  );

  res.status(200).json({
    message: 'Inicio de sesión exitoso',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      hasPaid: user.hasPaid,
      currentParkingSpace: user.currentParkingSpace
    }
  });
});