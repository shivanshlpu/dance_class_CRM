const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    // Try connecting to the configured MongoDB URI
    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️  Could not connect to MongoDB at ${env.mongoUri}`);
    console.warn(`   Reason: ${error.message}`);
    console.log('🔄 Starting in-memory MongoDB for development...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`✅ In-memory MongoDB started: ${memoryUri}`);
      console.log('   ⚠️  Data will NOT persist across restarts!');

      // Store reference for cleanup
      process.mongod = mongod;
      return conn;
    } catch (memError) {
      console.error(`❌ Could not start in-memory MongoDB: ${memError.message}`);
      console.error('   Please install MongoDB locally or provide a MongoDB Atlas URI in .env');
      process.exit(1);
    }
  }
};

module.exports = connectDB;
