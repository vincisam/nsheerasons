const mongoose = require('mongoose');

/**
 * ClientProfile is optional and edited from Settings — never forced at login.
 * The dashboard endpoint only exposes an `isProfileComplete` flag so the
 * frontend can render a small dismissible nudge instead of a blocking form.
 */
const clientProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    // Shop-CRM fields the storefront's account Settings form collects —
    // account type drives whether GST is required, businessName/gstNumber
    // are only meaningful for Shopkeeper accounts, anniversary is used the
    // same way birthDetails.dob is (occasion-based outreach).
    type: { type: String, enum: ['Retail', 'Shopkeeper'], default: 'Retail' },
    businessName: String,
    gstNumber: String,
    anniversary: Date,
    // Used for astro-based stone suggestions — all optional, filled whenever
    // the client chooses to use that feature, not at signup/login.
    birthDetails: {
      dob: Date, // YYYY-MM-DD
      timeOfBirth: String, // "HH:mm", optional
      placeOfBirth: String,
      knownRashi: String, // moon sign, if the client already knows it
      knownNakshatra: String,
    },
    preferences: {
      preferredMetals: [String], // e.g. ["gold", "platinum"]
      preferredStyles: [String], // e.g. ["minimal", "temple", "antique"]
      budgetRange: {
        min: Number,
        max: Number,
      },
    },
    avatarUrl: String,
  },
  { timestamps: true }
);

clientProfileSchema.virtual('isProfileComplete').get(function () {
  return Boolean(
    this.address?.city &&
      this.address?.pincode &&
      this.birthDetails?.dob &&
      this.preferences?.preferredMetals?.length
  );
});

clientProfileSchema.set('toJSON', { virtuals: true });
clientProfileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ClientProfile', clientProfileSchema);
