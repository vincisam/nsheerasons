const express = require('express');
const { initiatePayment, verifyPayment, refund } = require('../controllers/paymentController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

// NOTE: the /webhook route is intentionally NOT defined here. It needs the
// raw request body for Razorpay signature verification, so it's mounted
// directly in app.js with express.raw(), before the global express.json()
// middleware runs. See app.js.

router.use(protect);
router.post('/create-order', initiatePayment);
router.post('/verify', verifyPayment);
router.post('/:paymentId/refund', requireRole('admin'), refund);

module.exports = router;
