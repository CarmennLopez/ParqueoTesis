// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

/**

Middleware para verificar la validez del JWT (JSON Web Token)

y proteger las rutas que requieren autenticación.
*/
exports.protect = (req, res, next) => {
// 1. Obtener el token del header (Bearer Token)
let token;

if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
try {
// El formato es "Bearer <token>", separamos para obtener solo el token
token = req.headers.authorization.split(' ')[1];

  // 2. Verificar y decodificar el token usando la clave secreta
  // Nota: Si el token es inválido o expiró, jwt.verify lanzará un error.
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3. Adjuntar el ID del usuario decodificado a la petición (req.user)
  // Esto permite que los controladores sepan quién está haciendo la petición.
  req.userId = decoded.id;
  req.hasPaid = decoded.hasPaid; // También adjuntamos si ha pagado

  // 4. Continuar al siguiente middleware o controlador de ruta
  next();

} catch (error) {
  // Manejar tokens inválidos o expirados
  console.error('Error de verificación de token:', error.message);
  return res.status(401).json({ 
    message: 'No autorizado, token fallido o no válido.',
    error: error.message
  });
}

}

// 5. Si no hay token en el header
if (!token) {
return res.status(401).json({ message: 'No autorizado, no hay token.' });
}
};