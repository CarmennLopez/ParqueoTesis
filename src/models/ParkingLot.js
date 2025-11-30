const mongoose = require('mongoose');

const ParkingSpaceSchema = new mongoose.Schema({
  spaceNumber: {
    type: String,
    required: true
  },
  isOccupied: {
    type: Boolean,
    default: false
  },
  occupiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  entryTime: {
    type: Date,
    default: null
  }
});

const ParkingLotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitud, latitud]
  },
  totalSpaces: {
    type: Number,
    required: true
  },
  availableSpaces: {
    type: Number,
    default: 0
  },
  spaces: [ParkingSpaceSchema]
}, {
  timestamps: true
});

// Índice geoespacial para búsquedas de cercanía
ParkingLotSchema.index({ location: '2dsphere' });

module.exports = mongoose.models.ParkingLot || mongoose.model('ParkingLot', ParkingLotSchema);