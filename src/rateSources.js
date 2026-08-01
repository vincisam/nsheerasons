export function parseIndiaSpotPrice(payload) {
  const rawAmount = payload?.data?.amount ?? payload?.amount ?? payload?.price;
  const amount = Number(rawAmount);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function parseRapidApiRate(payload, targetKey = '24k', city = 'Delhi') {
  if (!payload) return null;

  const cityStr = String(city || 'Delhi').toLowerCase();
  const targetStr = String(targetKey || '24k').toLowerCase();

  // 1. Direct lookup for key like "Delhi_24k" or "Chennai_1g"
  const keys = Object.keys(payload);
  for (const k of keys) {
    const kLower = k.toLowerCase();
    if (kLower.includes(cityStr) && kLower.includes(targetStr)) {
      const val = Number(payload[k]);
      if (Number.isFinite(val) && val > 0) return val;
    }
  }

  // 2. Lookup matching target key (e.g. key ending with _24k or _1g)
  for (const k of keys) {
    if (k.toLowerCase().includes(targetStr)) {
      const val = Number(payload[k]);
      if (Number.isFinite(val) && val > 0) return val;
    }
  }

  // 3. Standard fallback
  return parseIndiaSpotPrice(payload);
}
