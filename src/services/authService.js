const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');

/**
 * Register a new user
 */
const register = async (email, password, role = 'user') => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Create new user
  const user = await User.create({
    email: email.toLowerCase(),
    password,
    role
  });

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });

  const refreshToken = generateRefreshToken({
    userId: user._id
  });

  // Save refresh token to database
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

  await User.findByIdAndUpdate(user._id, {
    refreshToken,
    refreshTokenExpiry
  });

  // Return user without sensitive data
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;

  return {
    user: userResponse,
    accessToken,
    refreshToken
  };
};

/**
 * Login user
 */
const login = async (email, password) => {
  // Find user and include password for comparison
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  
  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    throw new Error('User account is deactivated');
  }

  // Check if user has password (OAuth users might not have password)
  if (!user.password) {
    throw new Error('Please use OAuth to login');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });

  const refreshToken = generateRefreshToken({
    userId: user._id
  });

  // Save refresh token to database
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

  await User.findByIdAndUpdate(user._id, {
    refreshToken,
    refreshTokenExpiry
  });

  // Return user without sensitive data
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;

  return {
    user: userResponse,
    accessToken,
    refreshToken
  };
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (refreshToken) => {
  // Verify refresh token
  const decoded = verifyToken(refreshToken);

  if (decoded.type !== 'refresh') {
    throw new Error('Invalid refresh token');
  }

  // Find user with this refresh token
  const user = await User.findById(decoded.userId).select('+refreshToken +refreshTokenExpiry');
  
  if (!user) {
    throw new Error('User not found');
  }

  if (!user.isActive) {
    throw new Error('User account is deactivated');
  }

  // Check if refresh token is valid in database
  if (!user.isRefreshTokenValid(refreshToken)) {
    throw new Error('Invalid or expired refresh token');
  }

  // Generate new access token
  const accessToken = generateAccessToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });

  return {
    accessToken
  };
};

/**
 * Logout user (invalidate refresh token)
 */
const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    refreshToken: null,
    refreshTokenExpiry: null
  });
};

/**
 * Create or update user from OAuth profile
 */
const createOrUpdateOAuthUser = async (profile) => {
  const { id: googleId, emails, displayName, photos } = profile;
  const email = emails[0].value.toLowerCase();
  const name = displayName;
  const avatar = photos && photos[0] ? photos[0].value : null;

  // Check if user exists by email or googleId
  let user = await User.findOne({
    $or: [
      { email },
      { googleId }
    ]
  });

  if (user) {
    // Update existing user
    user.googleId = googleId;
    user.name = name || user.name;
    user.avatar = avatar || user.avatar;
    await user.save();
  } else {
    // Create new user
    user = await User.create({
      email,
      googleId,
      name,
      avatar,
      role: 'user' // Default role for OAuth users
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });

  const refreshToken = generateRefreshToken({
    userId: user._id
  });

  // Save refresh token
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

  await User.findByIdAndUpdate(user._id, {
    refreshToken,
    refreshTokenExpiry
  });

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;

  return {
    user: userResponse,
    accessToken,
    refreshToken
  };
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  createOrUpdateOAuthUser
};
