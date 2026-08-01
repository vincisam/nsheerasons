const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
  {
    name: String,
    sku: String,
    quantity: Number,
    unitPrice: Number,
    lineTotal: Number,
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, required: true }, // e.g. NSH-INV-2026-0001
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    billingDetails: {
      name: String,
      email: String,
      phone: String,
      address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
        country: String,
      },
    },

    items: [invoiceItemSchema],

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 3 },
    taxAmount: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },

    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['unpaid', 'paid', 'partially_paid', 'cancelled'],
      default: 'unpaid',
    },

    pdfPath: String, // filesystem path of the generated PDF
    issuedAt: { type: Date, default: Date.now },
    dueDate: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
