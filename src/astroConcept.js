/* ------------------------------------------------------------------ */
/* normalizeAstroSuggestion — normalises the raw JSON returned by the   */
/* Astro Stone Advisor backend into a consistent shape the UI can       */
/* render, and guarantees the disclaimer is always present even if the  */
/* model response is malformed or incomplete.                           */
/* ------------------------------------------------------------------ */

const DEFAULT_DISCLAIMER =
  'This is traditional/cultural guidance for informational purposes only, not medical, legal, or financial advice. ' +
  'For a personalised reading based on your exact birth chart, consult a qualified astrologer. ' +
  'For health concerns, please consult a doctor.';

export function normalizeAstroSuggestion(raw = {}) {
  const rawAlternatives = raw.alternativeStones || raw.alternatives || [];
  const alternativeStones = Array.isArray(rawAlternatives)
    ? rawAlternatives.map((a) => ({
        name: a.name || a.stone || 'Alternative stone',
        reason: a.reason || a.description || '',
      }))
    : [];

  const rawGuidance = raw.wearingGuidance || {};

  return {
    moonSignEstimate: raw.moonSignEstimate || raw.moonSign || 'To be confirmed with an exact birth chart',
    primaryStone: raw.primaryStone || raw.stone || 'To be confirmed',
    associatedPlanet: raw.associatedPlanet || raw.planet || 'To be confirmed',
    rationale: raw.rationale || raw.description || '',
    recommendedMetal: raw.recommendedMetal || raw.metal || 'To be confirmed',
    wearingGuidance: {
      finger: rawGuidance.finger || 'To be confirmed',
      day: rawGuidance.day || 'To be confirmed',
      weightNote: rawGuidance.weightNote || rawGuidance.weight || 'To be confirmed',
    },
    alternativeStones,
    stonesToAvoidNote: raw.stonesToAvoidNote || raw.avoid || '',
    // Always render a disclaimer, even if the model omitted one — this feature should
    // never be shown to a customer without it.
    disclaimer: raw.disclaimer || DEFAULT_DISCLAIMER,
  };
}
