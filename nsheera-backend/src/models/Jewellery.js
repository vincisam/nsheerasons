const mongoose = require('mongoose');

const stoneSchema = new mongoose.Schema(
  {
    type: { type: String }, // e.g. Ruby, Polki diamond, CZ
    count: { type: Number, default: 1 },
    caratWeight: Number,
    clarity: String,
    color: String,
    setting: String, // e.g. prong, bezel, kundan, pave
  },
  { _id: false }
);

/**
 * Full "jewellery detailing" record — everything needed to describe,
 * price, and sell a piece: metal/purity/weight, stone breakdown, making
 * charges, wastage, tax, images, stock and certification.
 */
const jewellerySchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['ring', 'necklace', 'earrings', 'bangle', 'bracelet', 'pendant', 'chain', 'mangalsutra', 'nosepin', 'other'],
    },
    subCategory: String, // e.g. "cocktail ring", "temple necklace"
    occasion: [String], // wedding, engagement, daily-wear, festive, gifting
    style: [String], // minimal, temple, antique, contemporary, fusion, kundan

    metal: {
      type: { type: String, enum: ['gold', 'silver', 'platinum', 'panchdhatu'], required: true },
      purity: String, // e.g. "22k", "18k", "925 sterling"
      colorTone: { type: String, enum: ['yellow', 'rose', 'white', 'antique', 'na'], default: 'yellow' },
      grossWeightGrams: { type: Number, required: true },
      netWeightGrams: Number, // metal weight excluding stones
    },

    stones: [stoneSchema],

    pricing: {
      metalRatePerGram: { type: Number, required: true }, // rate at time of listing
      metalCost: Number, // netWeightGrams * metalRatePerGram (auto-computed)
      stoneCost: { type: Number, default: 0 },
      makingChargeType: { type: String, enum: ['percentage', 'fixed', 'per_gram'], default: 'percentage' },
      makingChargeValue: { type: Number, default: 0 },
      makingCharges: Number, // auto-computed from type+value
      wastagePercent: { type: Number, default: 0 },
      wastageCost: Number, // auto-computed
      taxPercent: { type: Number, default: 3 }, // GST on jewellery is typically 3% in India
      subtotal: Number, // metalCost + stoneCost + makingCharges + wastageCost
      taxAmount: Number,
      totalPrice: Number, // final sellable price
    },

    images: [String], // URLs (uploaded via /api/jewellery/:id/images)
    description: String,
    tags: [String],
    certification: {
      hallmarked: { type: Boolean, default: false },
      certificateNumber: String,
      certifyingBody: String, // e.g. BIS
    },
    availableSizes: [String], // ring sizes, bangle sizes etc.
    stock: {
      quantity: { type: Number, default: 0 },
      isMadeToOrder: { type: Boolean, default: false },
      leadTimeDays: Number,
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

/**
 * Recomputes the full pricing breakdown from the raw inputs
 * (weights, rates, stone cost, making charge config, wastage %, tax %).
 * Call this before save whenever pricing-relevant fields change.
 */
jewellerySchema.methods.computePricing = function () {
  const p = this.pricing;
  const netWeight = this.metal.netWeightGrams ?? this.metal.grossWeightGrams;

  p.metalCost = Math.round((netWeight || 0) * (p.metalRatePerGram || 0));

  p.stoneCost =
    p.stoneCost ||
    (this.stones || []).reduce((sum, s) => sum + (s.caratWeight || 0) * 0, 0) ||
    p.stoneCost ||
    0;

  if (p.makingChargeType === 'percentage') {
    p.makingCharges = Math.round((p.metalCost * (p.makingChargeValue || 0)) / 100);
  } else if (p.makingChargeType === 'per_gram') {
    p.makingCharges = Math.round((netWeight || 0) * (p.makingChargeValue || 0));
  } else {
    p.makingCharges = Math.round(p.makingChargeValue || 0);
  }

  p.wastageCost = Math.round((p.metalCost * (p.wastagePercent || 0)) / 100);

  p.subtotal = Math.round(p.metalCost + p.stoneCost + p.makingCharges + p.wastageCost);
  p.taxAmount = Math.round((p.subtotal * (p.taxPercent ?? 3)) / 100);
  p.totalPrice = p.subtotal + p.taxAmount;

  return p;
};

jewellerySchema.pre('save', function (next) {
  this.computePricing();
  next();
});

module.exports = mongoose.model('Jewellery', jewellerySchema);
