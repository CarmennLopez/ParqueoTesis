// server.js
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// Aquí está la cadena de conexión del .env
const mongoURI = process.env.MONGODB_URI; 

mongoose.connect(mongoURI) // <--- ¡Código más limpio sin las opciones deprecadas!
  .then(() => {
    console.log('✅ Conectado a la base de datos de MongoDB');
  })
  .catch(err => {
    console.error('❌ Error de conexión a la base de datos:', err);
  });

app.get('/', (req, res) => {
  res.send('¡API de parqueo funcionando!');
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});