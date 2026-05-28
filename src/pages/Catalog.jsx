import { useState, useEffect, useMemo } from 'react';
import MobileHeader from '../components/MobileHeader';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Star, Package, Plus, ChevronDown } from 'lucide-react';
import BottomSheet from '../components/BottomSheet';
import { base44 } from '@/api/base44Client';

const CATEGORIES = [
  { key: 'all', label: 'الكل', emoji: '🛒' },
  { key: 'خضروات', label: 'خضروات', emoji: '🥬' },
  { key: 'مياه ومشروبات', label: 'مياه ومشروبات', emoji: '💧' },
  { key: 'ألبان ومنتجات', label: 'ألبان', emoji: '🥛' },
  { key: 'مخبوزات', label: 'مخبوزات', emoji: '🍞' },
  { key: 'سناكس وشوكولاتة', label: 'سناكس', emoji: '🍫' },
  { key: 'أرز وأساسيات', label: 'أساسيات', emoji: '🌾' },
  { key: 'أطعمة جاهزة', label: 'أطعمة جاهزة', emoji: '🍜' },
  { key: 'منتجات مجمدة', label: 'مجمدات', emoji: '🧊' },
  { key: 'منظفات', label: 'منظفات', emoji: '🧹' },
  { key: 'عناية شخصية', label: 'عناية شخصية', emoji: '🧴' },
  { key: 'منتجات الأطفال', label: 'الأطفال', emoji: '👶' },
];

const CATEGORY_EMOJIS = {
  'خضروات': '🥬',
  'مياه ومشروبات': '💧',
  'ألبان ومنتجات': '🥛',
  'مخبوزات': '🍞',
  'سناكس وشوكولاتة': '🍫',
  'أرز وأساسيات': '🌾',
  'أطعمة جاهزة': '🍜',
  'منتجات مجمدة': '🧊',
  'منظفات': '🧹',
  'عناية شخصية': '🧴',
  'منتجات الأطفال': '👶',
};

const glass = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '16px' };

export default function Catalog() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', brand: '', size: '', category: 'مياه ومشروبات', unit_type: 'حبة', barcode: '', is_popular: false });
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [unitSheetOpen, setUnitSheetOpen] = useState(false);
  const UNIT_TYPES = ['علبة', 'زجاجة', 'كيس', 'علبة كرتون', 'حبة', 'رول', 'قطعة', 'كيلو', 'منديل'];

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await base44.entities.CatalogProduct.list('-created_date', 1000);
    setProducts(data);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== 'all') list = list.filter(p => p.category === activeCategory);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.size?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, activeCategory, search]);

  const popular = useMemo(() => products.filter(p => p.is_popular).slice(0, 10), [products]);

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.brand) return;
    await base44.entities.CatalogProduct.create({ ...newProduct, is_active: true });
    setNewProduct({ name: '', brand: '', size: '', category: 'مياه ومشروبات', unit_type: 'حبة', barcode: '', is_popular: false });
    setShowAddForm(false);
    loadProducts();
  };

  const togglePopular = async (product) => {
    await base44.entities.CatalogProduct.update(product.id, { is_popular: !product.is_popular });
    loadProducts();
  };

  const totalByCategory = useMemo(() => {
    const map = {};
    products.forEach(p => { map[p.category] = (map[p.category] || 0) + 1; });
    return map;
  }, [products]);

  return (
    <div dir="rtl" className="min-h-screen pb-8" style={{ background: '#0D0D1A' }}>
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3" style={{ background: 'rgba(13,13,26,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
        <div className="mb-3">
          <MobileHeader
            title="كتالوج المنتجات"
            subtitle={`${products.length} منتج · موحّد لجميع البقالات`}
            rightContent={
              <button
                onClick={() => setShowAddForm(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)', boxShadow: '0 4px 14px rgba(124,58,237,0.4)' }}
              >
                <Plus size={14} />إضافة
              </button>
            }
          />
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الماركة أو الحجم..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl text-white text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
              style={activeCategory === cat.key
                ? { background: '#7C3AED', color: '#fff' }
                : { background: 'rgba(255,255,255,0.07)', color: '#9CA3AF' }}>
              {cat.emoji} {cat.label}
              {cat.key !== 'all' && totalByCategory[cat.key] > 0 && (
                <span className="text-xs opacity-70">({totalByCategory[cat.key]})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 relative z-10 space-y-5">

        {/* Add Form */}
        {showAddForm && (
          <div style={glass} className="p-4 space-y-3">
            <h3 className="text-white font-bold text-sm">➕ منتج جديد</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className="text-gray-500 text-xs block mb-1">اسم المنتج (عربي) *</label>
                <input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="مثال: مياه نوفا" className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
              </div>
              <div>
                <label className="text-gray-500 text-xs block mb-1">الماركة *</label>
                <input value={newProduct.brand} onChange={e => setNewProduct(p => ({ ...p, brand: e.target.value }))} placeholder="نوفا" className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
              </div>
              <div>
                <label className="text-gray-500 text-xs block mb-1">الحجم / الوزن</label>
                <input value={newProduct.size} onChange={e => setNewProduct(p => ({ ...p, size: e.target.value }))} placeholder="330 مل" className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
              </div>
              <div>
                <label className="text-gray-500 text-xs block mb-1">الفئة</label>
                <button onClick={() => setCategorySheetOpen(true)} className="w-full px-3 py-2.5 rounded-xl text-white text-sm flex items-center justify-between" style={{ background: 'rgba(13,13,26,0.9)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <span>{CATEGORIES.find(c => c.key === newProduct.category)?.label || newProduct.category}</span>
                  <ChevronDown size={14} className="text-gray-500" />
                </button>
                <BottomSheet open={categorySheetOpen} onClose={() => setCategorySheetOpen(false)} title="اختر الفئة"
                  options={CATEGORIES.filter(c => c.key !== 'all').map(c => ({ value: c.key, label: `${c.emoji} ${c.label}` }))}
                  value={newProduct.category} onChange={v => setNewProduct(p => ({ ...p, category: v }))} />
              </div>
              <div>
                <label className="text-gray-500 text-xs block mb-1">نوع الوحدة</label>
                <button onClick={() => setUnitSheetOpen(true)} className="w-full px-3 py-2.5 rounded-xl text-white text-sm flex items-center justify-between" style={{ background: 'rgba(13,13,26,0.9)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <span>{newProduct.unit_type}</span>
                  <ChevronDown size={14} className="text-gray-500" />
                </button>
                <BottomSheet open={unitSheetOpen} onClose={() => setUnitSheetOpen(false)} title="نوع الوحدة"
                  options={UNIT_TYPES} value={newProduct.unit_type} onChange={v => setNewProduct(p => ({ ...p, unit_type: v }))} />
              </div>
              <div className="col-span-2">
                <label className="text-gray-500 text-xs block mb-1">الباركود (اختياري)</label>
                <input value={newProduct.barcode} onChange={e => setNewProduct(p => ({ ...p, barcode: e.target.value }))} placeholder="6281001456893" className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
              </div>
              <div className="col-span-2 flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <input type="checkbox" checked={newProduct.is_popular} onChange={e => setNewProduct(p => ({ ...p, is_popular: e.target.checked }))} id="is_popular" className="w-4 h-4 accent-purple-500" />
                <label htmlFor="is_popular" className="text-gray-300 text-sm">⭐ منتج رائج</label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowAddForm(false)} className="py-2.5 rounded-xl text-gray-400 text-sm" style={{ background: 'rgba(255,255,255,0.05)' }}>إلغاء</button>
              <button onClick={addProduct} disabled={!newProduct.name || !newProduct.brand} className="py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)' }}>حفظ المنتج</button>
            </div>
          </div>
        )}

        {/* Popular Products */}
        {popular.length > 0 && !search && activeCategory === 'all' && (
          <div>
            <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <Star size={14} style={{ color: '#FCD34D' }} /> المنتجات الرائجة
              <span className="text-gray-600 text-xs font-normal">({popular.length})</span>
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {popular.map(p => (
                <div key={p.id} className="flex-shrink-0 w-32 p-3 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, rgba(252,211,77,0.1), rgba(245,158,11,0.05))', border: '1px solid rgba(252,211,77,0.2)' }}>
                  <div className="text-3xl mb-1">{CATEGORY_EMOJIS[p.category] || '🛒'}</div>
                  <p className="text-white text-xs font-bold leading-tight truncate">{p.name}</p>
                  {p.size && <p className="text-yellow-400 text-xs mt-0.5">{p.size}</p>}
                  <p className="text-gray-600 text-xs">{p.brand}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {!search && activeCategory === 'all' && (
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.filter(c => c.key !== 'all' && totalByCategory[c.key] > 0).map(cat => (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
                className="flex items-center gap-3 p-3 rounded-xl text-right transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-2xl">{cat.emoji}</span>
                <div>
                  <p className="text-white text-sm font-bold">{totalByCategory[cat.key]}</p>
                  <p className="text-gray-500 text-xs">{cat.label}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Product List */}
        {(search || activeCategory !== 'all') && (
          <div>
            <p className="text-gray-500 text-xs mb-3">{filtered.length} نتيجة</p>
            <div className="space-y-2">
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                ))
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-gray-600">
                  <Package size={40} className="mx-auto mb-3 text-gray-700" />
                  <p>لا توجد منتجات</p>
                </div>
              ) : filtered.map(product => (
                <ProductRow key={product.id} product={product} onTogglePopular={togglePopular} />
              ))}
            </div>
          </div>
        )}

        {/* Show all when no filter */}
        {!search && activeCategory === 'all' && !loading && products.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-white font-bold text-sm mb-3">جميع المنتجات</h2>
            {products.map(product => (
              <ProductRow key={product.id} product={product} onTogglePopular={togglePopular} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductRow({ product, onTogglePopular }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
        style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.15)' }}>
        {CATEGORY_EMOJIS[product.category] || '🛒'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{product.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-gray-500 text-xs">{product.brand}</span>
          {product.size && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.15)', color: '#C4B5FD' }}>{product.size}</span>}
          <span className="text-xs text-gray-700">{product.unit_type}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: '#6B7280' }}>{product.category}</span>
        <button onClick={() => onTogglePopular(product)} className="text-xs px-1.5 py-0.5 rounded-full transition-all"
          style={product.is_popular ? { background: 'rgba(252,211,77,0.15)', color: '#FCD34D' } : { color: '#4B5563' }}>
          {product.is_popular ? '⭐' : '☆'}
        </button>
      </div>
    </div>
  );
}