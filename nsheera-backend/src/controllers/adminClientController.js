const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const ClientProfile = require('../models/ClientProfile');
const Order = require('../models/Order');
const DesignRequest = require('../models/DesignRequest');
const StoneSuggestion = require('../models/StoneSuggestion');
const { success } = require('../utils/apiResponse');

// @route GET /api/admin/clients  (admin only)
// List all clients with profile completeness + quick order stats.
const listClients = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  const userFilter = { role: 'client' };
  if (q) {
    userFilter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }, { phone: new RegExp(q, 'i') }];
  }

  const skip = (Math.max(Number(page), 1) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(userFilter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(userFilter),
  ]);

  const userIds = users.map((u) => u._id);
  const [profiles, orderAggregates] = await Promise.all([
    ClientProfile.find({ user: { $in: userIds } }),
    Order.aggregate([
      { $match: { user: { $in: userIds } } },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          totalSpend: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$grandTotal', 0] } },
          lastOrderAt: { $max: '$createdAt' },
        },
      },
    ]),
  ]);

  const profileMap = new Map(profiles.map((p) => [String(p.user), p]));
  const orderMap = new Map(orderAggregates.map((o) => [String(o._id), o]));

  const clients = users.map((u) => {
    const profile = profileMap.get(String(u._id));
    const orderStats = orderMap.get(String(u._id));
    return {
      user: u.toSafeObject(),
      isProfileComplete: Boolean(profile?.isProfileComplete),
      city: profile?.address?.city,
      orderCount: orderStats?.orderCount || 0,
      totalSpend: orderStats?.totalSpend || 0,
      lastOrderAt: orderStats?.lastOrderAt || null,
    };
  });

  success(res, { clients, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// @route GET /api/admin/clients/:userId  (admin only)
// Full detail view: profile + orders + AI design/stone history, for staff
// following up with a client (e.g. sales, customer support).
const getClientDetail = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('Client not found');
  }

  const [profile, orders, designs, stoneSuggestions] = await Promise.all([
    ClientProfile.findOne({ user: userId }),
    Order.find({ user: userId }).sort({ createdAt: -1 }),
    DesignRequest.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
    StoneSuggestion.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
  ]);

  success(res, {
    user: user.toSafeObject(),
    profile: profile || null,
    orders,
    designs,
    stoneSuggestions,
  });
});

// @route PUT /api/admin/clients/:userId/status  (admin only)
// Activate/deactivate a client account.
const setClientStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findById(req.params.userId);
  if (!user) {
    res.status(404);
    throw new Error('Client not found');
  }
  user.isActive = Boolean(isActive);
  await user.save();
  success(res, { user: user.toSafeObject() }, 'Client status updated');
});

module.exports = { listClients, getClientDetail, setClientStatus };
