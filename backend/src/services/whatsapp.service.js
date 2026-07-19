const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const mongoose = require('mongoose');
const qrcode = require('qrcode');
const env = require('../config/env');
const WhatsappSession = require('../models/WhatsappSession');

let client = null;

const initWhatsapp = async () => {
  try {
    const sessionId = env.openwaSessionId || 'studio-main';

    // Clear any stuck authenticating states on startup
    await WhatsappSession.findOneAndUpdate(
      { sessionId },
      { $set: { status: 'disconnected', qrCode: null } },
      { upsert: true }
    );

    console.log(`📱 Initializing WhatsApp Service (Session: ${sessionId}) with Local Auth...`);

    client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: './.wwebjs_auth'
      }),
      puppeteer: {
        headless: env.openwaHeadless !== 'false',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
        ],
      }
    });

    client.on('qr', async (qr) => {
      console.log(`📱 QR Code generated for session ${sessionId}. Saving to DB for frontend...`);
      // Convert QR text to Base64 image
      try {
        const qrImage = await qrcode.toDataURL(qr);
        await WhatsappSession.findOneAndUpdate(
          { sessionId },
          { status: 'authenticating', qrCode: qrImage, lastPing: new Date() }
        );
      } catch (err) {
        console.error('Failed to generate QR Data URL:', err);
      }
    });

    client.on('ready', async () => {
      console.log('✅ WhatsApp Client is ready!');
      await WhatsappSession.findOneAndUpdate(
        { sessionId },
        { status: 'connected', qrCode: null, connectedAt: new Date(), lastPing: new Date() }
      );
    });

    client.on('authenticated', () => {
      console.log('✅ WhatsApp Client Authenticated');
    });

    client.on('auth_failure', async msg => {
      console.error('❌ WhatsApp Authentication failure', msg);
      await WhatsappSession.findOneAndUpdate(
        { sessionId },
        { status: 'disconnected', qrCode: null }
      );
    });

    client.on('disconnected', async (reason) => {
      console.log('📱 WhatsApp Client was disconnected', reason);
      await WhatsappSession.findOneAndUpdate(
        { sessionId },
        { status: 'disconnected', qrCode: null }
      );
      // Optional: automatically try to reinitialize
      // client.initialize();
    });

    await client.initialize();

  } catch (error) {
    console.error('❌ WhatsApp initialization failed:', error.message);
  }
};

/**
 * Send a WhatsApp text message with optional media
 * @param {string} mobile - 10 digit Indian mobile number or full with country code
 * @param {string} text - Message content
 * @param {string} mediaPath - Optional absolute file path to image/media
 */
const sendWhatsappMessage = async (mobile, text, mediaPath = null) => {
  if (!client) {
    throw new Error('WhatsApp client is not initialized');
  }

  // Format mobile to WhatsApp format
  let number = mobile.replace(/\D/g, '');
  if (number.length === 10) {
    number = `91${number}`; // Default to India if 10 digits
  }
  const chatId = `${number}@c.us`;

  try {
    let result;
    if (mediaPath) {
      try {
        let media;
        if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
          media = await MessageMedia.fromUrl(mediaPath, { unsafeMime: true });
        } else if (mediaPath.startsWith('/uploads')) {
          const path = require('path');
          const absolutePath = path.join(__dirname, '..', '..', mediaPath);
          media = MessageMedia.fromFilePath(absolutePath);
        } else {
          media = MessageMedia.fromFilePath(mediaPath);
        }
        result = await client.sendMessage(chatId, media, { caption: text });
        return result;
      } catch (mediaErr) {
        console.warn(`Failed to fetch or send media (${mediaPath}), falling back to text-only:`, mediaErr.message);
      }
    }
    
    // Fallback to text if no media or if media failed
    result = await client.sendMessage(chatId, text);
    return result;
  } catch (error) {
    console.error(`Failed to send WhatsApp message to ${mobile}:`, error.message);
    throw error;
  }
};

/**
 * Logout and clear session
 */
const disconnectWhatsapp = async () => {
  if (client) {
    try {
      await client.logout();
      await client.destroy();
    } catch (err) {
      console.error('Error destroying client:', err);
    }
    client = null;
  }
  
  const sessionId = env.openwaSessionId || 'studio-main';
  await WhatsappSession.findOneAndUpdate(
    { sessionId },
    { status: 'disconnected', qrCode: null }
  );
};

module.exports = {
  initWhatsapp,
  sendWhatsappMessage,
  disconnectWhatsapp,
};
