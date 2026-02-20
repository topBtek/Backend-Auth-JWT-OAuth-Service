const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { createOrUpdateOAuthUser } = require('../services/authService');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const result = await createOrUpdateOAuthUser(profile);
        done(null, result.user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

module.exports = passport;
