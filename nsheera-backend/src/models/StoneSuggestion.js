const mongoose = require('mongoose');

const stoneSuggestionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
