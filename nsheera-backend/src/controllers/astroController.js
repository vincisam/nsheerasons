const asyncHandler = require('express-async-handler');
const StoneSuggestion = require('../models/StoneSuggestion');
const ClientProfile = require('../models/ClientProfile');
const { generateStoneSuggestion } = require('../services/astroStoneService');
const { success } = require('../utils/apiResponse');

// @route POST /api/ai/stone-suggestion
// Accepts the frontend's contract: { dateOfBirth, timeOfBirth, placeOfBirth, concern }.
// If DOB is missing, falls back to the (optional) ClientProfile if the user is authed.
const createStoneSuggestion = asyncHandler(async (req, res) => {
  let { dateOfBirth, timeOfBirth, placeOfBirth, concern } = req.body;

  if (!dateOfBirth && req.user) {
    const profile = await ClientProfile.findOne({ user: req.user._id });
    dateOfBirth = profile?.birthDetails?.dob;
    timeOfBirth = timeOfBirth || profile?.birthDetails?.timeOfBirth;
    placeOfBirth = placeOfBirth || profile?.birthDetails?.placeOfBirth;
  }

  if (!dateOfBirth) {
    res.status(400);
    throw new Error(
      'Date of birth is required — pass it in the request or save it in your profile first'
    );
  }

  const input = { dateOfBirth, timeOfBirth, placeOfBirth, concern };

  let parsed, raw;
  try {
    ({ parsed, raw } = await generateStoneSuggestion(input));
  } catch (err) {
    try {
      await StoneSuggestion.create({
        user: req.user?._id,
        input,
        status: 'failed',
        rawModelResponse: err.message,
      });
    } catch (e) { /* ignore persistence errors on failure path */ }
    res.status(502);
    throw new Error(`AI stone suggestion failed: ${err.message}`);
  }

  try {
    await StoneSuggestion.create({
      user: req.user?._id,
      input,
      result: parsed,
      rawModelResponse: raw,
      status: 'completed',
    });
  } catch (e) { /* ignore persistence errors on success path */ }

  // Return the RAW parsed suggestion directly — the frontend's
  // normalizeAstroSuggestion expects the suggestion object at the top level
  // (res.json() === suggestion), not wrapped in { success, data }.
  res.status(201).json(parsed);
});

// @route GET /api/ai/stone-suggestion
const listStoneSuggestions = asyncHandler(async (req, res) => {
  const suggestions = req.user
    ? await StoneSuggestion.find({ user: req.user._id }).sort({ createdAt: -1 })
    : [];
  success(res, { suggestions });
});

module.exports = { createStoneSuggestion, listStoneSuggestions };
