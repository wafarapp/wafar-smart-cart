import { useRef, useState, useMemo } from 'react';
import { Plus, Check, Heart } from 'lucide-react';

const CATEGORY_ICONS = {
  'خضروات وفواكه': '🥦',
  'ألبان وأجبان': '🥛',
  'لحوم ودواجن': '🥩',
  'مشروبات': '🧃',
  'معلبات': '🥫',
  'مخبوزات': '🍞',
  'وجبات جاهزة': '🍔',
  'منظفات': '🧹',
  'أخرى': '🛒',
};

const CATEGORY_ORDER = ['خضروات وفواكه', 'ألبان وأجبان', 'لحوم ودواجن', 'مشروبات', 'معلبات', 'مخبوزات', 'وجبات جاهزة', 'منظفات', 'أخرى'];

function ProductCard({ product, inCart, onAdd }) {
  const [imgError, setImgError] = useState(false);
  const [liked, setLiked] = useState(false);
  const emoji = CATEGORY_ICONS[product.category] || '🛒';

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col bg-white transition-all active:scale-97"
      style={{ border: '1.5px solid #F1F5F9', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

      {/* Image */}
      <div className="relative" style={{ paddingBottom: '80%' }}>
        <div className="absolute inset-0">
          {product.image_url && !imgError ? (
            <img src={product.image_url} alt={product.name} onError={() => setImgError(true)}
              className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl"
              style={{ background: 'linear-gradient(135deg, #EFF6FF, #F0F9FF)' }}>
              {emoji}
            </div>
          )}
        </div>
        {/* Fav button */}
        <button onClick={() => setLiked(l => !l)}
          className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm"
          style={{ background: 'rgba(255,255,255,0.92)' }}>
          <Heart size={13} fill={liked ? '#EF4444' : 'none'} style={{ color: liked ? '#EF4444' : '#94A3B8' }} />
        </button>
        {/* Offer badge */}
        {product.offer_price && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-lg text-xs font-black shadow-sm"
            style={{ background: '#EF4444', color: '#fff' }}>خصم</div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1 gap-1">
        <p className="text-xs font-medium leading-none" style={{ color: '#94A3B8' }}>{product.category}</p>
        <p className="text-sm font-bold leading-snug line-clamp-2 min-h-[36px]" style={{ color: '#111827' }}>{product.name}</p>
        <p className="text-xs" style={{ color: '#CBD5E1' }}>{product.unit || 'حبة'}</p>

        <div className="flex items-center justify-between mt-auto pt-2 gap-1">
          <div>
            {product.offer_price ? (
              <div>
                <span className="text-xs line-through block" style={{ color: '#9CA3AF' }}>{product.price} ر</span>
                <span className="font-black text-base" style={{ color: '#059669' }}>{product.offer_price} ر</span>
              </div>
            ) : (
              <span className="font-black text-base" style={{ color: '#2563EB' }}>
                {product.price} <span className="text-xs font-normal" style={{ color: '#94A3B8' }}>ر</span>
              </span>
            )}
          </div>
          <button onClick={() => onAdd(product)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-85 flex-shrink-0"
            style={inCart
              ? { background: 'linear-gradient(135deg, #059669, #10B981)', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }
              : { background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', boxShadow: '0 4px 12px rgba(37,99,235,0.4)' }
            }>
            {inCart ? <Check size={15} className="text-white" /> : <Plus size={15} className="text-white" />}
          </button>
        </div>
        {inCart && (
          <p className="text-xs font-semibold" style={{ color: '#059669' }}>✓ {inCart.quantity} في السلة</p>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white animate-pulse"
      style={{ border: '1px solid #F1F5F9' }}>
      <div style={{ paddingBottom: '80%', background: '#F8FAFC' }} />
      <div className="p-3 space-y-2">
        <div className="h-2 rounded-full w-1/3" style={{ background: '#F1F5F9' }} />
        <div className="h-3.5 rounded-full w-4/5" style={{ background: '#F1F5F9' }} />
        <div className="h-3 rounded-full w-1/2" style={{ background: '#F1F5F9' }} />
        <div className="flex items-center justify-between mt-3">
          <div className="h-5 w-14 rounded-lg" style={{ background: '#EFF6FF' }} />
          <div className="w-9 h-9 rounded-xl" style={{ background: '#EFF6FF' }} />
        </div>
      </div>
    </div>
  );
}

export default function StoreProductsView({ products, loading, cart, onAddToCart, searchQuery = '' }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const sectionRefs = useRef({});
  const tabsRef = useRef(null);

  const grouped = useMemo(() => {
    let list = products;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(p => p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }
    const map = {};
    list.forEach(p => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    const sorted = {};
    CATEGORY_ORDER.forEach(cat => { if (map[cat]) sorted[cat] = map[cat]; });
    Object.keys(map).forEach(cat => { if (!sorted[cat]) sorted[cat] = map[cat]; });
    return sorted;
  }, [products, searchQuery]);

  const categories = Object.keys(grouped);
  const currentActive = activeCategory || categories[0];

  const scrollToCategory = (cat) => {
    setActiveCategory(cat);
    const el = sectionRefs.current[cat];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const tabBtn = tabsRef.current?.querySelector(`[data-cat="${cat}"]`);
    if (tabBtn) tabBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  if (loading) {
    return (
      <div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-9 w-24 rounded-xl flex-shrink-0 animate-pulse" style={{ background: '#F1F5F9' }} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 gap-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
          style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>🛒</div>
        <div className="text-center">
          <p className="font-bold mb-1" style={{ color: '#111827' }}>لا توجد منتجات حالياً</p>
          <p className="text-sm" style={{ color: '#6B7280' }}>لم يتم إضافة منتجات لهذه البقالة بعد</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Category tabs */}
      <div ref={tabsRef}
        className="sticky z-20 flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-hide mb-4 bg-white"
        style={{ top: 0 }}>
        {categories.map(cat => (
          <button key={cat} data-cat={cat} onClick={() => scrollToCategory(cat)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
            style={currentActive === cat
              ? { background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', color: '#fff', boxShadow: '0 2px 10px rgba(37,99,235,0.3)' }
              : { background: '#F8FAFC', color: '#6B7280', border: '1px solid #E2E8F0' }
            }>
            <span>{CATEGORY_ICONS[cat] || '🛒'}</span>
            <span>{cat}</span>
          </button>
        ))}
      </div>

      <div className="space-y-8 pb-4">
        {categories.map(cat => (
          <div key={cat} ref={el => { sectionRefs.current[cat] = el; }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
                style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                {CATEGORY_ICONS[cat] || '🛒'}
              </div>
              <h3 className="font-bold text-sm flex-1" style={{ color: '#111827' }}>{cat}</h3>
              <span className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
                {grouped[cat].length} منتج
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {grouped[cat].map(product => {
                const inCart = cart.find(i => i.productId === product.id);
                return <ProductCard key={product.id} product={product} inCart={inCart} onAdd={onAddToCart} />;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}