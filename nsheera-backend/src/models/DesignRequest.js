const mongoose = require('mongoose');

const designRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    input: {
      jewelleryType: String, // ring, necklace, earrings, bangle, pendant...
      occasion: String, // wedding, engagement, daily-wear, gifting...
      metal: String, // gold, rose gold, platinum, silver...
      gemstones: [String],
      style: String, // minimal, temple, antique, contemporary, fusion...
      budgetRange: { min: Number, max: Number },
      notes: String,
      referenceImageUrl: String,
    },
    // Structured output returned by Gemini
    result: {
      title: String,
      concept: String,
      metalRecommendation: String,
      stoneRecommendation: [String],
      styleNotes: String,
      estimatedWeightRange: String,
      imageGenPrompt: String, // ready to hand off to an image model (Imagen/DALL-E) later
      alternatives: [String],
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

module.exports = mongoose.model('DesignRequest', designRequestSchema);
