// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Necesario para encriptar la contraseña

const UserSchema = new mongoose.Schema({
name: {
type: String,
required: true,
trim: true
},
email: {
type: String,
required: true,
unique: true,
trim: true,
lowercase: true // Convierte el email a minúsculas
},
password: {
type: String,
required: true,
trim: true
},
hasPaid: {
type: Boolean,
default: false // Estado de pago para el parqueo (por defecto: no ha pagado)
},
cardId: {
type: String,
required: true,
unique: true,
trim: true
},
vehiclePlate: {
type: String,
required: true,
unique: true,
trim: true,
uppercase: true // Convierte la matrícula a mayúsculas
},
currentParkingSpace: {
type: Number,
default: null
},
entryTime: {
type: Date,
default: null
}
}, {
timestamps: true // Agrega campos createdAt y updatedAt automáticamente
});

// Middleware PRE-SAVE: Encripta la contraseña antes de guardarla en la DB.
UserSchema.pre('save', async function(next) {
// Solo encripta si la contraseña ha sido modificada (o es nueva)
if (this.isModified('password')) {
this.password = await bcrypt.hash(this.password, 10);
}
next();
});

// Método para comparar contraseñas (necesario para el login)
UserSchema.methods.matchPassword = async function(enteredPassword) {
return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);