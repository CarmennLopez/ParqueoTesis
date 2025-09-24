const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  hasPaid: {
    type: Boolean,
    default: false
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
    uppercase: true
  }
}, {
  timestamps: true // Agrega campos `createdAt` y `updatedAt` automáticamente
});

const User = mongoose.model('User', userSchema);

module.exports = User;