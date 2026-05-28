import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, Zap, MapPin, Clock, ChevronRight, Star, RefreshCw, Home, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createOrder, finalizeCheckout } from '@/lib/localOrders';
import {
  resolveNeighborhoodZone,
  orderZoneFields,
  OUT_OF_SERVICE_MESSAGE,
  ZONE_LABELS_AR,
} from '@/lib/neighborhoodZones';

const glass = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: '16px' };

export default function CustomerCart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('wafarCart') || '[]'));
  const [wallet, setWallet] = useState(null);
  const [stores, setStores] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [placing, setPlacing] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [showTrackBtn, setShowTrackBtn] = useState(false);
  const [checkoutSessionId, setCheckoutSessionId] = useState(null);
  const [zoneError, setZoneError] = useState('');
  const [customer] = useState(() => JSON.parse(localStorage.getItem('wafarCustomer') || '{"name":"زائر","phone":"","district":"الجنادرية"}'));

  const cartTotal = cart.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const isGroceryCart = cart.length > 0 && cart.every((i) => i.storeId === 'wafar_grocery');

  useEffect(() => {
    if (cart.length === 0) {
      setSelectedOption(null);
      return;
    }
    const groceryOnly = cart.every((i) => i.storeId === 'wafar_grocery');
    if (groceryOnly) {
      const itemsTotal = cart.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
      const zone = resolveNeighborhoodZone({
        neighborhoodName: customer.district || 'الجنادرية',
        customerLat: customer.lat,
        customerLng: customer.lng,
        fallbackDistanceKm: 1.5,
      });
      const deliveryFee = zone.is_service_available
        ? (itemsTotal > 75 ? 0 : zone.customer_delivery_fee)
        : 0;
      setSelectedOption({
        store: { id: 'wafar_grocery', name: 'بقالة وفر', rating_avg: 4.9 },
        itemsTotal,
        deliveryFee,
        total: itemsTotal + deliveryFee,
        distance: '1.0',
        estimatedTime: 30,
        mode: 'grocery',
        label: 'بقالة وفر',
        icon: '🛒',
        color: '#16A34A',
        savings: 0,
        zone,
      });
      return;
    }
    loadComparison();
  }, [cart]);
  useEffect(() => { loadWallet(); }, []);

  const loadWallet = async () => {
    if (!customer.phone) return;
    const wallets = await base44.entities.Wallet.filter({ customer_phone: customer.phone });
    if (wallets[0]) setWallet(wallets[0]);
  };

  const loadComparison = async () => {
    const allStores = await base44.entities.Store.filter({ district: customer.district, is_approved: true });
    const allProducts = await base44.entities.Product.filter({});
    
    const options = allStores.map(store => {
      let itemsTotal = 0;
      cart.forEach(cartItem => {
        const match = allProducts.find(p => p.store_id === store.id && p.name === cartItem.productName);
        itemsTotal += match ? match.price * cartItem.quantity : cartItem.price * cartItem.quantity;
      });
      const dist = store.distance_km || (Math.random() * 3 + 0.5);
      const zone = resolveNeighborhoodZone({
        neighborhoodName: customer.district || 'الجنادرية',
        customerLat: customer.lat,
        customerLng: customer.lng,
        destinationLat: store.lat,
        destinationLng: store.lng,
        fallbackDistanceKm: dist,
      });
      const fee = zone.is_service_available ? zone.customer_delivery_fee : 0;
      const prepTime = store.prep_time_minutes || 15;
      const totalTime = prepTime + Math.round(dist * 5);
      return { store, itemsTotal, deliveryFee: fee, total: itemsTotal + fee, distance: dist.toFixed(1), estimatedTime: totalTime, zone };
    });

    const sorted = [...options].sort((a, b) => a.total - b.total);
    const cheapest = sorted[0];
    const nearest = [...options].sort((a, b) => a.distance - b.distance)[0];
    const fastest = [...options].sort((a, b) => a.estimatedTime - b.estimatedTime)[0];

    const comparisons = [];
    if (cheapest) comparisons.push({ ...cheapest, mode: 'cheapest', label: 'الأرخص', icon: '💰', color: '#6EE7B7', savings: sorted.length > 1 ? (sorted[sorted.length - 1].total - cheapest.total).toFixed(1) : 0 });
    if (nearest) comparisons.push({ ...nearest, mode: 'nearest', label: 'الأقرب', icon: '📍', color: '#60A5FA', savings: 0 });
    if (fastest) comparisons.push({ ...fastest, mode: 'fastest', label: 'الأسرع', icon: '⚡', color: '#FCD34D', savings: 0 });

    setStores(allStores);
    setComparison(comparisons);
    if (comparisons.length > 0) setSelectedOption(comparisons[0]);
  };

  const updateQty = (idx, delta) => {
    const newCart = [...cart];
    newCart[idx].quantity = Math.max(0, newCart[idx].quantity + delta);
    const filtered = newCart.filter(i => i.quantity > 0);
    setCart(filtered);
    localStorage.setItem('wafarCart', JSON.stringify(filtered));
  };

  const clearCart = () => { setCart([]); localStorage.removeItem('wafarCart'); };

  useEffect(() => {
    if (!createdOrder) return;
    const t = setTimeout(() => setShowTrackBtn(true), 3000);
    return () => clearTimeout(t);
  }, [createdOrder?.id]);

  const placeOrder = async () => {
    if (!selectedOption || placing || createdOrder) return;

    if (!customer.verified || !customer.phone) {
      navigate('/login?returnUrl=/cart');
      return;
    }

    const zone =
      selectedOption.zone ||
      resolveNeighborhoodZone({
        neighborhoodName: customer.district || 'الجنادرية',
        customerLat: customer.lat,
        customerLng: customer.lng,
        fallbackDistanceKm: parseFloat(selectedOption.distance) || 1.5,
        destinationLat: selectedOption.store?.lat,
        destinationLng: selectedOption.store?.lng,
      });

    if (!zone.is_service_available) {
      setZoneError(OUT_OF_SERVICE_MESSAGE);
      return;
    }

    setZoneError('');
    const sessionId = `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCheckoutSessionId(sessionId);
    setPlacing(true);

    let orderPayload;
    try {
      const orderNum = 'WFR' + Date.now().toString().slice(-6);
      orderPayload = {
        order_number: orderNum,
        customer_phone: customer.phone,
        customer_name: customer.name,
        store_id: selectedOption.store.id,
        store_name: selectedOption.store.name,
        order_type: 'grocery',
        delivery_mode: selectedOption.mode,
        items_total: selectedOption.itemsTotal,
        delivery_fee: zone.customer_delivery_fee,
        total_amount: selectedOption.itemsTotal + zone.customer_delivery_fee,
        district: customer.district,
        ...orderZoneFields(zone),
        estimated_minutes: selectedOption.estimatedTime,
        payment_method: paymentMethod,
        savings_amount: parseFloat(selectedOption.savings) || 0,
        cart_items: JSON.stringify(cart),
        customer_lat: customer.lat || null,
        customer_lng: customer.lng || null,
        checkout_session_id: sessionId,
      };

      const { order } = await createOrder(orderPayload);
      finalizeCheckout(order, {
        phone: customer.phone,
        clearCartKey: 'wafarCart',
      });
      setCart([]);
      setCreatedOrder(order);
    } catch (err) {
      console.error('[CustomerCart] placeOrder failed:', {
        code: err?.code,
        message: err?.message,
        order_number: orderPayload?.order_number,
        error: err,
      });
      setCheckoutSessionId(null);
      alert('فشل إنشاء الطلب، يرجى المحاولة مرة أخرى');
    } finally {
      setPlacing(false);
    }
  };

  if (createdOrder) {
    return (
      <div dir="rtl" className="min-h-screen pb-20" style={{ background: '#0D0D1A' }}>
        {/* Header */}
        <div className="sticky top-0 z-30 px-4 py-4" style={{ background: 'rgba(13,13,26,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
            <h1 className="text-white font-bold text-lg">تم الطلب</h1>
          </div>
        </div>

        {/* Success Hero */}
        <div className="mx-4 mt-6 rounded-3xl p-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.08))', border: '1px solid rgba(16,185,129,0.3)' }}>
          <div className="text-6xl mb-3">✅</div>
          <h2 className="text-white font-black text-xl mb-1">تم إرسال طلبك للمندوب</h2>
          <p className="text-emerald-300 text-sm">جاري البحث عن مندوب قريب لاستلام طلبك</p>
        </div>

        {/* Order Info */}
        <div className="mx-4 mt-4 p-4 rounded-3xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">رقم الطلب</span>
            <span className="text-white font-bold">#{createdOrder.order_number}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">البقالة</span>
            <span className="text-white font-bold">{createdOrder.store_name}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">عنوان التوصيل</span>
            <span className="text-white text-sm">{createdOrder.customer_address || createdOrder.district || 'غير محدد'}</span>
          </div>
          <div className="border-t pt-3 mt-3" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">الإجمالي</span>
              <span className="font-black text-xl" style={{ color: '#9F5FF1' }}>{createdOrder.total_amount?.toFixed(2)} ريال</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">طريقة الدفع</span>
              <span className="text-white text-sm">{createdOrder.payment_method === 'wallet' ? '💛 محفظة' : '💵 كاش'}</span>
            </div>
          </div>
        </div>

        {/* Status Steps */}
        <div className="mx-4 mt-4 rounded-3xl overflow-hidden py-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.15)' }}>
            <div className="relative px-4 py-2">
              <div className="absolute top-[30px] right-[32px] left-[32px] h-0.5" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="absolute top-[30px] right-[32px] h-0.5" style={{ background: 'linear-gradient(90deg, #7C3AED, #9F5FF1)', width: '0%', boxShadow: '0 0 8px rgba(124,58,237,0.6)', left: 'auto', right: '32px' }} />
              <div className="flex justify-between relative z-10">
                {[
                  { key: 'pending', label: 'بانتظار مندوب', icon: '📦', color: '#FCD34D' },
                  { key: 'accepted', label: 'تم القبول', icon: '✅', color: '#60A5FA' },
                  { key: 'preparing', label: 'يُجهّز', icon: '🛍️', color: '#9F5FF1' },
                  { key: 'on_way', label: 'في الطريق', icon: '🛵', color: '#6EE7B7' },
                  { key: 'delivered', label: 'تم التسليم', icon: '🎉', color: '#34D399' },
                ].map((step, i) => (
                  <div key={step.key} className="flex flex-col items-center gap-1" style={{ width: '20%' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={i === 0 ? { background: `linear-gradient(135deg, #7C3AED, ${step.color})`, boxShadow: `0 0 20px rgba(124,58,237,0.7)`, border: '2px solid rgba(255,255,255,0.3)' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {step.icon}
                    </div>
                    <span className="text-center" style={{ fontSize: '9px', color: i === 0 ? '#fff' : '#4B5563', lineHeight: '1.2' }}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        {/* Action Buttons */}
        <div className="mx-4 mt-6 space-y-3">
          {showTrackBtn ? (
            <button onClick={() => navigate(`/track/${createdOrder.order_number}`)}
              className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
              <RefreshCw size={18} />
              تتبع الطلب
            </button>
          ) : (
            <div className="w-full py-4 rounded-2xl text-center text-gray-500 text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              جاري تجهيز رابط التتبع...
            </div>
          )}
          <button onClick={() => navigate('/')}
            className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Home size={18} />
            العودة للرئيسية
          </button>
        </div>

        <div className="h-6" />
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className={`min-h-screen pb-28 ${isGroceryCart ? 'page-light bg-[#F8FAFC]' : ''}`}
      style={isGroceryCart ? undefined : { background: '#0D0D1A' }}
    >
      {/* Header */}
      <div
        className={`sticky top-0 z-30 px-4 py-4 backdrop-blur-xl ${
          isGroceryCart ? 'border-b border-emerald-100 bg-white/95' : ''
        }`}
        style={
          isGroceryCart
            ? undefined
            : {
                background: 'rgba(13,13,26,0.95)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(124,58,237,0.15)',
              }
        }
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isGroceryCart ? '/grocery' : '/')}
            className={`rounded-xl p-2 ${isGroceryCart ? 'border border-emerald-100 bg-emerald-50' : ''}`}
            style={
              isGroceryCart
                ? undefined
                : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }
            }
          >
            <ChevronRight size={18} className={isGroceryCart ? 'text-emerald-700' : 'text-gray-300'} />
          </button>
          <h1
            className={`flex items-center gap-2 text-lg font-bold ${isGroceryCart ? 'text-emerald-950' : 'text-white'}`}
          >
            <ShoppingCart size={20} className={isGroceryCart ? 'text-emerald-600' : ''} style={isGroceryCart ? undefined : { color: '#9F5FF1' }} />
            سلة المشتريات
          </h1>
          {cart.length > 0 && (
            <button type="button" onClick={clearCart} className="ms-auto">
              <Trash2 size={18} className={isGroceryCart ? 'text-red-500' : ''} style={isGroceryCart ? undefined : { color: '#F87171' }} />
            </button>
          )}
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-24">
          <div className="mb-4 text-6xl">🛒</div>
          <p className="mb-6 text-base text-gray-500">سلتك فارغة</p>
          <button
            type="button"
            onClick={() => navigate('/grocery')}
            className="rounded-xl bg-gradient-to-l from-emerald-700 to-emerald-500 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-200"
          >
            تصفّح البقالة
          </button>
        </div>
      ) : (
        <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
          {/* Cart Items */}
          <div
            className={`overflow-hidden rounded-2xl ${isGroceryCart ? 'border border-gray-100 bg-white shadow-sm' : ''}`}
            style={isGroceryCart ? undefined : glass}
          >
            {cart.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 border-b p-4 ${isGroceryCart ? 'border-gray-100' : ''}`}
                style={isGroceryCart ? undefined : { borderColor: 'rgba(124,58,237,0.1)' }}
              >
                <div
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl text-xl ${
                    isGroceryCart ? 'bg-emerald-50' : ''
                  }`}
                  style={isGroceryCart ? undefined : { background: 'rgba(124,58,237,0.15)' }}
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    '🛒'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${isGroceryCart ? 'text-gray-900' : 'text-white'}`}>
                    {item.productName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.storeName} · {item.price > 0 ? `${item.price} ر.س` : '—'}/{item.unit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQty(idx, -1)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      isGroceryCart ? 'bg-red-50 text-red-500' : ''
                    }`}
                    style={
                      isGroceryCart
                        ? undefined
                        : { background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.2)' }
                    }
                  >
                    <Minus size={12} className={isGroceryCart ? '' : 'text-red-400'} />
                  </button>
                  <span className={`w-5 text-center text-sm font-bold ${isGroceryCart ? 'text-gray-900' : 'text-white'}`}>
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQty(idx, 1)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      isGroceryCart ? 'bg-emerald-600 text-white' : ''
                    }`}
                    style={
                      isGroceryCart
                        ? undefined
                        : { background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }
                    }
                  >
                    <Plus size={12} className={isGroceryCart ? 'text-white' : ''} style={isGroceryCart ? undefined : { color: '#9F5FF1' }} />
                  </button>
                </div>
                <span
                  className={`w-14 text-end text-xs font-bold ${isGroceryCart ? 'text-emerald-700' : ''}`}
                  style={isGroceryCart ? undefined : { color: '#9F5FF1' }}
                >
                  {(item.price * item.quantity).toFixed(2)} ر
                </span>
              </div>
            ))}
            <div className="flex justify-between p-4">
              <span className="text-sm text-gray-500">مجموع المنتجات ({cartCount})</span>
              <span className={`font-bold ${isGroceryCart ? 'text-emerald-800' : 'text-white'}`}>
                {cartTotal.toFixed(2)} ريال
              </span>
            </div>
          </div>

          {/* Smart Comparison — hidden for unified grocery catalog */}
          {!isGroceryCart && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-bold flex items-center gap-2">
                <Zap size={18} style={{ color: '#FCD34D' }} /> مقارنة ذكية
              </h2>
              <span className="text-gray-500 text-xs">اختر الأنسب لك</span>
            </div>
            {comparison.length === 0 ? (
              <div className="text-center py-6 text-gray-600 text-sm">جاري تحليل الأسعار...</div>
            ) : (
              <div className="space-y-2">
                {comparison.map((opt, i) => (
                  <button key={i} onClick={() => setSelectedOption(opt)}
                    className="w-full p-4 rounded-2xl text-right transition-all"
                    style={{
                      ...glass,
                      border: selectedOption?.mode === opt.mode ? `2px solid ${opt.color}` : '1px solid rgba(124,58,237,0.2)',
                      boxShadow: selectedOption?.mode === opt.mode ? `0 0 20px ${opt.color}33` : 'none'
                    }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{opt.icon}</span>
                        <div className="text-right">
                          <p className="text-white font-bold text-sm">{opt.label} · {opt.store.name}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1"><MapPin size={10} />{opt.distance} كم</span>
                            <span className="flex items-center gap-1"><Clock size={10} />{opt.estimatedTime} د</span>
                            <span className="flex items-center gap-1"><Star size={10} style={{ color: '#FCD34D' }} />{opt.store.rating_avg?.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-black text-base text-white">{opt.total.toFixed(2)} <span className="text-xs text-gray-400">ر</span></p>
                        <p className="text-xs text-gray-500">توصيل {opt.deliveryFee.toFixed(2)} ر</p>
                        {opt.savings > 0 && <p className="text-xs font-bold mt-0.5" style={{ color: '#6EE7B7' }}>وفرت {opt.savings} ر 🎉</p>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Order Summary */}
          {selectedOption && (
            <div
              className={`rounded-2xl p-4 ${isGroceryCart ? 'border border-emerald-100 bg-white shadow-sm' : ''}`}
              style={
                isGroceryCart
                  ? undefined
                  : {
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(159,95,241,0.08))',
                      border: '1px solid rgba(124,58,237,0.3)',
                    }
              }
            >
              <h3 className={`mb-3 font-bold ${isGroceryCart ? 'text-emerald-950' : 'text-white'}`}>ملخص الطلب</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">البقالة</span><span className={isGroceryCart ? 'font-semibold text-gray-900' : 'text-white'}>{selectedOption.store.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">المنتجات</span><span className={isGroceryCart ? 'text-gray-900' : 'text-white'}>{selectedOption.itemsTotal.toFixed(2)} ريال</span></div>
                <div className="flex justify-between"><span className="text-gray-500">رسوم التوصيل</span><span className={isGroceryCart ? 'text-gray-900' : 'text-white'}>{selectedOption.deliveryFee.toFixed(2)} ريال</span></div>
                {selectedOption.zone && (
                  <div className="flex justify-between"><span className="text-gray-500">منطقة التوصيل</span><span className={isGroceryCart ? 'text-gray-600 text-xs' : 'text-gray-400 text-xs'}>{ZONE_LABELS_AR[selectedOption.zone.zone_type]} · {selectedOption.zone.calculated_distance_km} كم</span></div>
                )}
                <div className="flex justify-between"><span className="text-gray-500">وقت الوصول</span><span className={isGroceryCart ? 'text-gray-900' : 'text-white'}>~{selectedOption.estimatedTime} دقيقة</span></div>
                <div className="flex justify-between items-center">
            <span className="text-gray-400">طريقة الدفع</span>
            <div className="flex gap-2">
              <button onClick={() => setPaymentMethod('cash')} className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all" style={paymentMethod === 'cash' ? { background: '#7C3AED', color: '#fff' } : { background: 'rgba(255,255,255,0.07)', color: '#9CA3AF' }}>💵 كاش</button>
              {wallet && (wallet.balance || 0) >= (selectedOption?.total || 0) && (
                <button onClick={() => setPaymentMethod('wallet')} className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all" style={paymentMethod === 'wallet' ? { background: 'linear-gradient(135deg,#7C3AED,#9F5FF1)', color: '#fff', boxShadow: '0 0 12px rgba(124,58,237,0.4)' } : { background: 'rgba(255,255,255,0.07)', color: '#9CA3AF' }}>👛 {(wallet.balance||0).toFixed(1)} ر</button>
              )}
            </div>
          </div>
                <div className={`mt-2 flex justify-between border-t pt-2 ${isGroceryCart ? 'border-gray-100' : ''}`} style={isGroceryCart ? undefined : { borderColor: 'rgba(124,58,237,0.2)' }}>
                  <span className={`font-bold ${isGroceryCart ? 'text-gray-900' : 'text-white'}`}>الإجمالي</span>
                  <span className={`text-lg font-black ${isGroceryCart ? 'text-emerald-700' : ''}`} style={isGroceryCart ? undefined : { color: '#9F5FF1' }}>{selectedOption.total.toFixed(2)} ريال</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {zoneError && (
        <div className="mx-4 mt-2 p-3 rounded-xl text-center text-sm" style={{ background: 'rgba(248,113,113,0.12)', color: '#F87171', border: '1px solid rgba(248,113,113,0.25)' }}>
          {zoneError}
        </div>
      )}

      {/* Place Order Button - Disabled during submission */}
      {cart.length > 0 && selectedOption && !createdOrder && (
        <div className="fixed bottom-6 inset-x-4 z-40 mx-auto max-w-lg">
          <button
            type="button"
            onClick={placeOrder}
            disabled={placing || selectedOption.zone?.is_service_available === false}
            className={`w-full rounded-2xl py-4 text-base font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
              isGroceryCart && !placing ? 'bg-gradient-to-l from-emerald-700 to-emerald-500 shadow-xl shadow-emerald-200/60' : ''
            }`}
            style={
              isGroceryCart
                ? placing ? { background: '#6B7280' } : undefined
                : {
                    background: placing ? '#6B7280' : 'linear-gradient(135deg, #7C3AED, #9F5FF1)',
                    boxShadow: placing ? 'none' : '0 8px 30px rgba(124,58,237,0.5)',
                  }
            }
          >
            {placing ? '⏳ جاري إرسال الطلب...' : `✅ تأكيد الطلب · ${selectedOption.total.toFixed(2)} ريال`}
          </button>
        </div>
      )}
    </div>
  );
}