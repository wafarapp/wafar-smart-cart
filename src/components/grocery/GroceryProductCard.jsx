import { memo } from 'react';
import { Plus, Minus } from 'lucide-react';
import { getProductPrice, formatSAR } from '@/lib/format';
import { CATEGORY_EMOJI } from '@/constants/groceryCategories';
import OptimizedImage from '@/components/OptimizedImage';

function GroceryProductCard({ product, qty, onUpdate }) {
  const { current, original, hasOffer } = getProductPrice(product);
  const priceLabel = formatSAR(current);
  const emoji = CATEGORY_EMOJI[product.category] || '🛒';

  return (
    <article className="content-auto flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-emerald-50/80 to-white">
        <OptimizedImage
          src={product.image_url}
          alt={product.name}
          fallback={emoji}
          className="aspect-square h-full w-full"
          imgClassName="object-contain p-2"
        />
        {hasOffer && (
          <span className="absolute start-2 top-2 rounded-lg bg-red-500 px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
            خصم
          </span>
        )}
        {product.is_popular && (
          <span className="absolute end-2 top-2 rounded-lg bg-amber-400 px-2 py-0.5 text-[10px] font-black text-amber-950">
            الأكثر طلباً
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="min-h-[2.5rem]">
          <p className="line-clamp-2 text-sm font-bold leading-snug text-gray-900">{product.name}</p>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {[product.brand, product.size].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="min-w-0">
            {priceLabel ? (
              <div className="flex flex-col">
                {original != null && (
                  <span className="text-[10px] text-gray-400 line-through">{formatSAR(original)} ر.س</span>
                )}
                <span className="text-base font-black text-emerald-700">
                  {priceLabel} <span className="text-[10px] font-semibold text-gray-400">ر.س</span>
                </span>
              </div>
            ) : (
              <span className="text-xs font-semibold text-gray-400">السعر عند الدفع</span>
            )}
            <span className="mt-0.5 block text-[10px] font-medium text-gray-400">{product.unit_type || 'حبة'}</span>
          </div>

          {qty === 0 ? (
            <button
              type="button"
              onClick={() => onUpdate(product, 1)}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 shadow-md shadow-emerald-200 transition-transform active:scale-90"
              aria-label={`إضافة ${product.name}`}
            >
              <Plus size={16} className="text-white" />
            </button>
          ) : (
            <div className="flex flex-shrink-0 items-center gap-1 rounded-xl border border-emerald-100 bg-emerald-50 p-0.5">
              <button
                type="button"
                onClick={() => onUpdate(product, -1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-red-500 shadow-sm"
                aria-label="تقليل الكمية"
              >
                <Minus size={13} />
              </button>
              <span className="w-5 text-center text-sm font-black text-gray-900">{qty}</span>
              <button
                type="button"
                onClick={() => onUpdate(product, 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white"
                aria-label="زيادة الكمية"
              >
                <Plus size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default memo(GroceryProductCard);

function GrocerySkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="aspect-square animate-pulse bg-gray-100" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-4/5 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
        <div className="flex justify-between pt-2">
          <div className="h-5 w-16 animate-pulse rounded bg-gray-100" />
          <div className="h-9 w-9 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

export const GroceryProductSkeleton = memo(GrocerySkeletonCard);
