/** Price helpers for catalog / grocery products */
export function getProductPrice(product) {
  const base = Number(product?.price ?? product?.retail_price ?? 0) || 0;
  const offer = Number(product?.offer_price ?? product?.sale_price ?? 0) || 0;
  const hasOffer = offer > 0 && (base <= 0 || offer < base);
  return {
    current: hasOffer ? offer : base,
    original: hasOffer ? base : null,
    hasOffer,
  };
}

export function formatSAR(amount) {
  const n = Number(amount);
  if (!n || n <= 0) return null;
  return new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}
