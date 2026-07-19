const mongoose = require('mongoose');

const posterSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['welcome', 'miss_you', 'expiry', 'renewal', 'birthday', 'festival', 'offer', 'custom'],
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    useCount: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  }
);

const Poster = mongoose.model('Poster', posterSchema);
module.exports = Poster;
