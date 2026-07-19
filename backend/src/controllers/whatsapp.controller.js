const WhatsappSession = require('../models/WhatsappSession');
const Template = require('../models/Template');
const { disconnectWhatsapp, sendWhatsappMessage } = require('../services/whatsapp.service');
const createAuditLog = require('../utils/auditLog');
const env = require('../config/env');

const getStatus = async (req, res) => {
  try {
    const sessionId = env.openwaSessionId || 'studio-main';
    const session = await WhatsappSession.findOne({ sessionId }).lean();
    
    if (!session) {
      return res.json({ status: 'disconnected', qrCode: null });
    }

    res.json({
      status: session.status,
      qrCode: session.qrCode,
      connectedAt: session.connectedAt,
      lastPing: session.lastPing,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const disconnect = async (req, res) => {
  try {
    await disconnectWhatsapp();
    
    await createAuditLog({
      userId: req.user.userId,
      action: 'update',
      entity: 'WhatsappSession',
      entityId: null,
      after: { status: 'disconnected manually' }
    });

    res.json({ message: 'WhatsApp disconnected successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTemplates = async (req, res) => {
  try {
    const templates = await Template.find().sort({ type: 1 }).lean();
    res.json({ templates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveTemplate = async (req, res) => {
  try {
    const { type, body, variables, isActive } = req.body;
    
    const template = await Template.findOneAndUpdate(
      { type },
      { type, body, variables, isActive },
      { upsert: true, new: true, runValidators: true }
    );

    await createAuditLog({
      userId: req.user.userId,
      action: 'update',
      entity: 'Template',
      entityId: template._id,
      after: template.toObject()
    });

    res.json({ message: 'Template saved successfully', template });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const testMessage = async (req, res) => {
  try {
    const { mobile, message, includePoster } = req.body;
    
    const sessionId = env.openwaSessionId || 'studio-main';
    const session = await WhatsappSession.findOne({ sessionId }).lean();
    if (!session || session.status !== 'connected') {
      return res.status(400).json({ message: 'WhatsApp is not connected' });
    }

    let mediaPath = null;
    if (includePoster) {
      const path = require('path');
      mediaPath = path.join(__dirname, '../../uploads/posters/welcome_poster.png');
    }

    await sendWhatsappMessage(mobile, message, mediaPath);
    res.json({ message: 'Test message sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getStatus,
  disconnect,
  getTemplates,
  saveTemplate,
  testMessage
};
