const mongoose = require('mongoose');

const whatsappSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      default: 'studio-main',
    },
    status: {
      type: String,
      enum: ['connected', 'disconnected', 'authenticating'],
      default: 'disconnected',
    },
    qrCode: {
      type: String, // base64 string
      default: null,
    },
    connectedAt: {
      type: Date,
      default: null,
    },
    lastPing: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const WhatsappSession = mongoose.model('WhatsappSession', whatsappSessionSchema);

module.exports = WhatsappSession;
