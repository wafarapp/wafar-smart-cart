import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, ArrowRight, MapPin, Clock, Sparkles, ChevronLeft } from 'lucide-react';
import CustomerBottomNav from '../components/CustomerBottomNav';
import GroceryProductCard, { GroceryProductSkeleton } from '../components/grocery/GroceryProductCard';
import { GROCERY_CATEGORIES } from '@/constants/groceryCategories';
import { DEMO_GROCERY_PRODUCTS } from '@/constants/demoGroceryProducts';
import { useGroceryProducts } from '@/hooks/useGroceryProducts';
import { getProductPrice, formatSAR } from '@/lib/format';

const STORE_ID = 'wafar_grocery';
const STORE_NAME = 'بقالة وفر';

function readCustomer() {
  try {
    return JSON.parse(localStorage.getItem('wafarCustomer') || '{"name":"زائر","phone":"","district":"الجنادرية"}');
  } catch {
    return { name: 'زائر', phone: '', district: 'الجنادرية' };
  }
}

function readCart() {
  try {
    return JSON.parse(localStorage.getItem('wafarCart') || '[]');
  } catch {
    return [];
  }
}

export default function Grocery() {
  const navigate = useNavigate();
  const customer = useMemo(() => readCustomer(), []);
  const { data: catalogProducts = [], isLoading: loading, isFetching } = useGroceryProducts();

  const products = useMemo(() => {
    const list =
      Array.isArray(catalogProducts) && catalogProducts.length > 0
        ? catalogProducts
        : DEMO_GROCERY_PRODUCTS;
    return list.filter((p) => p.is_active !== false && p.is_available !== false);
  }, [catalogProducts]);

  const [search, setSearch] = useState(() => sessionStorage.getItem('wafarGrocerySearch') || '');
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState(readCart);

  useEffect(() => {
    sessionStorage.removeItem('wafarGrocerySearch');
  }, []);

  const popularProducts = useMemo(
    () => products.filter((p) => p.is_popular).slice(0, 8),
    [products]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat =
        activeCategory === 'all' ||
        p.category === activeCategory ||
        p.category?.includes(activeCategory);
      const matchSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, activeCategory, search]);

  const getQty = useCallback(
    (id) => {
      const item = cart.find((i) => i.productId === id);
      return item ? item.quantity : 0;
    },
    [cart]
  );

  const updateCart = useCallback(
    (product, delta) => {
      if (delta > 0 && !customer.phone) {
        navigate('/login?returnUrl=/grocery');
        return;
      }
      const { current } = getProductPrice(product);
      setCart((prev) => {
        const newCart = [...prev];
        const idx = newCart.findIndex((i) => i.productId === product.id);
        if (idx >= 0) {
          newCart[idx].quantity += delta;
          if (newCart[idx].quantity <= 0) newCart.splice(idx, 1);
        } else if (delta > 0) {
          newCart.push({
            productId: product.id,
            productName: product.name,
            storeName: STORE_NAME,
            storeId: STORE_ID,
            quantity: 1,
            price: current,
            unit: product.unit_type || 'حبة',
            category: product.category,
            image_url: product.image_url,
            brand: product.brand,
          });
        }
        localStorage.setItem('wafarCart', JSON.stringify(newCart));
        return newCart;
      });
    },
    [customer.phone, navigate]
  );

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
  const cartTotalLabel = formatSAR(cartTotal);

  return (
    <div
      dir="rtl"
      className="page-light min-h-screen bg-[#F8FAFC] pb-32 font-[Cairo,Tajawal,sans-serif]"
    >
      <div className="mx-auto max-w-lg">
        {/* Sticky header */}
        <header className="sticky top-0 z-30 border-b border-emerald-100/80 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90">
          <div className="px-4 pt-3 pb-2">
            <div className="mb-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 transition-colors active:bg-emerald-100"
                aria-label="العودة للرئيسية"
              >
                <ArrowRight size={18} className="text-emerald-700" />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-500 text-sm font-black text-white shadow-md shadow-emerald-200">
                    و
                  </div>
                  <div className="min-w-0">
                    <h1 className="truncate text-lg font-black leading-tight text-emerald-950">{STORE_NAME}</h1>
                    <p className="text-[11px] font-medium text-gray-500">منتجات طازجة · توصيل من الحي</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-600 shadow-md shadow-emerald-200"
                aria-label="السلة"
              >
                <ShoppingCart size={18} className="text-white" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -end-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-black text-emerald-950">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            {/* Location + ETA */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <button type="button" className="flex min-w-0 items-center gap-1.5 text-start">
                <MapPin size={14} className="flex-shrink-0 text-emerald-600" />
                <span className="truncate text-xs font-bold text-emerald-900">
                  التوصيل إلى <span className="text-emerald-700">{customer.district || 'الجنادرية'}</span>
                </span>
              </button>
              <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                <Clock size={11} />
                ~٣٠ دقيقة
              </span>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 rounded-2xl border-2 border-emerald-100 bg-gray-50 px-3.5 py-2.5 focus-within:border-emerald-400 focus-within:bg-white transition-colors">
              <Search size={16} className="flex-shrink-0 text-emerald-500" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن منتج أو ماركة..."
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="scroll-smooth-touch flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
            {GROCERY_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95 ${
                  activeCategory === cat.key
                    ? 'bg-gradient-to-l from-emerald-700 to-emerald-500 text-white shadow-md shadow-emerald-200'
                    : 'border border-gray-200 bg-white text-gray-600'
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </header>

        <main className="px-4 pt-4">
          {/* Popular rail */}
          {!loading && popularProducts.length > 0 && activeCategory === 'all' && !search.trim() && (
            <section className="mb-5">
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-sm font-black text-gray-900">
                  <Sparkles size={14} className="text-amber-500" />
                  الأكثر طلباً
                </h2>
              </div>
              <div className="scroll-smooth-touch -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 scrollbar-hide">
                {popularProducts.map((p) => {
                  const qty = getQty(p.id);
                  const { current } = getProductPrice(p);
                  const price = formatSAR(current);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => updateCart(p, 1)}
                      className="w-28 flex-shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white text-start shadow-sm transition-transform active:scale-[0.98]"
                    >
                      <div className="flex h-20 items-center justify-center bg-gradient-to-b from-emerald-50 to-white text-3xl">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          GROCERY_CATEGORIES.find((c) => c.key === p.category)?.emoji || '🛒'
                        )}
                      </div>
                      <div className="p-2">
                        <p className="line-clamp-2 text-[10px] font-bold leading-tight text-gray-900">{p.name}</p>
                        {price && (
                          <p className="mt-1 text-xs font-black text-emerald-700">{price} ر.س</p>
                        )}
                        {qty > 0 && (
                          <p className="mt-0.5 text-[10px] font-bold text-emerald-600">{qty} في السلة</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Products grid */}
          {loading && isFetching && products.length === 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <GroceryProductSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="text-5xl">🔍</div>
              <div className="text-center">
                <p className="font-bold text-gray-900">لا توجد منتجات</p>
                <p className="mt-1 text-sm text-gray-500">جرب تغيير الفئة أو كلمة البحث</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setActiveCategory('all');
                }}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
              >
                عرض الكل
              </button>
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs font-semibold text-gray-500">
                {filtered.length} منتج
                {activeCategory !== 'all' &&
                  ` · ${GROCERY_CATEGORIES.find((c) => c.key === activeCategory)?.label}`}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
                {filtered.map((product) => (
                  <GroceryProductCard
                    key={product.id}
                    product={product}
                    qty={getQty(product.id)}
                    onUpdate={updateCart}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Cart CTA */}
      {cartCount > 0 && (
        <div className="fixed bottom-[4.75rem] start-4 end-4 z-40 mx-auto max-w-lg">
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-gradient-to-l from-emerald-800 to-emerald-600 px-5 py-3.5 text-white shadow-xl shadow-emerald-200/60 transition-transform active:scale-[0.99]"
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <span className="flex h-7 min-w-[28px] items-center justify-center rounded-lg bg-white/20 px-2 text-xs font-black">
                {cartCount}
              </span>
              <ShoppingCart size={17} />
              عرض السلة
            </span>
            <span className="flex items-center gap-1 text-sm font-black">
              {cartTotalLabel ? `${cartTotalLabel} ر.س` : 'متابعة'}
              <ChevronLeft size={16} />
            </span>
          </button>
        </div>
      )}

      <CustomerBottomNav active="home" />
    </div>
  );
}
