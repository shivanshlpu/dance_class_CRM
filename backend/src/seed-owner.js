const mongoose = require('mongoose');
const env = require('./config/env');
const User = require('./models/User');

const seedUser = async () => {
  await mongoose.connect(env.mongodbUri);
  console.log('Connected to MongoDB.');
  
  const users = await User.find({});
  console.log('Existing users:', users.map(u => ({ email: u.email, role: u.role })));

  const owner = await User.findOne({ email: 'owner@danceflow.com' });
  if (!owner) {
    console.log('Owner not found. Creating...');
    await User.create({
      name: 'Studio Owner',
      email: 'owner@danceflow.com',
      phone: '9999999999',
      passwordHash: 'owner123',
      role: 'owner',
    });
    console.log('Created owner@danceflow.com');
  } else {
    console.log('Owner already exists. Resetting password to owner123...');
    owner.passwordHash = 'owner123';
    await owner.save();
    console.log('Password reset to owner123');
  }
  process.exit(0);
};

seedUser();
