// src/middleware/iotAuthMiddleware.js
/**
 * Middleware de autenticación para endpoints IoT.
 * Valida el header X-IoT-Api-Key contra la variable de entorno IOT_API_KEY.
 * En producción considerar también firma HMAC con timestamp para evitar replay attacks.
 */

const validateIotApiKey = (req, res, next) => {
    const apiKey = req.headers['x-iot-api-key'];
    const expectedKey = process.env.IOT_API_KEY;

    if (!expectedKey) {
        // Si no se configuró la variable, en desarrollo dejamos pasar con un warning
        if (process.env.NODE_ENV !== 'production') {
            console.warn('⚠️  IOT_API_KEY no configurada. La ruta IoT está abierta (modo desarrollo).');
            return next();
        }
        return res.status(500).json({ success: false, message: 'Configuración de seguridad IoT incompleta.' });
    }

    if (!apiKey || apiKey !== expectedKey) {
        return res.status(401).json({
            success: false,
            code: 'INVALID_IOT_KEY',
            message: 'API Key de IoT inválida o ausente. Incluya el header X-IoT-Api-Key.'
        });
    }

    next();
};

module.exports = { validateIotApiKey };
