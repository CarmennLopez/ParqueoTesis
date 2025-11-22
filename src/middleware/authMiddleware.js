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
exports.protect = (req, res, next) => {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Adjuntar el ID del usuario y su rol a la petición
    // Esto permite que los controladores sepan quién está haciendo la petición
    req.userId = decoded.id;
    req.userRole = decoded.role;

    // 5. Continuar al siguiente middleware o controlador de ruta
    next();

  } catch (error) {
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