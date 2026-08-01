function pickPalette(purity = '') {
  const normalized = (purity || '').toLowerCase();
  if (normalized.includes('silver')) return { bg: '#f7f2eb', accent: '#b8a98c', jewel: '#d9d9d9' };
  if (normalized.includes('750') || normalized.includes('18')) return { bg: '#fef6e9', accent: '#8f5b2a', jewel: '#f2c96b' };
  if (normalized.includes('585') || normalized.includes('14')) return { bg: '#f9efe2', accent: '#7a5c2b', jewel: '#c89b3b' };
  return { bg: '#fdf4e6', accent: '#7a2e3a', jewel: '#9c7a3c' };
}

function pickJewelryKind(itemType = '', description = '') {
  const haystack = `${itemType} ${description}`.toLowerCase();
  if (haystack.includes('ring')) return 'ring';
  if (haystack.includes('ear')) return 'earrings';
  if (haystack.includes('bangle') || haystack.includes('bracelet')) return 'bracelet';
  if (haystack.includes('necklace') || haystack.includes('chain') || haystack.includes('pendant')) return 'necklace';
  if (haystack.includes('coin')) return 'coin';
  return 'jewellery';
}

function buildSvg({ title, subtitle, palette, pose, jewelryKind }) {
  const safeTitle = String(title || 'Jewellery').replace(/[<>]/g, '');
  const safeSubtitle = String(subtitle || 'Model shot').replace(/[<>]/g, '');
  const safeJewelryKind = String(jewelryKind || 'Jewellery').replace(/[<>]/g, '');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
      <rect width="1200" height="1600" fill="${palette.bg}" />
      <rect x="0" y="0" width="1200" height="1600" fill="url(#g)" />
      <circle cx="950" cy="240" r="220" fill="rgba(255,255,255,0.32)" />
      <rect x="100" y="1160" width="1000" height="250" rx="48" fill="rgba(42,36,32,0.08)" />
      <g transform="translate(300 220)">
        <circle cx="300" cy="220" r="120" fill="#f2d8c2" />
        <path d="M250 340c0-90 110-125 150-90 40 35 20 120-40 180-40 40-90 50-110 20z" fill="#2a2420" opacity="0.72" />
        <rect x="220" y="420" width="170" height="280" rx="82" fill="#1f1a17" opacity="0.86" />
        <rect x="260" y="480" width="90" height="200" rx="40" fill="#f6ebde" opacity="0.68" />
      </g>
      <g transform="translate(300 110)">
        ${pose}
      </g>
      <rect x="120" y="1320" width="960" height="180" rx="28" fill="rgba(255,255,255,0.9)" />
      <text x="180" y="1410" font-family="Segoe UI, Arial, sans-serif" font-size="64" font-weight="700" fill="#2a2420">${safeTitle}</text>
      <text x="180" y="1475" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="500" fill="#7a5c28">${safeSubtitle}</text>
      <text x="180" y="1535" font-family="Segoe UI, Arial, sans-serif" font-size="28" fill="#766b5d">${safeJewelryKind}</text>
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6" />
          <stop offset="100%" stop-color="${palette.accent}" stop-opacity="0.18" />
        </linearGradient>
      </defs>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function toDataUrl(value) {
  if (!value) return '';
  if (typeof value === 'string' && value.startsWith('data:image')) return value;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(String(value))}`;
}

export function buildInAppModelShotPrompt(product = {}) {
  const title = (product.description || product.itemType || 'Jewellery').trim() || 'Jewellery';
  const itemType = product.itemType || 'Jewellery';
  const purity = product.purity || 'gold916';
  const category = product.categoryId || 'jewellery';
  return {
    title,
    prompt: `Generate 5 luxury ecommerce images of ${title}, a ${jewelryKindFromProduct(itemType, title)} piece in ${category}, worn by a women model. Use elegant studio lighting, soft fashion styling, premium jewellery photography, and show the jewellery clearly and beautifully on the model. Material: ${purity}.`,
  };
}

function jewelryKindFromProduct(itemType = '', description = '') {
  const haystack = `${itemType} ${description}`.toLowerCase();
  if (haystack.includes('ring')) return 'ring';
  if (haystack.includes('ear')) return 'earrings';
  if (haystack.includes('bangle') || haystack.includes('bracelet')) return 'bracelet';
  if (haystack.includes('necklace') || haystack.includes('chain') || haystack.includes('pendant')) return 'necklace';
  if (haystack.includes('coin')) return 'coin';
  return 'jewellery';
}

export function generateModelPreviewImages(product = {}, count = 5) {
  const title = (product.description || product.itemType || 'Jewellery').trim() || 'Jewellery';
  const itemType = product.itemType || 'Jewellery';
  const subtitle = `${product.categoryId || 'Featured'} · ${product.purity || 'gold916'}`;
  const palette = pickPalette(product.purity);
  const jewelryKind = pickJewelryKind(itemType, title);
  const poses = [
    `<circle cx="330" cy="220" r="24" fill="${palette.jewel}" opacity="0.96" />
     <path d="M290 290c0-60 90-95 150-70 30 12 60 45 60 95 0 92-70 120-150 120-40 0-60-27-60-77z" fill="${palette.jewel}" opacity="0.96" />`,
    `<circle cx="330" cy="240" r="24" fill="${palette.jewel}" opacity="0.96" />
     <path d="M280 320c0-65 75-95 120-95 50 0 90 26 90 85 0 72-62 100-120 100-40 0-90-20-90-90z" fill="${palette.jewel}" opacity="0.95" />`,
    `<circle cx="330" cy="260" r="24" fill="${palette.jewel}" opacity="0.96" />
     <path d="M285 300c0-48 82-80 120-80 48 0 90 30 90 95 0 64-52 105-110 105-45 0-100-22-100-120z" fill="${palette.jewel}" opacity="0.95" />`,
    `<circle cx="330" cy="250" r="24" fill="${palette.jewel}" opacity="0.96" />
     <path d="M290 310c0-62 74-95 122-95 54 0 92 35 92 95 0 71-61 107-116 107-42 0-98-34-98-107z" fill="${palette.jewel}" opacity="0.95" />`,
    `<circle cx="330" cy="230" r="24" fill="${palette.jewel}" opacity="0.96" />
     <path d="M280 310c0-70 90-100 140-100 58 0 100 25 100 85 0 66-50 105-118 105-40 0-122-28-122-90z" fill="${palette.jewel}" opacity="0.95" />`,
  ];

  return Array.from({ length: count }, (_, index) => toDataUrl(buildSvg({
    title: title.length > 24 ? `${title.slice(0, 21)}…` : title,
    subtitle: `${subtitle} · Shot ${index + 1}`,
    palette,
    pose: poses[index % poses.length],
    jewelryKind,
  })));
}
