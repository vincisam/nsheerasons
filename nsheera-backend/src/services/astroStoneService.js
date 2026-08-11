const { generateContent, parseJsonResponse } = require('./geminiService');

/**
 * Builds the prompt for the Astro Stone Advisor. The frontend sends
 * `{ dateOfBirth, timeOfBirth, placeOfBirth, concern }`. We ask Gemini to
 * return the EXACT shape the frontend's `normalizeAstroSuggestion` expects.
 */
function buildAstroPrompt(input) {
  const {
    dateOfBirth,
    timeOfBirth = 'not provided',
    placeOfBirth = 'not provided',
    concern = 'general wellbeing and prosperity',
  } = input;

  return `You are an experienced Vedic astrologer and gemmologist advising clients of an Indian
fine-jewellery studio called Nsheera on which gemstone to wear.

Client birth details:
- Date of birth: ${dateOfBirth}
- Time of birth: ${timeOfBirth}
- Place of birth: ${placeOfBirth}
- Area of life they want support with: ${concern}

Using traditional Vedic astrology principles (planetary rulership of Rashi/Nakshatra), suggest
an appropriate gemstone. If exact chart data (time/place) is missing, reason from the DOB
as best as possible and note the suggestion is preliminary until confirmed by a proper Kundli
reading. Always include a short disclaimer that this is for guidance/informational purposes only
and not a substitute for consulting a qualified astrologer, and that any gemstone should be tested
for a trial period before permanent wear.

Respond ONLY with valid JSON (no markdown fences, no commentary) matching exactly this shape:

{
  "primaryStone": "main recommended gemstone",
  "associatedPlanet": "planet associated with the stone",
  "rationale": "2-4 sentences explaining the astrological reasoning in plain language",
  "recommendedMetal": "recommended metal to set the stone in, e.g. gold/silver/panchdhatu",
  "moonSignEstimate": "estimated moon sign / rashi based on the DOB, or 'To be confirmed with an exact birth chart'",
  "wearingGuidance": {
    "finger": "traditional finger recommendation",
    "day": "traditional day/time to first wear it",
    "weightNote": "traditional weight recommendation, e.g. in carats/ratis"
  },
  "alternativeStones": [
    { "name": "substitute stone 1", "reason": "why it's a good alternative" },
    { "name": "substitute stone 2", "reason": "why it's a good alternative" }
  ],
  "stonesToAvoidNote": "which stones to avoid and why, if any",
  "disclaimer": "brief informational-purposes-only disclaimer"
}`;
}

/**
 * Generates a stone suggestion. Accepts the frontend's
 * `{ dateOfBirth, timeOfBirth, placeOfBirth, concern }` object and returns
 * the parsed suggestion in the shape the frontend's `normalizeAstroSuggestion`
 * expects.
 */
async function generateStoneSuggestion(input) {
  const prompt = buildAstroPrompt(input);

  const raw = await generateContent({
    prompt,
    jsonMode: true,
  });

  const parsed = parseJsonResponse(raw);
  return { parsed, raw };
}

module.exports = { generateStoneSuggestion, buildAstroPrompt };
