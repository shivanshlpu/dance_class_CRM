const mongoose = require('mongoose');

const whatsappLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    messageType: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    },
    retryCount: {
      type: Number,
      default: 0
    },
    sentAt: {
      type: Date
    },
    errorMessage: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

const WhatsappLog = mongoose.model('WhatsappLog', whatsappLogSchema);
module.exports = WhatsappLog;
