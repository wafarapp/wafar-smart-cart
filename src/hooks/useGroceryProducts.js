import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { DEMO_GROCERY_PRODUCTS } from '@/constants/demoGroceryProducts';

function isBase44Configured() {
  return Boolean(appParams.appId && appParams.appBaseUrl);
}

function availableProducts(products) {
  return products.filter((p) => p.is_active !== false && p.is_available !== false);
}

async function fetchGroceryProducts() {
  if (!isBase44Configured()) {
    return DEMO_GROCERY_PRODUCTS;
  }

  try {
    const data = await base44.entities.CatalogProduct.filter({ is_active: true });
    const list = Array.isArray(data) ? data : [];
    if (list.length > 0) return availableProducts(list);
  } catch {
    // Base44 unavailable — fall back to demo catalog
  }

  return DEMO_GROCERY_PRODUCTS;
}

export function useGroceryProducts() {
  return useQuery({
    queryKey: ['catalog-products', 'active'],
    queryFn: fetchGroceryProducts,
    placeholderData: DEMO_GROCERY_PRODUCTS,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
