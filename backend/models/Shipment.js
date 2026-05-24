const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  shipmentId: { type: String, required: true, unique: true },
  origin: {
    name: String,
    country: String,
    lat: Number,
    lng: Number
  },
  destination: {
    name: String,
    country: String,
    lat: Number,
    lng: Number
  },
  carrier: String,
  mode: { type: String, enum: ['sea', 'air', 'rail', 'road'], default: 'sea' },
  status: { type: String, enum: ['in_transit', 'delivered', 'delayed', 'at_risk', 'cancelled'], default: 'in_transit' },
  eta: Date,
  actualArrival: Date,
  delayHours: { type: Number, default: 0 },
  cargo: {
    cargoType: { type: String, default: 'General' },
    weight: { type: Number, default: 0 },
    value: { type: Number, default: 0 }
  },
  riskScore: { type: Number, min: 0, max: 100, default: 0 },
  riskFactors: [{
    factor: String,
    weight: Number,
    score: Number
  }],
  route: [{
    port: String,
    country: String,
    lat: Number,
    lng: Number,
    status: { type: String, enum: ['clear', 'congested', 'blocked'], default: 'clear' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Shipment', shipmentSchema);
