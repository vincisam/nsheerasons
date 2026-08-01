const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    gateway: { type: String, enum: ['razorpay'], default: 'razorpay' },
    gatewayOrderId: { type: String, required: true },
    gatewayPaymentId: String,
    gatewaySignature: String,

    amount: { type: Number, required: true }, // in INR (rupees, not paise)
    currency: { type: String, default: 'INR' },
    method: String, // card, upi, netbanking...

    status: {
      type: String,
      enum: ['created', 'authorized', 'paid', 'failed', 'refunded'],
      default: 'created',
    },

    failureReason: String,
    refundId: String,
    refundAmount: Number,

    rawWebhookEvents: [{ event: String, payload: mongoose.Schema.Types.Mixed, receivedAt: Date }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
