// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./src/routes/authRoutes'); // Importar las rutas de autenticación

const app = express();
const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGODB_URI;

// Middleware para parsear el cuerpo de las peticiones JSON
app.use(express.json());

// Conexión a la base de datos
mongoose.connect(mongoURI)
  .then(() => {
    console.log('✅ Conectado a la base de datos de MongoDB');
  })
  .catch(err => {
    console.error('❌ Error de conexión a la base de datos:', err);
  });

// Usar las rutas de autenticación
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('¡API de parqueo funcionando!');
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});