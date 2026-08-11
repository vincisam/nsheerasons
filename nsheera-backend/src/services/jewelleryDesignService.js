const { generateContent, parseJsonResponse } = require('./geminiService');

/**
 * Builds a prompt for the AI Design Studio. The frontend sends a free-form
 * `promptText` (which already contains the customer's instruction) and an
 * optional `fileBlock` reference image. We wrap that into a system-style
 * prompt asking Gemini to return the EXACT shape the frontend renderer
 * (`normalizeDesignConcept`) expects.
 */
function buildDesignPrompt(promptText, referenceImage) {
  const hasImage = Boolean(referenceImage?.base64Data);

  return `You are a senior jewellery design consultant for N.S. Heera & Sons Jewellers, an Indian gold, diamond and silver jewellery retailer established in 1968. A customer has either described a design they want in words, or shared a photo/document of an existing piece they'd like redesigned.

Propose ONE thoughtful, realistic jewellery design concept suited to Indian jewellery craftsmanship (gold purities like 22K/916, 18K/750, silver 925, diamonds, traditional and contemporary styles). Keep suggestions realistic for a working jeweller to actually produce — avoid impossible, wildly extravagant, or unsafe claims, and do not invent a precise final price (a human will quote that).

If the request is unrelated to jewellery design (or the uploaded file isn't jewellery), politely decline within the JSON's "description" field and leave other fields empty, rather than making something up.

You MUST include at least 2-3 designVariations entries showing alternative options (e.g. different metal, purity, weight, price point) for the concept. Each variation should have its own specs.

Customer request:
${promptText}
${hasImage ? '\nThe customer has also attached a reference image — use it for redesign ideas.' : ''}

Respond ONLY with a JSON object in exactly this shape — no markdown fences, no preamble, no text outside the JSON:
{
  "title": "short concept name",
  "description": "2-4 sentence description of the design",
  "suggestedMetal": "e.g. 22K Gold / Sterling Silver / Gold with Diamonds",
  "suggestedPurity": "e.g. 22K (916)",
  "estimatedWeightRange": "e.g. 8-12 grams",
  "approximatePrice": "e.g. ₹45,000 - ₹55,000",
  "detailing": "Detailed design description — pattern, finish, gemstone settings, special features",
  "gemstoneSuggestions": "e.g. Small round diamonds, ruby accent, or none",
  "stoneDetails": "Detailed stone specifications — type, carat weight, color, clarity, cut, number of stones",
  "styleNotes": "1-2 sentences on style, occasion fit, or how this reinterprets the uploaded reference",
  "craftsmanshipTime": "Estimated making time, e.g. 2-3 weeks",
  "suitableFor": "e.g. Wedding, Engagement, Festive wear, Daily wear, Gift",
  "techniqueNotes": "Craftsmanship techniques — e.g. hand engraving, filigree, kundan setting, milgrain detailing",
  "designVariations": [
    {
      "name": "e.g. Premium Version (Diamond-set)",
      "description": "What makes this variation different",
      "metal": "e.g. 18K Gold",
      "purity": "e.g. 18K (750)",
      "weight": "e.g. 10-12 grams",
      "price": "e.g. ₹65,000 - ₹75,000",
      "gemstones": "e.g. VS clarity diamonds, 0.5ct total",
      "makingTime": "e.g. 3-4 weeks"
    },
    {
      "name": "e.g. Essential Version (Without Diamonds)",
      "description": "A more affordable option",
      "metal": "e.g. 22K Gold",
      "purity": "e.g. 22K (916)",
      "weight": "e.g. 8-10 grams",
      "price": "e.g. ₹35,000 - ₹42,000",
      "gemstones": "None",
      "makingTime": "e.g. 2-3 weeks"
    }
  ]
}`;
}

/**
 * Generates a design concept. Accepts the frontend's free-form `promptText`
 * and optional reference image, and returns the parsed concept object in the
 * shape the frontend's `normalizeDesignConcept` expects.
 */
async function generateDesignConcept({ promptText }, referenceImage) {
  const prompt = buildDesignPrompt(promptText, referenceImage);

  const raw = await generateContent({
    prompt,
    jsonMode: true,
    inlineImage: referenceImage,
  });

  const parsed = parseJsonResponse(raw);
  return { parsed, raw };
}

module.exports = { generateDesignConcept, buildDesignPrompt };
