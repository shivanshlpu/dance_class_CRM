const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    studioName: { type: String, default: 'Dance Studio' },
    logo: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    gst: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
    theme: { type: String, default: 'dark' },
    automations: {
      welcome: { type: Boolean, default: true },
      inactive: { type: Boolean, default: true },
      expiry: { type: Boolean, default: true },
      birthday: { type: Boolean, default: false }
    }
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;
