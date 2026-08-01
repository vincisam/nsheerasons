const express = require('express');
const { listClients, getClientDetail, setClientStatus } = require('../controllers/adminClientController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(protect, requireRole('admin'));

router.get('/clients', listClients);
router.get('/clients/:userId', getClientDetail);
router.put('/clients/:userId/status', setClientStatus);

module.exports = router;
