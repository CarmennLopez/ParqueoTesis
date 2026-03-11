const express = require('express');
const router = express.Router();

const adminRoutes = require('./admin.routes');
const guardRoutes = require('./guard.routes');
const userRoutes = require('./user.routes');

// Las rutas bases ya están prefijadas por el cargador de rutas principal (/api/parking)
// pero aquí manejamos los sub-segmentos

// Rutas de administración
router.use('/admin', adminRoutes);

// Rutas de guardias
router.use('/guard', guardRoutes);

// Rutas de usuario (éstas suelen ir en la raíz del módulo parking o sub-rutas específicas)
router.use('/', userRoutes);

module.exports = router;
