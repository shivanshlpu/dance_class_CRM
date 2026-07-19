const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

/**
 * Generate access + refresh token pair
 */
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    env.jwtSecret,
    { expiresIn: env.jwtExpire }
  );

  const refreshToken = jwt.sign(
    { userId, role },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpire }
  );

  return { accessToken, refreshToken };
};

/**
 * Register a new user (owner-only for creating staff accounts)
 */
const register = async ({ name, email, phone, password, role }) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('User with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name,
    email,
    phone,
    passwordHash: password,
    role: role || 'receptionist',
  });

  const tokens = generateTokens(user._id, user.role);

  // Store refresh token
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    user: user.toJSON(),
    ...tokens,
  };
};

/**
 * Login with email + password
 */
const login = async ({ email, password }) => {
  const user = await User.findOne({ email, isActive: true }).select('+passwordHash +refreshToken');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const tokens = generateTokens(user._id, user.role);

  // Update refresh token and last login
  user.refreshToken = tokens.refreshToken;
  user.lastLogin = new Date();
  await user.save();

  return {
    user: user.toJSON(),
    ...tokens,
  };
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error('Refresh token is required');
    error.statusCode = 401;
    throw error;
  }

  try {
    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken || !user.isActive) {
      const error = new Error('Invalid refresh token');
      error.statusCode = 401;
      throw error;
    }

    const tokens = generateTokens(user._id, user.role);

    // Rotate refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return tokens;
  } catch (err) {
    if (err.statusCode) throw err;
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    throw error;
  }
};

/**
 * Logout — clear refresh token
 */
const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  generateTokens,
};
