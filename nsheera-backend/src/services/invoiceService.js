const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Invoice = require('../models/Invoice');
const { nextSequence } = require('../models/Counter');

const INVOICE_DIR = path.join(
  (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) ? '/tmp' : process.cwd(),
  process.env.UPLOAD_DIR || 'uploads',
  'invoices'
);

function ensureInvoiceDir() {
  if (!fs.existsSync(INVOICE_DIR)) {
    fs.mkdirSync(INVOICE_DIR, { recursive: true });
  }
}

async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const seq = await nextSequence(`invoice-${year}`);
  return `NSH-INV-${year}-${String(seq).padStart(4, '0')}`;
}

/**
 * Creates an Invoice document (billing snapshot + line items + totals)
 * from a populated Order + the User who placed it, then renders a PDF.
 */
async function createInvoiceForOrder(order, user, clientProfile) {
  const invoiceNumber = await generateInvoiceNumber();

  const billingAddress = clientProfile?.address || order.shippingAddress || {};

  const invoice = await Invoice.create({
    invoiceNumber,
    order: order._id,
    user: user._id,
    billingDetails: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: {
        line1: billingAddress.line1,
        line2: billingAddress.line2,
        city: billingAddress.city,
        state: billingAddress.state,
        pincode: billingAddress.pincode,
        country: billingAddress.country || 'India',
      },
    },
    items: order.items.map((it) => ({
      name: it.name,
      sku: it.sku,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      lineTotal: it.lineTotal,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    // Effective blended tax rate for display purposes (individual items may
    // each carry their own taxPercent; this is the overall subtotal->tax ratio).
    taxPercent: order.subtotal ? Number(((order.taxAmount / order.subtotal) * 100).toFixed(2)) : 3,
    taxAmount: order.taxAmount,
    shippingCharge: order.shippingCharge,
    grandTotal: order.grandTotal,
    amountPaid: 0,
    balanceDue: order.grandTotal,
    status: 'unpaid',
  });

  const pdfPath = await renderInvoicePdf(invoice);
  invoice.pdfPath = pdfPath;
  await invoice.save();

  return invoice;
}

/**
 * Marks an invoice as paid (full or partial) and re-renders the PDF so the
 * "AMOUNT PAID" / "BALANCE DUE" fields on the document stay accurate.
 */
async function markInvoicePaid(invoiceId, amountPaid) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  invoice.amountPaid = amountPaid;
  invoice.balanceDue = Math.max(invoice.grandTotal - amountPaid, 0);
  invoice.status = invoice.balanceDue === 0 ? 'paid' : 'partially_paid';

  invoice.pdfPath = await renderInvoicePdf(invoice);
  await invoice.save();
  return invoice;
}

function renderInvoicePdf(invoice) {
  ensureInvoiceDir();
  const filePath = path.join(INVOICE_DIR, `${invoice.invoiceNumber}.pdf`);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('Nsheera Jewellery', { continued: false });
    doc.fontSize(10).fillColor('#555').text('Fine Jewellery Studio');
    doc.moveDown(1.5);

    doc.fillColor('#000').fontSize(14).text(`Invoice ${invoice.invoiceNumber}`, { underline: true });
    doc.fontSize(10).fillColor('#333');
    doc.text(`Issued: ${new Date(invoice.issuedAt).toLocaleDateString('en-IN')}`);
    doc.text(`Status: ${invoice.status.toUpperCase()}`);
    doc.moveDown();

    // Billing details
    const b = invoice.billingDetails || {};
    doc.fontSize(11).fillColor('#000').text('Billed To:', { underline: true });
    doc.fontSize(10).fillColor('#333');
    doc.text(b.name || '');
    if (b.email) doc.text(b.email);
    if (b.phone) doc.text(b.phone);
    const addr = b.address || {};
    const addrLine = [addr.line1, addr.line2, addr.city, addr.state, addr.pincode, addr.country]
      .filter(Boolean)
      .join(', ');
    if (addrLine) doc.text(addrLine);
    doc.moveDown();

    // Line items table (simple, no external table library)
    const tableTop = doc.y;
    const colX = { name: 50, qty: 300, unit: 360, total: 460 };

    doc.fontSize(10).fillColor('#000');
    doc.text('Item', colX.name, tableTop, { bold: true });
    doc.text('Qty', colX.qty, tableTop);
    doc.text('Unit Price', colX.unit, tableTop);
    doc.text('Total', colX.total, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor('#ccc').stroke();

    let y = tableTop + 22;
    doc.fillColor('#333');
    (invoice.items || []).forEach((item) => {
      doc.text(item.name || item.sku || '-', colX.name, y, { width: 240 });
      doc.text(String(item.quantity), colX.qty, y);
      doc.text(`Rs. ${Number(item.unitPrice || 0).toLocaleString('en-IN')}`, colX.unit, y);
      doc.text(`Rs. ${Number(item.lineTotal || 0).toLocaleString('en-IN')}`, colX.total, y);
      y += 20;
    });

    doc.moveTo(50, y + 5).lineTo(545, y + 5).strokeColor('#ccc').stroke();
    y += 15;

    const totalsLine = (label, value, bold = false) => {
      doc.fontSize(10).fillColor('#000');
      doc.text(label, 360, y);
      doc.text(`Rs. ${Number(value || 0).toLocaleString('en-IN')}`, colX.total, y);
      y += 18;
    };

    totalsLine('Subtotal', invoice.subtotal);
    if (invoice.discount) totalsLine('Discount', -invoice.discount);
    totalsLine(`Tax (${invoice.taxPercent ?? 3}%)`, invoice.taxAmount);
    if (invoice.shippingCharge) totalsLine('Shipping', invoice.shippingCharge);

    doc.fontSize(12).fillColor('#000');
    doc.text('Grand Total', 360, y);
    doc.text(`Rs. ${Number(invoice.grandTotal || 0).toLocaleString('en-IN')}`, colX.total, y);
    y += 22;

    doc.fontSize(10).fillColor('#333');
    doc.text('Amount Paid', 360, y);
    doc.text(`Rs. ${Number(invoice.amountPaid || 0).toLocaleString('en-IN')}`, colX.total, y);
    y += 18;
    doc.text('Balance Due', 360, y);
    doc.text(`Rs. ${Number(invoice.balanceDue || 0).toLocaleString('en-IN')}`, colX.total, y);

    doc.moveDown(3);
    doc.fontSize(8).fillColor('#888').text(
      'This is a system-generated invoice from Nsheera Jewellery.',
      50,
      doc.y,
      { align: 'center', width: 495 }
    );

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = { createInvoiceForOrder, markInvoicePaid, renderInvoicePdf };
