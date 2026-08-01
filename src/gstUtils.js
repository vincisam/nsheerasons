export const DEFAULT_GST_NUMBER = '07AAMFN7465J1ZN';

export function resolveGstNumber(buyerType, gstNumber) {
  const normalized = typeof gstNumber === 'string' ? gstNumber.trim().toUpperCase() : '';
  if (buyerType === 'Shopkeeper') {
    return normalized || DEFAULT_GST_NUMBER;
  }
  return normalized;
}
