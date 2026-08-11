const mongoose = require('mongoose');

const stoneSuggestionSchema = new mongoose.Schema(
  {
    // Optional — the astro endpoints are public, so a request may come in
    // without a logged-in user (frontend doesn't send a JWT).
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: null },
    input: {
      dob: Date,
      timeOfBirth: String,
      placeOfBirth: String,
      knownRashi: String,
      knownNakshatra: String,
      focusArea: String, // e.g. "career", "health", "relationships", "general"
    },
    result: {
      primaryStone: String,
      alternateStones: [String],
      metalPairing: String,
      wearingFinger: String,
      wearingDay: String,
      reasoning: String,
      cautions: String,
      disclaimer: String,
    },
    rawModelResponse: String,
    status: {
      type: String,
      enum: ['completed', 'failed'],
      default: 'completed',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StoneSuggestion', stoneSuggestionSchema);
