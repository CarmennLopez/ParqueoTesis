// src/middleware/versionMiddleware.js

/**
 * Middleware para gestionar el versionado de la API vía Header.
 * Cumple con el requisito de "Integration Readiness" para API Gateway.
 * Espera header: Accept-Version: v1
 */
const versionMiddleware = (req, res, next) => {
    const version = req.headers['accept-version'];

    // Si no se envía versión, asumimos la última (v1 por defecto)
    if (!version) {
        req.apiVersion = 'v1';
        return next();
    }

    // Validar versiones soportadas
    const supportedVersions = ['v1'];

    if (!supportedVersions.includes(version)) {
        return res.status(406).json({
            type: 'about:blank',
            title: 'Not Acceptable',
            status: 406,
            detail: `La versión de API '${version}' no es soportada. Versiones disponibles: ${supportedVersions.join(', ')}`,
            instance: req.originalUrl
        });
    }

    req.apiVersion = version;
    next();
};

module.exports = versionMiddleware;
