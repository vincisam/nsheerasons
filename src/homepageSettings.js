export const DEFAULT_HERO_SLIDES = [
  { id: 'hero-1', title: 'Certified Gold & Diamond Jewellery', subtitle: 'BIS Hallmarked · Three Generations of Trust', imageDataUrl: '' },
  { id: 'hero-2', title: "Today's Live Gold & Silver Rate", subtitle: 'Transparent pricing, updated daily against the market', imageDataUrl: '' },
  { id: 'hero-3', title: 'Cash for Gold & Gold Loan Settlement', subtitle: "Fair valuation at today's live rate — no surprises", imageDataUrl: '' },
];

export function normalizeHeroSlides(value) {
  const rawSlides = Array.isArray(value) ? value : [];
  return DEFAULT_HERO_SLIDES.map((fallback, index) => {
    const existing = rawSlides[index] || rawSlides.find((slide) => slide?.id === fallback.id) || rawSlides[index - 1] || {};
    return {
      id: existing?.id || fallback.id,
      title: existing?.title || fallback.title,
      subtitle: existing?.subtitle || fallback.subtitle,
      imageDataUrl: existing?.imageDataUrl || '',
    };
  });
}
