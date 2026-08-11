const asyncHandler = require('express-async-handler');
const ClientProfile = require('../models/ClientProfile');
const DesignRequest = require('../models/DesignRequest');
const StoneSuggestion = require('../models/StoneSuggestion');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const { success } = require('../utils/apiResponse');

// @route GET /api/client/dashboard
// Straight-to-dashboard data. Never blocks on profile completeness —
// only reports it via `isProfileComplete` so the UI can show a small,
// dismissible nudge ("complete your profile") instead of a forced form.
const getDashboard = asyncHandler(async (req, res) => {
  const profile = await ClientProfile.findOne({ user: req.user._id });

  const [recentDesigns, recentStoneSuggestions, recentOrders, recentInvoices] = await Promise.all([
    DesignRequest.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5),
    StoneSuggestion.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5),
    Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5),
    Invoice.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5),
  ]);

  success(res, {
    user: req.user.toSafeObject(),
    isProfileComplete: Boolean(profile?.isProfileComplete),
    profileNudge: profile?.isProfileComplete
      ? null
      : 'Complete your profile anytime from Settings to get more personalised design and stone suggestions.',
    recentDesigns,
    recentStoneSuggestions,
    recentOrders,
    recentInvoices,
  });
});

// @route GET /api/client/profile
const getProfile = asyncHandler(async (req, res) => {
  const profile = await ClientProfile.findOne({ user: req.user._id });
  success(res, { profile: profile || null });
});

// @route PUT /api/client/profile
// Client fills this in whenever THEY choose to, from Settings — never forced.
// Also accepts `name`/`phone` so the same Settings form can update the basic
// User record without a separate endpoint (email is intentionally left
// alone here since it's the login identifier — changing it is out of scope).
const upsertProfile = asyncHandler(async (req, res) => {
  const { address, birthDetails, preferences, avatarUrl, type, businessName, gstNumber, anniversary, name, phone } = req.body;

  if (name || phone) {
    await User.findByIdAndUpdate(req.user._id, {
      ...(name && { name }),
      ...(phone && { phone }),
    });
  }

  const profile = await ClientProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      $set: {
        ...(address && { address }),
        ...(birthDetails && { birthDetails }),
        ...(preferences && { preferences }),
        ...(avatarUrl && { avatarUrl }),
        ...(type && { type }),
        ...(businessName !== undefined && { businessName }),
        ...(gstNumber !== undefined && { gstNumber }),
        ...(anniversary && { anniversary }),
      },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  const user = await User.findById(req.user._id);
  success(res, { profile, user: user.toSafeObject() }, 'Profile saved');
});

module.exports = { getDashboard, getProfile, upsertProfile };
