import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, Plus, Check, X, ChevronRight, ChevronDown } from 'lucide-react';
import usePullToRefresh from '../hooks/usePullToRefresh.jsx';
import BottomSheet from '../components/BottomSheet';
import { base44 } from '@/api/base44Client';
import WafarMap, { storeIcon, DISTRICT_COORDS } from '../components/WafarMap';
import { Marker, Popup } from 'react-leaflet';

const glass = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: '16px' };
const STATUS_AR = { pending: 'جديد', accepted_by_store: 'مقبول', preparing: 'يُجهز', ready_for_pickup: 'جاهز للاستلام', assigned_to_driver: 'تم تعيين مندوب', accepted_by_driver: 'المندوب قادم', picked_up: 'الطلب مع المندوب', on_the_way: 'في الطريق', delivered: 'مسلّم', cancelled: 'ملغي' };
const STATUS_COLOR = { pending: '#FCD34D', accepted_by_store: '#60A5FA', preparing: '#9F5FF1', ready_for_pickup: '#6EE7B7', assigned_to_driver: '#F59E0B', accepted_by_driver: '#F59E0B', picked_up: '#A78BFA', on_the_way: '#34D399', delivered: '#10B981', cancelled: '#F87171' };
const CATEGORIES = ['خضروات وفواكه', 'ألبان وأجبان', 'لحوم ودواجن', 'مخبوزات', 'مشروبات', 'معلبات', 'منظفات', 'وجبات جاهزة', 'أخرى'];

export default function StoreDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('orders');
  const [store, setStore] = useState(() => {
    const s = localStorage.getItem('wafarStore');
    return s ? JSON.parse(s) : null;
  });
  const [storeName, setStoreName] = useState('');
  const [storePassword, setStorePassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: 'أخرى', price: '', unit: 'حبة', stock_quantity: 100 });
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null); // { type: 'success'|'error', text }
  const { containerProps, PullIndicator } = usePullToRefresh(loadData);

  useEffect(() => {
    if (store) loadData();
  }, [store]);

  // Realtime subscription — new orders appear instantly
  useEffect(() => {
    if (!store) return;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    const unsub = base44.entities.Order.subscribe((event) => {
      if (event.type === 'create' && event.data?.store_id === store?.id) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🛒 طلب جديد!', { body: `قيمة الطلب: ${event.data.total_amount?.toFixed(2)} ريال` });
        }
      }
      loadData();
    });
    return () => unsub();
  }, [store?.id]);

  async function loadData() {
    setLoading(true);
    const [prods, ords] = await Promise.all([
    base44.entities.Product.filter({ store_id: store.id }),
    base44.entities.Order.filter({ store_id: store.id })]
    );
    setProducts(prods);
    setOrders(ords.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('wafarStore');
    setStore(null);
  };

  const saveStoreLocation = async (latlng) => {
    const updated = { ...store, lat: latlng.lat, lng: latlng.lng };
    await base44.entities.Store.update(store.id, { lat: latlng.lat, lng: latlng.lng });
    localStorage.setItem('wafarStore', JSON.stringify(updated));
    setStore(updated);
  };

  const loginStore = async () => {
    if (!storeName || !storePassword) return;
    setLoginError('');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('verifyStorePassword', { storeName: storeName.trim(), password: storePassword });
      if (res.data?.success) {
        localStorage.setItem('wafarStore', JSON.stringify(res.data.store));
        setStore(res.data.store);
      } else {
        setLoginError(res.data?.error || 'حدث خطأ، حاول مجدداً');
      }
    } catch {
      setLoginError('حدث خطأ في الاتصال، حاول مجدداً');
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async () => {
    if (!newProduct.name?.trim()) { setSaveMsg({ type: 'error', text: 'يرجى إدخال اسم المنتج' }); return; }
    if (!newProduct.category) { setSaveMsg({ type: 'error', text: 'يرجى اختيار الفئة' }); return; }
    if (!newProduct.price || parseFloat(newProduct.price) <= 0) { setSaveMsg({ type: 'error', text: 'يرجى إدخال سعر صحيح' }); return; }
    if (!newProduct.stock_quantity || parseInt(newProduct.stock_quantity) < 0) { setSaveMsg({ type: 'error', text: 'يرجى إدخال الكمية' }); return; }
    if (!store?.id) { setSaveMsg({ type: 'error', text: 'خطأ: لا يوجد متجر محدد' }); return; }
    setSaveMsg(null);
    setLoading(true);
    try {
      const created = await base44.entities.Product.create({
        name: newProduct.name.trim(),
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        unit: newProduct.unit || 'حبة',
        stock_quantity: parseInt(newProduct.stock_quantity) || 100,
        store_id: store.id,
        store_name: store.name,
        is_available: true,
      });
      setProducts((prev) => [created, ...prev]);
      setNewProduct({ name: '', category: 'أخرى', price: '', unit: 'حبة', stock_quantity: 100 });
      setShowAddProduct(false);
      setSaveMsg({ type: 'success', text: 'تم حفظ المنتج بنجاح ✅' });
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err) {
      setSaveMsg({ type: 'error', text: `فشل الحفظ: ${err.message || 'خطأ غير معروف'}` });
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = async (p) => {
    // Optimistic update
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, is_available: !p.is_available } : x));
    await base44.entities.Product.update(p.id, { is_available: !p.is_available });
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    await base44.entities.Order.update(orderId, { status: newStatus });
    loadData();
  };

  const todayOrders = orders.filter((o) => new Date(o.created_date).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + (o.items_total || 0), 0);

  if (!store) return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#0D0D1A' }}>
      <div className="w-full max-w-sm">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-gray-500 mb-6"><ChevronRight size={16} /><span className="text-sm">رجوع</span></button>
        <div className="text-center mb-8"><div className="text-5xl mb-2">🏪</div><h1 className="text-3xl font-black text-white mb-1">لوحة البقالة</h1><p className="text-gray-500 text-sm">وفر · إدارة متجرك</p></div>
        <div style={glass} className="p-6 space-y-4">
          <input value={storeName} onChange={(e) => {setStoreName(e.target.value);setLoginError('');}} placeholder="اسم البقالة كما سجلته الإدارة" className="w-full px-4 py-3 rounded-xl text-white text-right outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
          <input value={storePassword} onChange={(e) => {setStorePassword(e.target.value);setLoginError('');}} placeholder="كلمة المرور (من الإدارة)" type="password" className="w-full px-4 py-3 rounded-xl text-white text-right outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
          {loginError && <p className="text-xs text-center py-2 px-3 rounded-xl" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}>{loginError}</p>}
          <button onClick={loginStore} disabled={loading || !storeName || !storePassword} className="w-full py-3.5 rounded-xl text-white font-bold disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}>{loading ? 'جاري التحقق...' : 'دخول'}</button>
          <p className="text-center text-xs text-gray-600">لا تملك حساباً؟{' '}<button onClick={() => navigate('/store-register')} className="underline" style={{ color: '#9F5FF1' }}>سجّل بقالتك</button></p>
        </div>
      </div>
    </div>);


  return (
    <div dir="rtl" className="min-h-screen pb-8 bg-background relative" {...containerProps}>
      <PullIndicator />
      <div className="px-4 pt-4 pb-3" style={{ background: 'rgba(13,13,26,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button onClick={logout} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
            <div className="text-2xl">🏪</div>
            <div><p className="text-white font-bold text-sm">{store?.name}</p><p className="text-gray-500 text-xs">{store?.district} · لوحة التحكم</p></div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>مفتوح</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(252,211,77,0.1)', border: '1px solid rgba(252,211,77,0.15)' }}><p className="font-black text-sm" style={{ color: '#FCD34D' }}>{todayRevenue.toFixed(0)} ر</p><p className="text-gray-500">اليوم</p></div>
          <div className="p-2 rounded-xl" style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.15)' }}><p className="font-black text-sm" style={{ color: '#60A5FA' }}>{todayOrders.length}</p><p className="text-gray-500">طلب اليوم</p></div>
          <div className="p-2 rounded-xl" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.15)' }}><p className="font-black text-sm" style={{ color: '#9F5FF1' }}>{products.length}</p><p className="text-gray-500">منتج</p></div>
        </div>
        <div className="flex gap-2 mt-3">
          {[['orders', 'الطلبات 📋'], ['products', 'المنتجات 📦'], ['location', 'الموقع 📍'], ['analytics', 'إحصائيات 📊']].map(([k, l]) =>
          <button key={k} onClick={() => k === 'analytics' ? navigate('/store-analytics') : setTab(k)} className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
          style={tab === k && k !== 'analytics' ? { background: '#7C3AED', color: '#fff' } : { background: 'rgba(255,255,255,0.07)', color: '#9CA3AF' }}>{l}</button>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">
        {tab === 'orders' &&
        <div className="space-y-3">
            {orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').concat(orders.filter((o) => o.status === 'delivered' || o.status === 'cancelled').slice(0, 5)).map((order) =>
          <div key={order.id} style={glass} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-bold text-sm">#{order.order_number}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${STATUS_COLOR[order.status]}22`, color: STATUS_COLOR[order.status], border: `1px solid ${STATUS_COLOR[order.status]}44` }}>{STATUS_AR[order.status]}</span>
                </div>
                <div className="text-gray-400 text-xs space-y-1 mb-3">
                  <p>📱 {order.customer_phone}</p>
                  <p>💰 {order.total_amount?.toFixed(2)} ريال · {order.delivery_mode === 'cheapest' ? '💸 الأرخص' : order.delivery_mode === 'fastest' ? '⚡ الأسرع' : '📍 الأقرب'}</p>
                  <p>🕐 {new Date(order.created_date).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                {order.status === 'pending' &&
            <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="py-2 rounded-xl text-xs font-bold" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}>رفض</button>
                    <button onClick={() => updateOrderStatus(order.id, 'accepted_by_store')} className="py-2 rounded-xl text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)' }}>قبول الطلب</button>
                  </div>
            }
                {order.status === 'accepted_by_store' &&
            <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="w-full py-2 rounded-xl text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>بدء التجهيز</button>
            }
                {order.status === 'preparing' &&
            <button onClick={() => updateOrderStatus(order.id, 'ready_for_pickup')} className="w-full py-2 rounded-xl text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>جاهز للاستلام</button>
            }
              </div>
          )}
            {orders.length === 0 && <div className="py-12 text-center text-gray-600"><ShoppingBag size={36} className="mx-auto mb-3 text-gray-700" /><p>لا توجد طلبات بعد</p></div>}
          </div>
        }

        {tab === 'products' &&
        <div>
            <button onClick={() => setShowAddProduct(true)} className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 mb-4" style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
              <Plus size={18} />إضافة منتج جديد
            </button>
            {showAddProduct &&
          <div style={glass} className="p-4 mb-4 space-y-3">
                <h3 className="text-white font-bold text-sm mb-2">منتج جديد</h3>
                <input value={newProduct.name} onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} placeholder="اسم المنتج" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-[hsl(var(--foreground))]" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
                <button onClick={() => setCategorySheetOpen(true)} className="w-full px-3 py-2.5 rounded-xl text-white text-sm flex items-center justify-between" style={{ background: 'rgba(13,13,26,0.9)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <span>{newProduct.category}</span>
                  <ChevronDown size={14} className="text-gray-500" />
                </button>
                <BottomSheet open={categorySheetOpen} onClose={() => setCategorySheetOpen(false)} title="اختر الفئة" options={CATEGORIES} value={newProduct.category} onChange={(v) => setNewProduct((p) => ({ ...p, category: v }))} />
                <div className="grid grid-cols-2 gap-2">
                  <input value={newProduct.price} onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))} placeholder="السعر" type="number" className="px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
                  <input value={newProduct.unit} onChange={(e) => setNewProduct((p) => ({ ...p, unit: e.target.value }))} placeholder="الوحدة" className="px-3 py-2.5 rounded-xl text-sm outline-none bg-[hsl(var(--background))] text-[hsl(var(--foreground))]" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
                </div>
                {saveMsg && (
                  <p className="text-xs text-center py-2 px-3 rounded-xl"
                    style={saveMsg.type === 'success'
                      ? { background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }
                      : { background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                    {saveMsg.text}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setShowAddProduct(false); setSaveMsg(null); }} className="py-2.5 rounded-xl text-gray-400 text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>إلغاء</button>
                  <button onClick={addProduct} disabled={loading} className="py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)' }}>{loading ? 'جاري الحفظ...' : 'حفظ'}</button>
                </div>
              </div>
          }
            <div className="space-y-2">
              {products.map((p) =>
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl" style={glass}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'rgba(124,58,237,0.15)' }}>🛒</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{p.name}</p>
                    <p className="text-gray-500 text-xs">{p.category} · {p.unit}</p>
                  </div>
                  <span className="font-bold text-sm" style={{ color: '#9F5FF1' }}>{p.price} ر</span>
                  <button onClick={() => toggleProduct(p)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={p.is_available ? { background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)' } : { background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.2)' }}>
                    {p.is_available ? <Check size={14} style={{ color: '#10B981' }} /> : <X size={14} style={{ color: '#F87171' }} />}
                  </button>
                </div>
            )}
              {products.length === 0 && <div className="py-12 text-center text-gray-600"><Package size={36} className="mx-auto mb-3 text-gray-700" /><p>لا توجد منتجات بعد</p></div>}
            </div>
          </div>
        }

        {tab === 'location' &&
        <div className="space-y-4">
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)' }}>
              <p className="text-white font-bold text-sm mb-1">📍 موقع البقالة</p>
              <p className="text-gray-400 text-xs">انقر على الخريطة لتحديد موقع بقالتك بدقة</p>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ height: '320px', border: '1px solid rgba(124,58,237,0.25)' }}>
              <WafarMap
              center={store.lat && store.lng ? [store.lat, store.lng] : DISTRICT_COORDS[store.district] || [24.7136, 46.6753]}
              zoom={15}
              height="320px"
              dark
              onMapClick={saveStoreLocation}>
              
                {store.lat && store.lng &&
              <Marker position={[store.lat, store.lng]} icon={storeIcon}>
                    <Popup><span style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>🏪 {store.name}</span></Popup>
                  </Marker>
              }
              </WafarMap>
            </div>
            {store.lat && store.lng ?
          <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p className="text-xs font-semibold" style={{ color: '#10B981' }}>✅ تم حفظ الموقع: {store.lat?.toFixed(4)}° ، {store.lng?.toFixed(4)}°</p>
              </div> :

          <p className="text-gray-600 text-xs text-center">لم يتم تحديد الموقع بعد — انقر على الخريطة</p>
          }
          </div>
        }
      </div>
    </div>);

}