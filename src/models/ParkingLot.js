const mongoose = require('mongoose');

const spaceSchema = new mongoose.Schema({
  spaceNumber: {
    type: Number,
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
  }
});

const parkingLotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  isExclusive: {
    type: Boolean,
    default: false
  },
  totalSpaces: {
    type: Number,
    required: true
  },
  availableSpaces: {
    type: Number,
    required: true
  },
  spaces: [spaceSchema] // Arreglo de sub-documentos `spaceSchema`
}, {
  timestamps: true
});

const ParkingLot = mongoose.model('ParkingLot', parkingLotSchema);

module.exports = ParkingLot;