const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.controller');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const rateLimit = require('express-rate-limit');

const whatsappLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: { message: 'Too many messages sent. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate);

// Everyone with minimal access can see the status, but only owner/manager can configure
router.get('/status', requireRole(['owner', 'manager', 'receptionist']), whatsappController.getStatus);
router.post('/disconnect', requireRole(['owner', 'manager']), whatsappController.disconnect);

router.get('/templates', requireRole(['owner', 'manager']), whatsappController.getTemplates);
router.post('/templates', requireRole(['owner', 'manager']), whatsappController.saveTemplate);
router.post('/test', whatsappLimiter, requireRole(['owner', 'manager']), whatsappController.testMessage);

router.post('/trigger-cron', requireRole(['owner', 'manager']), async (req, res) => {
  try {
    const { checkExpiry, checkInactivity } = require('../jobs/cron.service');
    const Settings = require('../models/Settings');
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    
    // Trigger them without awaiting them fully so we don't block the request if it takes long
    checkExpiry(settings).catch(console.error);
    checkInactivity(settings).catch(console.error);

    res.json({ message: 'Cron jobs triggered successfully. Check your WhatsApp shortly.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// No duplicates

module.exports = router;
