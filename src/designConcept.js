/* ------------------------------------------------------------------ */
/* normalizeDesignConcept — normalises the raw JSON returned by Claude */
/* into a consistent shape the UI can render.                         */
/* ------------------------------------------------------------------ */

export function normalizeDesignConcept(rawConcept = {}) {
  // Normalise design variation entries, which may come as an object
  // or array of objects with various key names.
  const rawVariations = rawConcept.designVariations ||
    rawConcept.variations ||
    rawConcept.options ||
    [];

  let designVariations = [];
  if (Array.isArray(rawVariations)) {
    designVariations = rawVariations.map((v) => ({
      name: v.name || v.title || v.variationName || 'Alternative',
      description: v.description || v.desc || '',
      metal: v.metal || v.suggestedMetal || v.metalType || 'To be confirmed',
      purity: v.purity || v.suggestedPurity || v.purityLevel || 'To be confirmed',
      weight: v.weight || v.estimatedWeight || v.estimatedWeightRange || 'To be confirmed',
      price: v.price || v.estimatedPrice || v.priceRange || 'To be confirmed',
      gemstones: v.gemstones || v.gemstoneSuggestions || v.stoneDetails || 'To be confirmed',
      makingTime: v.makingTime || v.craftsmanshipTime || v.estimatedTime || 'To be confirmed',
    }));
  } else if (typeof rawVariations === 'object' && rawVariations !== null) {
    // If a single variation object was provided, wrap it
    designVariations = [{
      name: rawVariations.name || rawVariations.title || 'Alternative Design',
      description: rawVariations.description || rawVariations.desc || '',
      metal: rawVariations.metal || rawVariations.suggestedMetal || 'To be confirmed',
      purity: rawVariations.purity || rawVariations.suggestedPurity || 'To be confirmed',
      weight: rawVariations.weight || rawVariations.estimatedWeight || 'To be confirmed',
      price: rawVariations.price || rawVariations.estimatedPrice || 'To be confirmed',
      gemstones: rawVariations.gemstones || rawVariations.gemstoneSuggestions || 'To be confirmed',
      makingTime: rawVariations.makingTime || rawVariations.craftsmanshipTime || 'To be confirmed',
    }];
  }

  return {
    title: rawConcept.title || 'Custom Jewellery Design',
    description: rawConcept.description || 'A bespoke jewellery concept tailored to your preference.',
    suggestedMetal: rawConcept.suggestedMetal || rawConcept.metal || 'To be confirmed',
    suggestedPurity: rawConcept.suggestedPurity || rawConcept.purity || 'To be confirmed',
    estimatedWeightRange: rawConcept.estimatedWeightRange || rawConcept.weight || rawConcept.estimatedWeight || 'To be confirmed',
    approximatePrice: rawConcept.approximatePrice || rawConcept.estimatedPrice || rawConcept.priceRange || 'To be confirmed',
    detailing: rawConcept.detailing || rawConcept.designDetails || rawConcept.styleNotes || 'To be confirmed',
    gemstoneSuggestions: rawConcept.gemstoneSuggestions || rawConcept.gemstones || rawConcept.stoneDetails || 'To be confirmed',
    stoneDetails: rawConcept.stoneDetails || rawConcept.gemstoneDetails || rawConcept.diamondDetails || 'To be confirmed',
    styleNotes: rawConcept.styleNotes || 'To be confirmed',
    craftsmanshipTime: rawConcept.craftsmanshipTime || rawConcept.makingTime || rawConcept.estimatedTime || 'To be confirmed',
    suitableFor: rawConcept.suitableFor || rawConcept.occasion || rawConcept.occasionSuggestions || 'To be confirmed',
    techniqueNotes: rawConcept.techniqueNotes || rawConcept.craftsmanship || rawConcept.craftingTechnique || 'To be confirmed',
    designVariations, // array of alternative design options
    // Present only when the backend's image-generation step succeeded (it's
    // optional — the text concept is always valid on its own).
    imageBase64: rawConcept.imageBase64 || null,
    imageMediaType: rawConcept.imageMediaType || 'image/png',
  };
}

