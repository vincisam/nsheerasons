const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpayInstance = null;

function getClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys are not configured on the server');
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

/**
 * Creates a Razorpay order. Amount must be passed in rupees; Razorpay
 * expects paise, so we convert here.
 */
async function createRazorpayOrder({ amountInRupees, receipt, notes }) {
  const client = getClient();
  return client.orders.create({
    amount: Math.round(amountInRupees * 100),
    currency: 'INR',
    receipt,
    notes,
  });
}

/**
 * Verifies the signature returned by Razorpay Checkout after a successful
 * payment: HMAC-SHA256 of "order_id|payment_id" using the key secret.
 */
function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  return expected === razorpaySignature;
}

/**
 * Verifies an incoming webhook payload signature using the separate
 * webhook secret configured in the Razorpay dashboard.
 */
function verifyWebhookSignature({ rawBody, signature }) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
}

async function fetchPayment(paymentId) {
  const client = getClient();
  return client.payments.fetch(paymentId);
}

async function refundPayment(paymentId, amountInRupees) {
  const client = getClient();
  return client.payments.refund(paymentId, amountInRupees ? { amount: Math.round(amountInRupees * 100) } : {});
}

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  fetchPayment,
  refundPayment,
};
