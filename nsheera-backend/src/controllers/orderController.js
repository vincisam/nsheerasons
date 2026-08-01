const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Jewellery = require('../models/Jewellery');
const ClientProfile = require('../models/ClientProfile');
const { nextSequence } = require('../models/Counter');
const { success } = require('../utils/apiResponse');

async function generateOrderNumber() {
  const year = new Date().getFullYear();
  const seq = await nextSequence(`order-${year}`);
  return `NSH-ORD-${year}-${String(seq).padStart(4, '0')}`;
}

// @route POST /api/orders
// body: { items: [{ jewelleryId, quantity, size?, customization? }], shippingAddress?, discount? }
const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, discount = 0, shippingCharge = 0, notes } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Order must contain at least one item');
  }

  const jewelleryIds = items.map((i) => i.jewelleryId);
  const catalogItems = await Jewellery.find({ _id: { $in: jewelleryIds } });
  const catalogMap = new Map(catalogItems.map((c) => [String(c._id), c]));

  let subtotal = 0;
  let taxAmount = 0;
  const orderItems = items.map((i) => {
    const catalogItem = catalogMap.get(String(i.jewelleryId));
    if (!catalogItem) {
      res.status(400);
      throw new Error(`Jewellery item ${i.jewelleryId} not found`);
    }
    if (!catalogItem.isActive) {
      res.status(400);
      throw new Error(`${catalogItem.name} is currently unavailable`);
    }

    const quantity = Math.max(Number(i.quantity) || 1, 1);
    const unitPrice = catalogItem.pricing.totalPrice;
    const lineTotal = unitPrice * quantity;

    subtotal += catalogItem.pricing.subtotal * quantity;
    taxAmount += catalogItem.pricing.taxAmount * quantity;

    return {
      jewellery: catalogItem._id,
      name: catalogItem.name,
      sku: catalogItem.sku,
      unitPrice,
      quantity,
      size: i.size,
      customization: i.customization,
      lineTotal,
    };
  });

  const grandTotal = subtotal + taxAmount + Number(shippingCharge) - Number(discount);

  // Fall back to the client's saved profile address if none given at checkout
  let finalShippingAddress = shippingAddress;
  if (!finalShippingAddress) {
    const profile = await ClientProfile.findOne({ user: req.user._id });
    finalShippingAddress = profile?.address;
  }

  const orderNumber = await generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    user: req.user._id,
    items: orderItems,
    shippingAddress: finalShippingAddress,
    subtotal,
    discount,
    taxAmount,
    shippingCharge,
    grandTotal,
    notes,
  });

  success(res, { order }, 'Order created', 201);
});

// @route GET /api/orders  (own orders for a client; admin can pass ?all=true)
const listOrders = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' && req.query.all === 'true' ? {} : { user: req.user._id };
  if (req.query.status) filter.orderStatus = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

  const orders = await Order.find(filter).sort({ createdAt: -1 }).populate('invoice payment');
  success(res, { orders });
});

// @route GET /api/orders/:id
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('invoice payment');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (req.user.role !== 'admin' && String(order.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }
  success(res, { order });
});

// @route PUT /api/orders/:id/status (admin only)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  order.orderStatus = orderStatus;
  await order.save();
  success(res, { order }, 'Order status updated');
});

module.exports = { createOrder, listOrders, getOrder, updateOrderStatus, generateOrderNumber };
