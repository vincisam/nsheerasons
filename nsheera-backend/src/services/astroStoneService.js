const { generateContent, parseJsonResponse } = require('./geminiService');

function buildAstroPrompt(input) {
  const {
    dob,
    timeOfBirth = 'not provided',
    placeOfBirth = 'not provided',
    knownRashi = 'not provided',
    knownNakshatra = 'not provided',
    focusArea = 'general wellbeing and prosperity',
  } = input;

  return `You are an experienced Vedic astrologer and gemmologist advising clients of an Indian
fine-jewellery studio called Nsheera on which gemstone to wear.

Client birth details:
- Date of birth: ${dob}
- Time of birth: ${timeOfBirth}
- Place of birth: ${placeOfBirth}
- Known Rashi (moon sign), if provided: ${knownRashi}
- Known Nakshatra, if provided: ${knownNakshatra}
- Area of life they want support with: ${focusArea}

Using traditional Vedic astrology principles (planetary rulership of Rashi/Nakshatra), suggest
an appropriate gemstone. If exact chart data (time/place) is missing, reason from the Rashi/DOB
as best as possible and note the suggestion is preliminary until confirmed by a proper Kundli
reading. Always include a short disclaimer that this is for guidance/informational purposes only
and not a substitute for consulting a qualified astrologer, and that any gemstone should be tested
for a trial period before permanent wear.

Respond ONLY with valid JSON (no markdown fences, no commentary) matching exactly this shape:

{
  "primaryStone": "main recommended gemstone",
  "alternateStones": ["substitute stone 1", "substitute stone 2"],
  "metalPairing": "recommended metal to set the stone in, e.g. gold/silver/panchdhatu",
  "wearingFinger": "traditional finger recommendation",
  "wearingDay": "traditional day/time to first wear it",
  "reasoning": "2-4 sentences explaining the astrological reasoning in plain language",
  "cautions": "who should be cautious or avoid this stone, and why",
  "disclaimer": "brief informational-purposes-only disclaimer"
}`;
}

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
