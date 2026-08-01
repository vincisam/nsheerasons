const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    jewellery: { type: mongoose.Schema.Types.ObjectId, ref: 'Jewellery', required: true },
    // Snapshot fields — kept even if the catalog item later changes/is deleted
    name: String,
    sku: String,
    unitPrice: Number,
    quantity: { type: Number, default: 1, min: 1 },
    size: String,
    customization: String, // e.g. engraving text
    lineTotal: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, required: true }, // e.g. NSH-ORD-2026-0001
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },

    shippingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
      phone: String,
    },

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['placed', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled'],
      default: 'placed',
    },

    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },

    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
