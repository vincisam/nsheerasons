const express = require('express');
const { listInvoices, getInvoice, downloadInvoicePdf } = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', listInvoices);
router.get('/:id', getInvoice);
router.get('/:id/pdf', downloadInvoicePdf);

module.exports = router;
