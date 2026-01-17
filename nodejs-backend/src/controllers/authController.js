const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const { generateAccessToken, generateRefreshToken, verifyAndRotateRefreshToken, revokeRefreshToken } = require('../utils/tokenUtils');
const { logAudit } = require('../utils/auditLogger');
const { getCache, setCache } = require('../config/redisClient');
const { USER_ROLES } = require('../config/constants');

/**
 * @desc Registrar un nuevo usuario
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, cardId, vehiclePlate, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('El usuario ya existe');
  }

  const user = await User.create({
    name,
    email,
    password,
    cardId,
    vehiclePlate,
    role: role || USER_ROLES.STUDENT
  });

  if (user) {
    logAudit(req, 'REGISTER', 'User', { userId: user._id, email: user.email });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateAccessToken(user)
    });
  } else {
    res.status(400);
    throw new Error('Datos de usuario inválidos');
  }
});

/**
 * @desc Iniciar sesión y obtener tokens
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    logAudit(req, 'LOGIN', 'User', { userId: user._id, email: user.email });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      hasPaid: user.hasPaid,
      currentParkingSpace: user.currentParkingSpace,
      accessToken,
      refreshToken
    });
  } else {
    logAudit(req, 'LOGIN_FAILED', 'User', { email });
    res.status(401);
    throw new Error('Credenciales inválidas');
  }
});

/**
 * @desc Renovar Access Token usando Refresh Token
 * @route POST /api/auth/refresh
 * @access Public (requiere Refresh Token en body)
 */
exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400);
    throw new Error('Refresh Token es requerido');
  }

  try {
    // Verificar y rotar el token (esto borra el anterior de Redis)
    const payload = await verifyAndRotateRefreshToken(refreshToken);

    // Buscar usuario actualizado
    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401);
      throw new Error('Usuario no encontrado');
    }

    // Generar nuevo par de tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    res.status(403);
    throw new Error('Refresh Token inválido o expirado');
  }
});

/**
 * @desc Cerrar sesión (Revocar Refresh Token)
 * @route POST /api/auth/logout
 * @access Public (requiere Refresh Token en body)
 */
exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  res.status(200).json({ message: 'Sesión cerrada exitosamente' });
});

/**
 * @desc Obtener perfil del usuario actual
 * @route GET /api/auth/me
 * @access Private
 */
exports.getMe = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const cacheKey = `user_profile:${userId}`;

  // 1. Intentar caché
  const cachedUser = await getCache(cacheKey);
  if (cachedUser) {
    return res.status(200).json(cachedUser);
  }

  // 2. Consultar DB
  const user = await User.findById(userId).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }

  // 3. Guardar en caché (TTL 60s - perfil no cambia seguido)
  await setCache(cacheKey, user, 60);

  res.status(200).json(user);
});