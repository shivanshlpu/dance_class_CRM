const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const User = require('./models/User');

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Seed default owner account if no users exist
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await User.create({
      name: 'Studio Owner',
      email: 'owner@danceflow.com',
      phone: '9999999999',
      passwordHash: 'owner123',
      role: 'owner',
    });
    console.log('🌱 Default owner account created: owner@danceflow.com / owner123');
  }

  // Initialize WhatsApp Service
  const { initWhatsapp } = require('./services/whatsapp.service');
  // We don't await this because we want the HTTP server to start immediately
  // and not block while WhatsApp is initializing headless chrome.
  initWhatsapp();

  // Initialize Cron Jobs
  const { initCronJobs } = require('./jobs/cron.service');
  initCronJobs();

  // Triggering a restart
  
  // Start HTTP server
  const server = app.listen(env.port, () => {
    console.log(`\n🚀 DanceFlow CRM Backend`);
    console.log(`   Environment: ${env.nodeEnv}`);
    console.log(`   Port: ${env.port}`);
    console.log(`   API: http://localhost:${env.port}/api`);
    console.log(`   Health: http://localhost:${env.port}/api/health\n`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
