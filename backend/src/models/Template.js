const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['welcome', 'miss_you_1', 'miss_you_2', 'miss_you_3', 'expiry_5', 'expiry_3', 'expiry_2', 'expiry_1', 'expiry_0', 'renewal', 'birthday', 'festival', 'offer', 'custom'],
      required: true,
      unique: true, // Only one template of each standard type for now
    },
    body: {
      type: String,
      required: [true, 'Template body is required'],
      trim: true,
    },
    variations: [{
      type: String,
      trim: true,
    }],
    variables: [{
      type: String, // e.g., 'name', 'plan', 'expiry', 'batch'
      trim: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Template = mongoose.model('Template', templateSchema);

module.exports = Template;
