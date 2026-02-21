// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar la validez del JWT (JSON Web Token)
 * y proteger las rutas que requieren autenticación.
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.protect = async (req, res, next) => {
  // 1. Verificar si existe el header de autorización
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
    return res.status(401).json({
      message: 'No autorizado, no se proporcionó token de autenticación'
    });
  }

  try {
    // 2. Extraer el token del header (formato: "Bearer <token>")
    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'No autorizado, token malformado'
      });
    }

    // 3. Verificar y decodificar el token usando la clave secreta
    console.log('🔑 Verifying token:', token.substring(0, 20) + '...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔓 Decoded payload:', decoded);

    // 4. Buscar el usuario en la base de datos (Seguridad Robusta)
    // Esto asegura que si el usuario fue eliminado o su rol cambió, el token no sirva
    // 4. Buscar el usuario en la base de datos (Seguridad Robusta)
    // Esto asegura que si el usuario fue eliminado o su rol cambió, el token no sirva
    const { User } = require('../models'); // Importar desde index.js para asegurar modelo correcto
    const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });

    if (!user) {
      return res.status(401).json({
        message: 'No autorizado, usuario no encontrado o eliminado'
      });
    }

    // 5. Adjuntar el usuario completo a la petición
    console.log('✅ Auth Success. User:', user.email, 'ID:', user.id);
    req.user = user;
    req.userId = user.id; // Corrected from _id to id for Sequelize consistency

    // 6. Continuar al siguiente middleware
    next();

  } catch (error) {
    console.error('❌ Auth Middleware Error:', error.message);
    // Manejar diferentes tipos de errores de JWT
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'No autorizado, el token ha expirado',
        error: 'TokenExpired'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'No autorizado, token inválido',
        error: 'InvalidToken'
      });
    } else {
      return res.status(401).json({
        message: 'No autorizado, error de autenticación',
        error: error.message
      });
    }
  }
};