import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StoreProductsView from '../components/StoreProductsView';
import { Search, MapPin, ShoppingCart, Star, Clock, ChevronLeft, Bell, ArrowRight, ChevronRight, Package, Zap, Tag } from 'lucide-react';
import CustomerBottomNav from '../components/CustomerBottomNav';
import usePullToRefresh from '../hooks/usePullToRefresh.jsx';
import { base44 } from '@/api/base44Client';
import WafarMap, { customerIcon, storeIcon, DISTRICT_COORDS } from '../components/WafarMap';
import { Marker, Popup } from 'react-leaflet';

const DISTRICTS = ['الجنادرية', 'الشروق', 'المعالي', 'النظيم', 'غصون'];

const QUICK_CATS = [
  { icon: '💧', label: 'مياه ومشروبات', color: '#DBEAFE', iconBg: '#EFF6FF' },
  { icon: '🥛', label: 'ألبان ومنتجاتها', color: '#DBEAFE', iconBg: '#EFF6FF' },
  { icon: '🍞', label: 'خبز ومخبوزات', color: '#FEF3C7', iconBg: '#FFFBEB' },
  { icon: '🛒', label: 'مواد غذائية', color: '#D1FAE5', iconBg: '#ECFDF5' },
  { icon: '🧹', label: 'منظفات', color: '#FCE7F3', iconBg: '#FDF2F8' },
  { icon: '🥩', label: 'لحوم ودواجن', color: '#FEE2E2', iconBg: '#FEF2F2' },
  { icon: '🧴', label: 'عناية شخصية', color: '#E0E7FF', iconBg: '#EEF2FF' },
  { icon: '🍫', label: 'سناكس', color: '#FEF3C7', iconBg: '#FFFBEB' },
];

export default function CustomerHome() {
  const navigate = useNavigate();
  const { storeId } = useParams();
  const [customer] = useState(() => JSON.parse(localStorage.getItem('wafarCustomer') || '{"name":"زائر","phone":"","district":"الجنادرية"}'));
  const [selectedDistrict, setSelectedDistrict] = useState(customer.district || 'الجنادرية');
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('wafarCart') || '[]'));
  const [loading, setLoading] = useState(true);
  const [cachedData, setCachedData] = useState(() => {
    // Load cached data from sessionStorage
    const cached = sessionStorage.getItem('wafarHomeData');
    return cached ? JSON.parse(cached) : { stores: {}, products: {} };
  });

  const [userPos, setUserPos] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const { containerProps, PullIndicator } = usePullToRefresh(loadStores);

  useEffect(() => { loadStores(); }, [selectedDistrict]);
  useEffect(() => { 
    if (selectedStore) {
      // Check cache first
      const cacheKey = `${selectedStore.id}_${selectedDistrict}`;
      if (cachedData.products[cacheKey]) {
        setProducts(cachedData.products[cacheKey]);
        setLoading(false);
      } else {
        loadProducts(selectedStore.id);
      }
    }
  }, [selectedStore]);

  useEffect(() => {
    if (!storeId && selectedStore) { setSelectedStore(null); setProducts([]); }
  }, [storeId]);

  useEffect(() => {
    if (storeId && !selectedStore) {
      base44.entities.Store.get(storeId).then(store => { if (store) setSelectedStore(store); });
    }
  }, [storeId, selectedStore]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => setLocationError(true)
    );
  }, []);

  async function loadStores() {
    // Check cache first
    if (cachedData.stores[selectedDistrict]) {
      setStores(cachedData.stores[selectedDistrict]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const data = await base44.entities.Store.filter({ district: selectedDistrict, is_approved: true });
    setStores(data);
    // Cache stores
    const newCached = { ...cachedData, stores: { ...cachedData.stores, [selectedDistrict]: data } };
    setCachedData(newCached);
    sessionStorage.setItem('wafarHomeData', JSON.stringify(newCached));
    setLoading(false);
  }

  async function loadProducts(sid) {
    setLoading(true);
    const data = await base44.entities.Product.filter({ store_id: sid, is_available: true });
    setProducts(data);
    // Cache products
    const cacheKey = `${sid}_${selectedDistrict}`;
    const newCached = { ...cachedData, products: { ...cachedData.products, [cacheKey]: data } };
    setCachedData(newCached);
    sessionStorage.setItem('wafarHomeData', JSON.stringify(newCached));
    setLoading(false);
  }

  const addToCart = (product) => {
    const c = JSON.parse(localStorage.getItem('wafarCustomer') || '{}');
    if (!c.phone) { navigate('/login?returnUrl=/home'); return; }
    const newCart = [...cart];
    const idx = newCart.findIndex(i => i.productId === product.id && i.storeId === product.store_id);
    if (idx >= 0) { newCart[idx].quantity++; }
    else { newCart.push({ productId: product.id, productName: product.name, storeId: product.store_id, storeName: selectedStore?.name, quantity: 1, price: product.price, unit: product.unit || 'حبة', category: product.category }); }
    setCart(newCart);
    localStorage.setItem('wafarCart', JSON.stringify(newCart));
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const getDeliveryFee = (km) => km < 2 ? 6.99 : km < 5 ? 9.99 : 12.99;
  const getEstTime = (store) => (store.prep_time_minutes || 15) + Math.round((store.distance_km || 1.5) * 5);

  return (
    <div dir="rtl" className="min-h-screen pb-24" style={{ background: '#0D0D1A', fontFamily: "'Cairo', 'Tajawal', sans-serif" }} {...containerProps}>
      <PullIndicator />

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3 bg-white"
        style={{ borderBottom: '1px solid #F1F5F9', boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>

        {selectedStore ? (
          /* Store sub-header */
          <div className="flex items-center gap-2.5">
            <button onClick={() => { navigate('/home'); setSearchQuery(''); }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
              style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
              <ArrowRight size={18} style={{ color: '#2563EB' }} />
            </button>
            <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl"
              style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}>
              <Search size={15} style={{ color: '#94A3B8' }} />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder={`ابحث في ${selectedStore.name}...`}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: '#111827' }} />
            </div>
            <button onClick={() => navigate('/cart')} className="relative w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
              <ShoppingCart size={18} style={{ color: '#2563EB' }} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full text-xs font-black flex items-center justify-center text-white"
                  style={{ background: '#2563EB', boxShadow: '0 2px 8px rgba(37,99,235,0.45)' }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        ) : (
          /* Home header */
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                  <span className="text-white font-black text-base">و</span>
                </div>
                <div>
                  <p className="text-xs leading-none mb-0.5" style={{ color: '#94A3B8' }}>مرحباً 👋</p>
                  <p className="font-bold text-sm leading-none" style={{ color: '#111827' }}>{customer.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate('/cart')} className="relative w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <ShoppingCart size={17} style={{ color: '#2563EB' }} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full text-xs font-black flex items-center justify-center text-white"
                      style={{ background: '#2563EB', fontSize: '10px' }}>
                      {cartCount}
                    </span>
                  )}
                </button>
                <button className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <Bell size={17} style={{ color: '#2563EB' }} />
                </button>
              </div>
            </div>

            {/* Location + search */}
            <div className="flex items-center gap-1.5 mb-3">
              <MapPin size={13} style={{ color: '#2563EB' }} />
              <span className="text-xs font-semibold" style={{ color: '#2563EB' }}>{selectedDistrict}</span>
              <span className="text-xs" style={{ color: '#94A3B8' }}>· الرياض</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl"
              style={{ background: '#F1F5F9', border: '1.5px solid #E2E8F0' }}>
              <Search size={15} style={{ color: '#94A3B8' }} />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منتج أو علامة تجارية..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: '#111827' }} />
            </div>

            {/* District pills */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-0.5 scrollbar-hide">
              {DISTRICTS.map(d => (
                <button key={d} onClick={() => setSelectedDistrict(d)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all active:scale-95"
                  style={d === selectedDistrict
                    ? { background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', color: '#fff', boxShadow: '0 2px 10px rgba(37,99,235,0.35)' }
                    : { background: '#F1F5F9', color: '#6B7280', border: '1px solid #E2E8F0' }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── STORE VIEW ── */}
      {selectedStore ? (
        <div className="px-4 pt-4">
          {/* Store info card */}
          <div className="rounded-2xl p-4 mb-5 bg-white"
            style={{ border: '1.5px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>🏪</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h2 className="font-black text-base truncate" style={{ color: '#111827' }}>{selectedStore.name}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-semibold"
                    style={{ background: '#D1FAE5', color: '#059669' }}>● مفتوح</span>
                </div>
                <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: '#6B7280' }}>
                  <span className="flex items-center gap-0.5">
                    <Star size={10} fill="#F59E0B" style={{ color: '#F59E0B' }} />
                    {selectedStore.rating_avg?.toFixed(1) || '4.5'}
                  </span>
                  <span style={{ color: '#D1D5DB' }}>·</span>
                  <span className="flex items-center gap-0.5"><Clock size={10} />{selectedStore.prep_time_minutes || 15} د</span>
                  <span style={{ color: '#D1D5DB' }}>·</span>
                  <span className="flex items-center gap-0.5"><MapPin size={10} />{selectedStore.distance_km || 1.5} كم</span>
                </div>
                <div className="mt-2">
                  <span className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                    style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                    🚚 توصيل {getDeliveryFee(selectedStore.distance_km || 1.5)} ر
                  </span>
                </div>
              </div>
            </div>
          </div>

          <StoreProductsView
            products={products}
            loading={loading}
            cart={cart}
            onAddToCart={addToCart}
            searchQuery={searchQuery}
          />
        </div>
      ) : (
        <div>
          {/* ── HERO ── */}
          <div className="px-4 pt-4">
            <div className="relative overflow-hidden rounded-3xl"
              style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #3B82F6 100%)', minHeight: '140px', boxShadow: '0 8px 32px rgba(37,99,235,0.35)' }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="absolute top-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(-50%,-50%)' }} />
              <div className="relative p-5">
                <p className="text-blue-200 text-xs font-semibold mb-1">وفر · Wafar</p>
                <h1 className="text-white font-black text-2xl mb-1">موصل الحي 🏘️</h1>
                <p className="text-blue-100 text-sm">مطاعم · بقالة · توصيل سريع</p>
              </div>
              <div className="absolute left-4 bottom-3 text-7xl opacity-10 select-none">🛵</div>
            </div>
          </div>

          {/* ── 3 SERVICES ── */}
          <div className="px-4 mt-5">
            <h3 className="font-bold text-base mb-3" style={{ color: '#111827' }}>اختر الخدمة</h3>
            <div className="grid grid-cols-1 gap-3">

              {/* مطاعم */}
              <button onClick={() => navigate('/restaurants')}
                className="w-full text-right rounded-3xl p-5 transition-all active:scale-98 overflow-hidden relative"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 6px 24px rgba(245,158,11,0.35)' }}>
                <div className="absolute -left-4 -bottom-4 text-8xl opacity-20 select-none">🍽️</div>
                <div className="relative">
                  <p className="text-white font-black text-xl mb-1">مطاعم قريبة</p>
                  <p className="text-amber-100 text-sm">وجبات جاهزة · توصيل سريع</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>اطلب الآن ←</div>
                </div>
              </button>

              {/* بقالة */}
              <button onClick={() => navigate('/grocery')}
                className="w-full text-right rounded-3xl p-5 transition-all active:scale-98 overflow-hidden relative"
                style={{ background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', boxShadow: '0 6px 24px rgba(37,99,235,0.35)' }}>
                <div className="absolute -left-4 -bottom-4 text-8xl opacity-20 select-none">🛒</div>
                <div className="relative">
                  <p className="text-white font-black text-xl mb-1">بقالة وفر</p>
                  <p className="text-blue-100 text-sm">أسعار مقارنة · توصيل ذكي</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>تسوق الآن ←</div>
                </div>
              </button>

              {/* طلب سريع */}
              <button onClick={() => navigate('/fast-delivery')}
                className="w-full text-right rounded-3xl p-5 overflow-hidden relative transition-all active:scale-98"
                style={{ background: 'linear-gradient(135deg, #1F2937, #111827)', border: '1.5px solid rgba(96,165,250,0.3)', boxShadow: '0 6px 24px rgba(37,99,235,0.2)' }}>
                <div className="absolute -left-4 -bottom-4 text-8xl opacity-15 select-none">⚡</div>
                <div className="relative">
                  <p className="text-white font-black text-xl mb-1">طلب سريع</p>
                  <p className="text-blue-300 text-sm">توصيل أي شيء داخل الحي</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(96,165,250,0.2)', color: '#60A5FA' }}>اطلب الآن ←</div>
                </div>
              </button>

            </div>
          </div>


          <div className="h-6" />
        </div>
      )}

      {/* ── FLOATING CART ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <button onClick={() => navigate('/cart')}
            className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-between px-5 transition-all active:scale-98"
            style={{ background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', boxShadow: '0 8px 28px rgba(37,99,235,0.5)' }}>
            <span className="flex items-center gap-2 text-sm">
              <ShoppingCart size={17} />
              {cartCount} منتج
            </span>
            <span className="text-sm font-black">عرض السلة ←</span>
          </button>
        </div>
      )}

      <CustomerBottomNav active="home" />
    </div>
  );
}