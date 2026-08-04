const { generateContent, parseJsonResponse } = require('./geminiService');

function buildDesignPrompt(input) {
  const {
    promptText,
    jewelleryType = 'ring',
    occasion = 'general wear',
    metal = 'not specified',
    gemstones = [],
    style = 'not specified',
    budgetRange,
    notes = '',
    referenceImage,
  } = input;

  const budgetText = budgetRange?.min && budgetRange?.max
    ? `Budget range: ₹${budgetRange.min} - ₹${budgetRange.max}.`
    : '';

  const imageNote = referenceImage
    ? 'Use the attached reference image as inspiration for style, materials, and craftsmanship.'
    : '';

  if (promptText) {
    return `You are a senior jewellery designer at an Indian fine-jewellery studio called Nsheera.
Design a concept for a piece of jewellery based on this client brief:

${promptText}

${imageNote}
${budgetText ? budgetText + '\n' : ''}
Respond ONLY with valid JSON (no markdown fences, no commentary) matching exactly this shape:

{
  "title": "short evocative name for the design",
  "concept": "2-3 sentence description of the overall design concept",
  "metalRecommendation": "recommended metal + karat/purity, with brief reason",
  "stoneRecommendation": ["stone 1", "stone 2"],
  "styleNotes": "1-2 sentences on craftsmanship details, setting style, motifs",
  "estimatedWeightRange": "e.g. 6-8 grams (approximate, for a ${jewelleryType})",
  "imageGenPrompt": "a single detailed prompt suitable for feeding into an image-generation model to visualize this exact piece, mentioning metal, stones, motif, and style",
  "alternatives": ["one-line variant idea 1", "one-line variant idea 2"]
}`;
  }

  return `You are a senior jewellery designer at an Indian fine-jewellery studio called Nsheera.
Design a concept for a piece of jewellery based on this client brief:

- Jewellery type: ${jewelleryType}
- Occasion: ${occasion}
- Preferred metal: ${metal}
- Preferred/requested gemstones: ${gemstones.length ? gemstones.join(', ') : 'open to suggestions'}
- Style: ${style}
- ${budgetText}
- Additional notes from client: ${notes || 'none'}
${imageNote ? '\n' + imageNote : ''}

Respond ONLY with valid JSON (no markdown fences, no commentary) matching exactly this shape:

{
  "title": "short evocative name for the design",
  "concept": "2-3 sentence description of the overall design concept",
  "metalRecommendation": "recommended metal + karat/purity, with brief reason",
  "stoneRecommendation": ["stone 1", "stone 2"],
  "styleNotes": "1-2 sentences on craftsmanship details, setting style, motifs",
  "estimatedWeightRange": "e.g. 6-8 grams (approximate, for a ${jewelleryType})",
  "imageGenPrompt": "a single detailed prompt suitable for feeding into an image-generation model to visualize this exact piece, mentioning metal, stones, motif, and style",
  "alternatives": ["one-line variant idea 1", "one-line variant idea 2"]
}`;
}

async function generateDesignConcept(input, referenceImage) {
  const prompt = buildDesignPrompt(input);

  const raw = await generateContent({
    prompt,
    jsonMode: true,
    inlineImage: referenceImage,
  });

  const parsed = parseJsonResponse(raw);
  return { parsed, raw };
}

module.exports = { generateDesignConcept, buildDesignPrompt };
