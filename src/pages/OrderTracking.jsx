import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, Star, Package, Clock, MapPin, CheckCircle2, Bike, Store, ShoppingBag, Gift, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import {
  getOrderByIdOrNumber,
  getLatestOrderByCustomerPhone,
  subscribeToOrderByIdOrNumber,
} from '@/lib/ordersService';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const driverIcon = L.divIcon({
  html: `<div style="width:40px;height:40px;background:linear-gradient(135deg,#7C3AED,#9F5FF1);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 20px rgba(124,58,237,0.8);border:2px solid rgba(255,255,255,0.3)">🛵</div>`,
  className: '', iconSize: [40, 40], iconAnchor: [20, 20],
});
const customerIcon = L.divIcon({
  html: `<div style="width:36px;height:36px;background:linear-gradient(135deg,#6EE7B7,#059669);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 16px rgba(110,231,183,0.7);border:2px solid rgba(255,255,255,0.3)">🏠</div>`,
  className: '', iconSize: [36, 36], iconAnchor: [18, 18],
});
const storeTrackIcon = L.divIcon({
  html: `<div style="width:36px;height:36px;background:linear-gradient(135deg,#1D4ED8,#3B82F6);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 16px rgba(37,99,235,0.6);border:2px solid rgba(255,255,255,0.3)">🏪</div>`,
  className: '', iconSize: [36, 36], iconAnchor: [18, 18],
});

const DISTRICT_COORDS = {
  'الجنادرية': [24.7800, 46.8800],
  'الشروق': [24.8200, 46.8200],
  'المعالي': [24.7600, 46.7800],
  'النظيم': [24.7900, 46.8500],
  'غصون': [24.8100, 46.7900],
};

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 14, { animate: true }); }, [center]);
  return null;
}

const getStatusSteps = (orderType) => {
  if (orderType === 'restaurant') {
    return [
      { key: 'pending', label: 'بانتظار مندوب', icon: Store, color: '#FCD34D', desc: 'جاري البحث عن مندوب قريب لاستلام طلبك' },
      { key: 'accepted_by_driver', label: 'تم تعيين مندوب', icon: Bike, color: '#60A5FA', desc: 'تم تعيين مندوب لشراء الطلب من المطعم' },
      { key: 'picked_up', label: 'في الطريق للمطعم', icon: Store, color: '#9F5FF1', desc: 'المندوب متجه للمطعم' },
      { key: 'on_the_way', label: 'تم شراء الطلب', icon: Package, color: '#F59E0B', desc: 'تم شراء طلبك والمندوب في الطريق إليك' },
      { key: 'delivered', label: 'تم التسليم', icon: Gift, color: '#34D399', desc: 'تم تسليم الطلب بنجاح 🎉' },
    ];
  }
  if (orderType === 'fast_delivery') {
    return [
      { key: 'pending', label: 'بانتظار القبول', icon: Store, color: '#FCD34D', desc: 'جاري معالجة طلبك بسرعة' },
      { key: 'preparing', label: 'يُجهّز', icon: Package, color: '#9F5FF1', desc: 'جاري تنفيذ طلبك بسرعة' },
      { key: 'on_the_way', label: 'في الطريق إليك', icon: Bike, color: '#9F5FF1', desc: 'المندوب قادم نحوك' },
      { key: 'delivered', label: 'تم التسليم', icon: Gift, color: '#34D399', desc: 'تم تسليم طلبك 🎉' },
    ];
  }
  return [
    { key: 'pending', label: 'بانتظار القبول', icon: Store, color: '#FCD34D', desc: 'جاري مراجعة طلبك من البقالة' },
    { key: 'accepted_by_store', label: 'تم القبول', icon: CheckCircle2, color: '#60A5FA', desc: 'تم قبول طلبك من البقالة' },
    { key: 'preparing', label: 'يُجهّز', icon: Package, color: '#9F5FF1', desc: 'يتم تجهيز مشترياتك الآن' },
    { key: 'ready_for_pickup', label: 'جاهز للاستلام', icon: Package, color: '#6EE7B7', desc: 'طلبك جاهز — ننتظر المندوب' },
    { key: 'on_the_way', label: 'في الطريق إليك', icon: Bike, color: '#9F5FF1', desc: 'المندوب قادم نحوك' },
    { key: 'delivered', label: 'تم التسليم', icon: Gift, color: '#34D399', desc: 'استمتع بمشترياتك! 🎉' },
  ];
};

const getStatusStepMap = (orderType) => {
  if (orderType === 'restaurant') {
    return {
      available_for_driver: 'pending',
      pending: 'pending',
      driver_assigned: 'accepted_by_driver',
      accepted_by_driver: 'accepted_by_driver',
      accepted_by_store: 'pending',
      assigned_to_driver: 'accepted_by_driver',
      preparing: 'accepted_by_driver',
      ready_for_pickup: 'accepted_by_driver',
      picked_up: 'picked_up',
      on_the_way: 'on_the_way',
    };
  }
  if (orderType === 'fast_delivery') {
    return {
      available_for_driver: 'pending',
      pending: 'pending',
      driver_assigned: 'preparing',
      accepted_by_driver: 'preparing',
      picked_up: 'on_the_way',
      on_the_way: 'on_the_way',
      delivered: 'delivered',
    };
  }
  return {
    available_for_driver: 'pending',
    pending: 'pending',
    accepted_by_store: 'accepted_by_store',
    preparing: 'preparing',
    ready_for_pickup: 'ready_for_pickup',
    driver_assigned: 'ready_for_pickup',
    accepted_by_driver: 'ready_for_pickup',
    assigned_to_driver: 'ready_for_pickup',
    picked_up: 'on_the_way',
    on_the_way: 'on_the_way',
    delivered: 'delivered',
  };
};

export default function OrderTracking() {
  const { orderId: urlOrderId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [rating, setRating] = useState({ store: 0, driver: 0, comment: '', submitted: false });
  const [driverPos, setDriverPos] = useState(null);
  const [customerPos, setCustomerPos] = useState(null);

  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 5000;

  // Get orderId/order_number from multiple sources
  const getOrderId = () => {
    if (urlOrderId) return urlOrderId;
    const localId = localStorage.getItem('currentOrderId');
    if (localId) return localId;
    const sessionId = sessionStorage.getItem('currentOrderId');
    if (sessionId) return sessionId;
    // Fallback: lastOrder stored after checkout
    try {
      const last = JSON.parse(localStorage.getItem('lastOrder') || 'null');
      if (last?.order_number) return last.order_number;
    } catch {}
    return null;
  };

  const getCustomerPhone = () => {
    try {
      const last = JSON.parse(localStorage.getItem('lastOrder') || 'null');
      if (last?.phone) return last.phone;
      const c = JSON.parse(localStorage.getItem('wafarCustomer') || 'null');
      return c?.phone || null;
    } catch { return null; }
  };

  const initPositions = (o) => {
    const base = DISTRICT_COORDS[o.district] || [24.7136, 46.6753];
    setCustomerPos(base);
    setDriverPos([base[0] + 0.015, base[1] - 0.01]);
  };

  const updateDriverPos = (o) => {
    const base = DISTRICT_COORDS[o.district] || [24.7136, 46.6753];
    if (['accepted_by_driver', 'driver_assigned', 'assigned_to_driver'].includes(o.status)) {
      setDriverPos([base[0] + 0.012, base[1] - 0.008]);
    } else if (o.status === 'on_the_way' || o.status === 'picked_up') {
      setDriverPos([base[0] + 0.008, base[1] - 0.005]);
    } else if (o.status === 'delivered') {
      setDriverPos([...base]);
    }
  };

  const applyOrder = (o) => {
    setOrder(o);
    initPositions(o);
    if (o.cart_items) {
      try { setCartItems(JSON.parse(o.cart_items)); } catch {}
    }
    setLoading(false);
    setLoadError(false);
  };

  const applyOrderUpdate = (updated) => {
    if (!updated) return;
    setOrder(updated);
    setCustomerPos((prev) => prev ?? (DISTRICT_COORDS[updated.district] || [24.7136, 46.6753]));
    updateDriverPos(updated);
    if (updated.cart_items) {
      try { setCartItems(JSON.parse(updated.cart_items)); } catch {}
    }
  };

  const fetchOrder = async (id) => {
    try {
      const o = await getOrderByIdOrNumber(id);
      if (o) {
        window.history.replaceState(null, '', `/track/${o.order_number}`);
        applyOrder(o);
        return true;
      }
    } catch {}
    return false;
  };

  const findLatestOrder = async (customerPhone) => {
    try {
      return await getLatestOrderByCustomerPhone(customerPhone);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const initTracking = async () => {
      const actualOrderId = getOrderId();
      let found = false;

      if (actualOrderId) {
        found = await fetchOrder(actualOrderId);
      }

      if (!found) {
        const phone = getCustomerPhone();
        if (phone) {
          const latestOrder = await findLatestOrder(phone);
          if (latestOrder) {
            window.history.replaceState(null, '', `/track/${latestOrder.order_number}`);
            applyOrder(latestOrder);
          } else {
            setLoadError(true);
            setLoading(false);
          }
        } else {
          setLoadError(true);
          setLoading(false);
        }
      }
    };

    const timeout = setTimeout(() => {
      setLoading(prev => { if (prev) { setLoadError(true); return false; } return prev; });
    }, 8000);

    initTracking().finally(() => clearTimeout(timeout));

    return () => clearTimeout(timeout);
  }, [urlOrderId, retryCount]);

  // Realtime — subscribe by Firestore id or order_number from URL/storage
  useEffect(() => {
    const trackKey = urlOrderId || getOrderId();
    if (!trackKey) return;

    const unsubscribe = subscribeToOrderByIdOrNumber(trackKey, (updated) => {
      if (!updated) return;
      applyOrderUpdate(updated);
      setLoading(false);
      setLoadError(false);
      if (updated.order_number) {
        window.history.replaceState(null, '', `/track/${updated.order_number}`);
      }
    });

    return () => unsubscribe();
  }, [urlOrderId, retryCount]);

  const handleRetry = async () => {
    setLoadError(false);
    setLoading(true);
    setRetryCount(prev => prev + 1);
    const actualOrderId = getOrderId();
    if (actualOrderId) {
      const found = await fetchOrder(actualOrderId);
      if (!found) {
        const phone = getCustomerPhone();
        if (phone) {
          const latest = await findLatestOrder(phone);
          if (latest) applyOrder(latest);
          else { setLoadError(true); setLoading(false); }
        } else {
          setLoadError(true); setLoading(false);
        }
      }
    } else {
      setLoadError(true); setLoading(false);
    }
  };

  const statusSteps = order ? getStatusSteps(order.order_type || 'grocery') : getStatusSteps('grocery');
  const stepMap = order ? getStatusStepMap(order.order_type || 'grocery') : {};
  const mappedStatus = (order && stepMap[order.status]) || order?.status;
  const currentStepIdx = order ? Math.max(0, statusSteps.findIndex(s => s.key === mappedStatus)) : 0;
  const currentStep = statusSteps[currentStepIdx] || statusSteps[0];

  const submitRating = async () => {
    const ratingData = {
      order_id: order.id,
      customer_phone: order.customer_phone,
      store_id: order.store_id,
      driver_id: order.driver_id,
      store_rating: rating.store,
      driver_rating: rating.driver,
      comment: rating.comment,
      created_date: new Date().toISOString(),
    };
    try {
      localStorage.setItem(`wafarRating_${order.id}`, JSON.stringify(ratingData));
    } catch {
      /* ignore storage errors */
    }
    setRating(r => ({ ...r, submitted: true }));
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D1A' }}>
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-purple-900" />
            <div className="absolute inset-0 rounded-full border-4 border-t-purple-400 animate-spin" />
            <div className="absolute inset-2 rounded-full flex items-center justify-center text-2xl">🛵</div>
          </div>
          <p className="text-gray-400 text-sm">جاري تحميل طلبك...</p>
          <p className="text-gray-600 text-xs">قد يستغرق بضع ثوانٍ</p>
        </div>
      </div>
    );
  }

  if (loadError || !order) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D1A' }}>
        <div className="text-center space-y-4 max-w-sm px-4">
          <div className="text-5xl mb-2">⚠️</div>
          <p className="text-gray-400 text-lg font-bold">تعذر تحميل الطلب</p>
          <p className="text-gray-600 text-sm">يرجى التحقق من رقم الطلب أو المحاولة لاحقا</p>
          
          <div className="flex gap-3 justify-center mt-4">
            <button onClick={handleRetry} className="px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2" style={{ background: '#7C3AED', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
              <RefreshCw size={16} />
              إعادة المحاولة
            </button>
            <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl text-white font-bold" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mapCenter = customerPos || [24.7136, 46.6753];
  const showDriver = ['driver_assigned','accepted_by_driver','picked_up','on_the_way','delivered'].includes(order.status);

  return (
    <div dir="rtl" className="min-h-screen pb-10" style={{ background: '#0D0D1A' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3" style={{ background: 'rgba(13,13,26,0.96)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-base">تتبع الطلب</h1>
            <p className="text-gray-500 text-xs">#{order.order_number} · {order.store_name}</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.25)' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#6EE7B7' }} />
            <span className="text-xs font-semibold" style={{ color: '#6EE7B7' }}>مباشر</span>
          </div>
        </div>
      </div>

      {/* Status Hero */}
      <div className="mx-4 mt-4 rounded-3xl p-5 text-center" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(159,95,241,0.08))', border: '1px solid rgba(124,58,237,0.3)' }}>
        <div className="text-5xl mb-3">
          {order.status === 'delivered' ? '🎉' : order.order_type === 'restaurant' ? (order.status === 'pending' ? '🔍' : ['assigned_to_driver','accepted_by_driver'].includes(order.status) ? '🛵' : order.status === 'picked_up' ? '🍽️' : '🚀') : (order.status === 'preparing' ? '📦' : ['ready_for_pickup','accepted_by_driver','picked_up'].includes(order.status) ? '🛵' : order.status === 'on_the_way' ? '🚀' : '🏪')}
        </div>
        <h2 className="text-white font-black text-xl mb-1">{currentStep.label}</h2>
        <p className="text-gray-400 text-sm">{currentStep.desc}</p>
        {order.estimated_minutes && order.status !== 'delivered' && order.status !== 'cancelled' && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full" style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <Clock size={13} style={{ color: '#9F5FF1' }} />
            <span className="text-sm font-semibold" style={{ color: '#9F5FF1' }}>الوصول خلال ~{order.estimated_minutes} دقيقة</span>
          </div>
        )}
      </div>

      {/* Progress Steps */}
      <div className="mx-4 mt-4 rounded-3xl overflow-hidden py-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.15)' }}>
        <StatusBar currentIdx={currentStepIdx} steps={statusSteps} />
      </div>

      {/* Live Map */}
      <div className="mx-4 mt-4 rounded-3xl overflow-hidden relative" style={{ height: '220px', border: '1px solid rgba(124,58,237,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <MapUpdater center={mapCenter} />
          {customerPos && <Marker position={customerPos} icon={customerIcon}><Popup>🏠 موقعك</Popup></Marker>}
          {showDriver && driverPos && <Marker position={driverPos} icon={driverIcon}><Popup>🛵 المندوب</Popup></Marker>}
          {order?.store_lat && order?.store_lng && (
            <Marker position={[order.store_lat, order.store_lng]} icon={storeTrackIcon}><Popup>{order.store_name}</Popup></Marker>
          )}
        </MapContainer>
        <div className="absolute bottom-3 right-3 z-[1000] px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5" style={{ background: 'rgba(13,13,26,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(124,58,237,0.3)', color: '#9F5FF1' }}>
          <MapPin size={11} />
          {showDriver ? 'المندوب على الخريطة' : 'موقعك'}
        </div>
      </div>

      {/* Driver Card */}
      {order.driver_name && (
        <div className="mx-4 mt-4 p-4 rounded-3xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 relative" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(159,95,241,0.1))', border: '1px solid rgba(124,58,237,0.3)' }}>
              🛵
              <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-green-400 border-2" style={{ borderColor: '#0D0D1A' }} />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">{order.driver_name}</p>
              <p className="text-gray-500 text-xs">مندوب التوصيل</p>
              <div className="flex items-center gap-1 mt-0.5">
                {[1,2,3,4,5].map(s => <Star key={s} size={10} fill={s <= 5 ? '#FCD34D' : 'none'} style={{ color: '#FCD34D' }} />)}
                <span className="text-gray-400 text-xs mr-1">5.0</span>
              </div>
            </div>
            <button className="p-3 rounded-2xl flex flex-col items-center gap-0.5" style={{ background: 'rgba(110,231,183,0.12)', border: '1px solid rgba(110,231,183,0.25)' }}>
              <Phone size={20} style={{ color: '#6EE7B7' }} />
              <span className="text-xs" style={{ color: '#6EE7B7' }}>اتصال</span>
            </button>
          </div>
        </div>
      )}

      {/* Order Items */}
      {cartItems.length > 0 && (
        <div className="mx-4 mt-4 rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <div className="px-4 pt-4 pb-2 flex items-center gap-2">
            <ShoppingBag size={16} style={{ color: '#9F5FF1' }} />
            <h3 className="text-white font-bold text-sm">المنتجات ({cartItems.length})</h3>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(124,58,237,0.08)' }}>
            {cartItems.map((item, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(124,58,237,0.1)' }}>🛒</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.productName}</p>
                  <p className="text-gray-500 text-xs">{item.price} ريال × {item.quantity} {item.unit || 'حبة'}</p>
                </div>
                <span className="font-bold text-sm flex-shrink-0" style={{ color: '#9F5FF1' }}>{(item.price * item.quantity).toFixed(2)} ر</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div className="mx-4 mt-4 p-4 rounded-3xl space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.15)' }}>
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <Sparkles size={15} style={{ color: '#9F5FF1' }} /> ملخص الفاتورة
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">قيمة المنتجات</span>
            <span className="text-white">{order.items_total?.toFixed(2)} ريال</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">رسوم التوصيل</span>
            <span className="text-white">{order.delivery_fee?.toFixed(2)} ريال</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">طريقة الدفع</span>
            <span className="text-white">{order.payment_method === 'wallet' ? '💛 محفظة' : '💵 كاش عند الاستلام'}</span>
          </div>
          {order.savings_amount > 0 && (
            <div className="flex justify-between items-center p-2 rounded-xl" style={{ background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.2)' }}>
              <span className="font-semibold flex items-center gap-1" style={{ color: '#6EE7B7' }}>💰 وفرت مع وفر</span>
              <span className="font-black" style={{ color: '#6EE7B7' }}>-{Number(order.savings_amount).toFixed(2)} ريال</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
            <span className="text-white font-bold text-base">الإجمالي</span>
            <span className="font-black text-xl" style={{ color: '#9F5FF1' }}>{order.total_amount?.toFixed(2)} <span className="text-sm">ريال</span></span>
          </div>
        </div>
      </div>

      {/* Rating */}
      {order.status === 'delivered' && !rating.submitted && (
        <div className="mx-4 mt-4 p-5 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(159,95,241,0.08))', border: '1px solid rgba(124,58,237,0.3)' }}>
          <div className="text-center mb-4">
            <div className="text-4xl mb-1">⭐</div>
            <h3 className="text-white font-black text-lg">كيف كانت تجربتك؟</h3>
            <p className="text-gray-400 text-xs mt-1">رأيك يساعدنا نتحسن</p>
          </div>
          <div className="space-y-4">
            {[{ label: order.order_type === 'restaurant' ? 'تقييم الخدمة' : 'تقييم البقالة', key: 'store', emoji: order.order_type === 'restaurant' ? '🍽️' : '🏪' }, { label: 'تقييم المندوب', key: 'driver', emoji: '🛵' }].map(({ label, key, emoji }) => (
              <div key={key} className="text-center">
                <p className="text-gray-300 text-sm mb-2">{emoji} {label}</p>
                <div className="flex gap-3 justify-center">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setRating(r => ({ ...r, [key]: s }))} className="transition-all duration-200" style={{ transform: s <= rating[key] ? 'scale(1.2)' : 'scale(1)' }}>
                      <Star size={30} fill={s <= rating[key] ? '#FCD34D' : 'none'} style={{ color: '#FCD34D', filter: s <= rating[key] ? 'drop-shadow(0 0 6px rgba(252,211,77,0.6))' : 'none' }} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <textarea value={rating.comment} onChange={e => setRating(r => ({ ...r, comment: e.target.value }))}
              placeholder="أضف تعليقا (اختياري)..." rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(124,58,237,0.2)' }} />
            <button onClick={submitRating} disabled={!rating.store || !rating.driver}
              className="w-full py-3.5 rounded-2xl text-white font-bold transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>
              إرسال التقييم ✨
            </button>
          </div>
        </div>
      )}
      {rating.submitted && (
        <div className="mx-4 mt-4 p-5 rounded-3xl text-center" style={{ background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.2)' }}>
          <div className="text-4xl mb-2">🙏</div>
          <p className="text-green-400 font-bold text-lg">شكرا على تقييمك!</p>
          <p className="text-gray-400 text-sm mt-1">رأيك يساعدنا دائما</p>
        </div>
      )}
      <div className="h-6" />
    </div>
  );
}

function StatusBar({ currentIdx, steps }) {
  const STATUS_STEPS = steps;
  return (
    <div className="relative px-4 py-2">
      <div className="absolute top-[30px] right-[32px] left-[32px] h-0.5" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="absolute top-[30px] right-[32px] h-0.5 transition-all duration-1000"
        style={{ background: 'linear-gradient(90deg, #7C3AED, #9F5FF1)', width: currentIdx === 0 ? '0%' : `${(currentIdx / (STATUS_STEPS.length - 1)) * 100}%`, boxShadow: '0 0 8px rgba(124,58,237,0.6)', left: 'auto', right: '32px' }} />
      <div className="flex justify-between relative z-10">
        {STATUS_STEPS.map((step, i) => {
          const Icon = step.icon;
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step.key} className="flex flex-col items-center gap-1" style={{ width: `${100 / STATUS_STEPS.length}%` }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-700"
                style={active
                  ? { background: `linear-gradient(135deg, #7C3AED, ${step.color})`, boxShadow: `0 0 20px rgba(124,58,237,0.7)`, border: '2px solid rgba(255,255,255,0.3)' }
                  : done
                    ? { background: `rgba(110,231,183,0.15)`, border: `2px solid ${step.color}` }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Icon size={16} style={{ color: done ? step.color : '#4B5563' }} />
              </div>
              <span className="text-center" style={{ fontSize: '9px', color: active ? '#fff' : done ? step.color : '#4B5563', lineHeight: '1.2', maxWidth: '48px' }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}