const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { success } = require('../utils/apiResponse');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// @route POST /api/auth/signup
const signup = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({ name, email, phone, password });
  const token = signToken(user._id);

  // Note: no ClientProfile is created here on purpose. Profile is optional
  // and created lazily whenever the client fills it in from Settings.
  success(res, { token, user: user.toSafeObject() }, 'Account created', 201);
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user._id);

  // IMPORTANT: login response intentionally does NOT require or embed the
  // client profile. The client goes straight to the dashboard; the
  // dashboard endpoint separately exposes `isProfileComplete` so the
  // frontend can show a soft, dismissible nudge instead of a blocking form.
  success(res, { token, user: user.toSafeObject() }, 'Logged in');
});

// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  success(res, { user: req.user.toSafeObject() });
});

module.exports = { signup, login, getMe };
