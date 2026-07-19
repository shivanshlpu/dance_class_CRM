const mongoose = require('mongoose');
const env = require('../src/config/env');
const Settings = require('../src/models/Settings');
const { checkInactivity, checkExpiry } = require('../src/jobs/cron.service');

// Ensure Whatsapp client is initialized before we trigger messages
const { initWhatsapp } = require('../src/services/whatsapp.service');

const runTrigger = async () => {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('Connected to MongoDB');

    // Init Whatsapp briefly so it's ready to send
    await initWhatsapp();
    
    // Wait for a few seconds to let whatsapp settle
    console.log('Waiting for WhatsApp client to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    console.log('--- Triggering Cron Jobs Manually ---');
    await checkExpiry(settings);
    await checkInactivity(settings);
    
    console.log('--- Finished Triggering Cron Jobs ---');
    console.log('Please check your WhatsApp for messages.');

    process.exit(0);
  } catch (error) {
    console.error('Error triggering cron jobs:', error);
    process.exit(1);
  }
};

runTrigger();
