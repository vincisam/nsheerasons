const express = require('express');
const { createOrder, listOrders, getOrder, updateOrderStatus } = require('../controllers/orderController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createOrder);
router.get('/', listOrders);
router.get('/:id', getOrder);
router.put('/:id/status', requireRole('admin'), updateOrderStatus);

module.exports = router;
