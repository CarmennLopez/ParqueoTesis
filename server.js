// server.js
const express = require('express');
const { connect } = require('mongoose');
const dotenv = require('dotenv');
const parkingRoutes = require('./src/routes/parkingRoutes'); // Importar las rutas de parqueo
const authRoutes = require('./src/routes/authRoutes'); // Importar las rutas de autenticación

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGODB_URI;

// Middleware para parsear JSON
app.use(express.json());

// Conexión a MongoDB
connect(mongoURI)
  .then(() => {
    console.log('✅ Conectado a la base de datos de MongoDB');
  })
  .catch((err) => {
    console.error('❌ Error de conexión a la base de datos:', err);
  });

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes); // Usar las rutas de parqueo

app.get('/', (req, res) => {
  res.send('¡API de parqueo funcionando!');
});

// Servidor
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
});
