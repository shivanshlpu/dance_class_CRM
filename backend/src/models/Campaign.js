const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    filter: {
      type: Object, // Stores the query filter
      required: true
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      required: true
    },
    posterIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Poster'
    }],
    status: {
      type: String,
      enum: ['draft', 'sending', 'completed', 'failed'],
      default: 'draft'
    },
    sentCount: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
  }
);

const Campaign = mongoose.model('Campaign', campaignSchema);
module.exports = Campaign;
