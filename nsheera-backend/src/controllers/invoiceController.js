const asyncHandler = require('express-async-handler');
const path = require('path');
const Invoice = require('../models/Invoice');
const { success } = require('../utils/apiResponse');

// @route GET /api/invoices (own invoices; admin can pass ?all=true)
const listInvoices = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' && req.query.all === 'true' ? {} : { user: req.user._id };
  const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
  success(res, { invoices });
});

// @route GET /api/invoices/:id
const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('order');
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  if (req.user.role !== 'admin' && String(invoice.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to view this invoice');
  }
  success(res, { invoice });
});

// @route GET /api/invoices/:id/pdf
const downloadInvoicePdf = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice || !invoice.pdfPath) {
    res.status(404);
    throw new Error('Invoice PDF not found');
  }
  if (req.user.role !== 'admin' && String(invoice.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to view this invoice');
  }
  res.download(path.resolve(invoice.pdfPath), `${invoice.invoiceNumber}.pdf`);
});

module.exports = { listInvoices, getInvoice, downloadInvoicePdf };
