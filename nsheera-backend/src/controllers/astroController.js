const asyncHandler = require('express-async-handler');
const StoneSuggestion = require('../models/StoneSuggestion');
const ClientProfile = require('../models/ClientProfile');
const { generateStoneSuggestion } = require('../services/astroStoneService');

// @route POST /api/ai/stone-suggestion
// Client can pass birth details directly in the request, OR rely on
// whatever they've already saved in their (optional) ClientProfile.
const createStoneSuggestion = asyncHandler(async (req, res) => {
  let { dob, timeOfBirth, placeOfBirth, knownRashi, knownNakshatra, focusArea } = req.body;

  if (!dob && req.user) {
    const profile = await ClientProfile.findOne({ user: req.user._id });
    dob = profile?.birthDetails?.dob;
    timeOfBirth = timeOfBirth || profile?.birthDetails?.timeOfBirth;
    placeOfBirth = placeOfBirth || profile?.birthDetails?.placeOfBirth;
    knownRashi = knownRashi || profile?.birthDetails?.knownRashi;
    knownNakshatra = knownNakshatra || profile?.birthDetails?.knownNakshatra;
  }

  if (!dob) {
    res.status(400);
    throw new Error(
      'Date of birth is required — pass it in the request or save it in your profile first'
    );
  }

  const input = { dob, timeOfBirth, placeOfBirth, knownRashi, knownNakshatra, focusArea };

  let parsed, raw;
  try {
    ({ parsed, raw } = await generateStoneSuggestion(input));
  } catch (err) {
    if (req.user) {
      await StoneSuggestion.create({
        user: req.user._id,
        input,
        status: 'failed',
        rawModelResponse: err.message,
      });
    }
    res.status(502);
    throw new Error(`AI stone suggestion failed: ${err.message}`);
  }

  if (req.user) {
    await StoneSuggestion.create({
      user: req.user._id,
      input,
      result: parsed,
      rawModelResponse: raw,
      status: 'completed',
    });
  }

  res.status(201).json(parsed);
});

// @route GET /api/ai/stone-suggestion
const listStoneSuggestions = asyncHandler(async (req, res) => {
  const suggestions = await StoneSuggestion.find({ user: req.user._id }).sort({ createdAt: -1 });
  success(res, { suggestions });
});

module.exports = { createStoneSuggestion, listStoneSuggestions };
