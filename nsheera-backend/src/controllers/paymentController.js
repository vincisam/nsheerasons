const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const ClientProfile = require('../models/ClientProfile');
const {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  refundPayment,
} = require('../services/razorpayService');
const { createInvoiceForOrder, markInvoicePaid } = require('../services/invoiceService');
const { success } = require('../utils/apiResponse');

// @route POST /api/payments/create-order
// body: { orderId }
// Creates a Razorpay order for an existing Nsheera order and returns the
// details the frontend needs to open Razorpay Checkout.
const initiatePayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (String(order.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized for this order');
  }
  if (order.paymentStatus === 'paid') {
    res.status(400);
    throw new Error('Order is already paid');
  }

  const rzpOrder = await createRazorpayOrder({
    amountInRupees: order.grandTotal,
    receipt: order.orderNumber,
    notes: { orderId: String(order._id), userId: String(req.user._id) },
  });

  const payment = await Payment.create({
    order: order._id,
    user: req.user._id,
    gateway: 'razorpay',
    gatewayOrderId: rzpOrder.id,
    amount: order.grandTotal,
    currency: rzpOrder.currency,
    status: 'created',
  });

  order.payment = payment._id;
  await order.save();

  success(res, {
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount, // in paise, for the Checkout widget
    currency: rzpOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID, // public key, safe to expose to frontend
    orderId: order._id,
  });
});

// @route POST /api/payments/verify
// body: { razorpayOrderId, razorpayPaymentId, razorpaySignature }
// Called by the frontend right after Razorpay Checkout succeeds.
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    res.status(400);
    throw new Error('Missing payment verification fields');
  }

  const isValid = verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });

  const payment = await Payment.findOne({ gatewayOrderId: razorpayOrderId });
  if (!payment) {
    res.status(404);
    throw new Error('Payment record not found');
  }

  if (!isValid) {
    payment.status = 'failed';
    payment.failureReason = 'Signature verification failed';
    await payment.save();
    res.status(400);
    throw new Error('Payment signature verification failed');
  }

  payment.gatewayPaymentId = razorpayPaymentId;
  payment.gatewaySignature = razorpaySignature;
  payment.status = 'paid';
  await payment.save();

  const order = await Order.findById(payment.order);
  order.paymentStatus = 'paid';
  order.orderStatus = order.orderStatus === 'placed' ? 'confirmed' : order.orderStatus;
  await order.save();

  // Auto-generate the invoice the moment payment is confirmed.
  const user = await User.findById(order.user);
  const profile = await ClientProfile.findOne({ user: order.user });
  let invoice = await createInvoiceForOrder(order, user, profile);
  invoice = await markInvoicePaid(invoice._id, order.grandTotal);

  order.invoice = invoice._id;
  await order.save();

  success(res, { payment, order, invoice }, 'Payment verified and invoice generated');
});

// @route POST /api/payments/webhook
// Razorpay server-to-server webhook (payment.captured / payment.failed etc.)
// Mounted with express.raw() so req.body is the raw buffer for signature check.
const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body; // Buffer, thanks to express.raw() on this route

  const isValid = verifyWebhookSignature({ rawBody: rawBody.toString(), signature });
  if (!isValid) {
    res.status(400);
    throw new Error('Invalid webhook signature');
  }

  const event = JSON.parse(rawBody.toString());
  const rzpOrderId = event.payload?.payment?.entity?.order_id;

  if (rzpOrderId) {
    const payment = await Payment.findOne({ gatewayOrderId: rzpOrderId });
    if (payment) {
      payment.rawWebhookEvents.push({ event: event.event, payload: event.payload, receivedAt: new Date() });

      if (event.event === 'payment.captured' && payment.status !== 'paid') {
        payment.status = 'paid';
        payment.gatewayPaymentId = event.payload.payment.entity.id;
        await payment.save();

        const order = await Order.findById(payment.order);
        if (order && order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          await order.save();

          const user = await User.findById(order.user);
          const profile = await ClientProfile.findOne({ user: order.user });
          let invoice = await createInvoiceForOrder(order, user, profile);
          invoice = await markInvoicePaid(invoice._id, order.grandTotal);
          order.invoice = invoice._id;
          await order.save();
        }
      } else if (event.event === 'payment.failed') {
        payment.status = 'failed';
        payment.failureReason = event.payload.payment.entity.error_description;
        await payment.save();
      } else {
        await payment.save();
      }
    }
  }

  res.status(200).json({ received: true });
});

// @route POST /api/payments/:paymentId/refund (admin only)
const refund = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.paymentId);
  if (!payment || payment.status !== 'paid') {
    res.status(400);
    throw new Error('Payment not found or not eligible for refund');
  }

  const refundResult = await refundPayment(payment.gatewayPaymentId, req.body.amount);

  payment.status = 'refunded';
  payment.refundId = refundResult.id;
  payment.refundAmount = req.body.amount || payment.amount;
  await payment.save();

  const order = await Order.findById(payment.order);
  order.paymentStatus = req.body.amount && req.body.amount < payment.amount ? 'partially_refunded' : 'refunded';
  await order.save();

  success(res, { payment, refund: refundResult }, 'Refund processed');
});

module.exports = { initiatePayment, verifyPayment, razorpayWebhook, refund };
