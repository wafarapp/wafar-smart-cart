import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, CreditCard, Banknote, CheckCircle, Loader2, RefreshCw, Home, AlertCircle } from 'lucide-react';
import { createOrder, finalizeCheckout } from '@/lib/localOrders';
import {
  NEIGHBORHOOD_NAMES,
  resolveNeighborhoodZone,
  orderZoneFields,
  OUT_OF_SERVICE_MESSAGE,
  ZONE_LABELS_AR,
} from '@/lib/neighborhoodZones';

export default function RestaurantCheckout() {
  const navigate = useNavigate();
  const [cartData, setCartData] = useState(null);
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('الجنادرية');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [placing, setPlacing] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [showTrackBtn, setShowTrackBtn] = useState(false);
  const [checkoutSessionId, setCheckoutSessionId] = useState(null);
  const [zoneError, setZoneError] = useState('');
  const [deliveryZone, setDeliveryZone] = useState(null);

  useEffect(() => {
    const c = JSON.parse(localStorage.getItem('wafarCustomer') || '{}');
    if (!c.phone || !c.verified) { navigate('/login?returnUrl=/restaurant-checkout'); return; }
    const data = localStorage.getItem('restaurantCart');
    if (data) setCartData(JSON.parse(data));
    else navigate('/restaurants');

    const customer = localStorage.getItem('wafarCustomer');
    if (customer) {
      const c = JSON.parse(customer);
      setPhone(c.phone || '');
      setDistrict(c.district || 'الجنادرية');
    }
  }, []);

  useEffect(() => {
    if (!cartData) return;
    const zone = resolveNeighborhoodZone({
      neighborhoodName: district,
      fallbackDistanceKm: 2,
    });
    setDeliveryZone(zone);
    setZoneError(zone.is_service_available ? '' : OUT_OF_SERVICE_MESSAGE);
  }, [district, cartData]);

  const deliveryFee = deliveryZone?.is_service_available
    ? deliveryZone.customer_delivery_fee
    : 0;
  const total = cartData ? cartData.total + deliveryFee : 0;

  useEffect(() => {
    if (!createdOrder) return;
    const t = setTimeout(() => setShowTrackBtn(true), 3000);
    return () => clearTimeout(t);
  }, [createdOrder?.id]);

  const placeOrder = async () => {
    if (!address || !phone || placing || createdOrder) return;
    const zone = resolveNeighborhoodZone({ neighborhoodName: district, fallbackDistanceKm: 2 });
    if (!zone.is_service_available) {
      setZoneError(OUT_OF_SERVICE_MESSAGE);
      return;
    }
    const sessionId = `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCheckoutSessionId(sessionId);
    setPlacing(true);
    try {
      const orderNum = `R${Date.now().toString().slice(-6)}`;
      const { order } = await createOrder({
        order_number: orderNum,
        order_type: 'restaurant',
        customer_phone: phone,
        customer_name: JSON.parse(localStorage.getItem('wafarCustomer') || '{}').name || '',
        store_id: cartData.restaurant?.id || 'restaurant',
        store_name: cartData.restaurant?.name || 'مطعم',
        status: 'available_for_driver',
        items_total: cartData.total,
        delivery_fee: zone.customer_delivery_fee,
        total_amount: cartData.total + zone.customer_delivery_fee,
        customer_address: `${district} - ${address}`,
        district,
        ...orderZoneFields(zone),
        payment_method: paymentMethod,
        notes: cartData.notes || '',
        cart_items: JSON.stringify(cartData.items.map(i => ({
          productName: i.name,
          price: i.price,
          quantity: i.qty,
          unit: 'حبة',
        }))),
        estimated_minutes: cartData.restaurant?.delivery_time_min || 30,
        checkout_session_id: sessionId,
      });
      finalizeCheckout(order, { phone, clearCartKey: 'restaurantCart' });
      setCreatedOrder(order);
    } catch (err) {
      console.error('Order creation failed:', err);
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
            <h1 className="text-white font-bold text-lg">تتبع الطلب</h1>
          </div>
        </div>

        {/* Success Hero */}
        <div className="mx-4 mt-6 rounded-3xl p-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.08))', border: '1px solid rgba(245,158,11,0.3)' }}>
          <div className="text-6xl mb-3">✅</div>
          <h2 className="text-white font-black text-xl mb-1">تم إرسال طلبك للمندوب</h2>
          <p className="text-amber-300 text-sm">جاري البحث عن مندوب قريب لشراء طلبك من المطعم</p>
        </div>

        {/* Order Info */}
        <div className="mx-4 mt-4 p-4 rounded-3xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">رقم الطلب</span>
            <span className="text-white font-bold">#{createdOrder.order_number}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">المطعم</span>
            <span className="text-white font-bold">{createdOrder.store_name}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">الحي</span>
            <span className="text-white">{createdOrder.district}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">عنوان التوصيل</span>
            <span className="text-white text-sm text-left">{createdOrder.customer_address || 'غير محدد'}</span>
          </div>
          <div className="border-t pt-3 mt-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">الإجمالي</span>
              <span className="font-black text-xl" style={{ color: '#F59E0B' }}>{createdOrder.total_amount?.toFixed(2)} ريال</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">طريقة الدفع</span>
              <span className="text-white text-sm">{createdOrder.payment_method === 'wallet' ? '💛 محفظة' : '💵 كاش'}</span>
            </div>
          </div>
        </div>

        {/* Status Steps */}
        <div className="mx-4 mt-4 rounded-3xl overflow-hidden py-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="relative px-4 py-2">
            <div className="absolute top-[30px] right-[32px] left-[32px] h-0.5" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="absolute top-[30px] right-[32px] h-0.5" style={{ background: 'linear-gradient(90deg, #F59E0B, #D97706)', width: '0%', boxShadow: '0 0 8px rgba(245,158,11,0.6)', left: 'auto', right: '32px' }} />
            <div className="flex justify-between relative z-10">
              {[
                { key: 'pending', label: 'بانتظار مندوب', icon: '🔍', color: '#FCD34D' },
                { key: 'accepted', label: 'تم التعيين', icon: '🛵', color: '#60A5FA' },
                { key: 'picked_up', label: 'في الطريق للمطعم', icon: '🍽️', color: '#9F5FF1' },
                { key: 'on_way', label: 'تم الشراء', icon: '🚀', color: '#F59E0B' },
                { key: 'delivered', label: 'تم التسليم', icon: '🎉', color: '#34D399' },
              ].map((step, i) => (
                <div key={step.key} className="flex flex-col items-center gap-1" style={{ width: '20%' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={i === 0 ? { background: `linear-gradient(135deg, #F59E0B, ${step.color})`, boxShadow: `0 0 20px rgba(245,158,11,0.7)`, border: '2px solid rgba(255,255,255,0.3)' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
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
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}>
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

  if (!cartData) return null;

  return (
    <div dir="rtl" className="min-h-screen pb-32" style={{ background: '#0D0D1A' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-4"
        style={{ background: 'rgba(13,13,26,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronRight size={18} style={{ color: '#9CA3AF' }} />
        </button>
        <div>
          <h1 className="text-white font-black text-base">تأكيد الطلب</h1>
          <p className="text-gray-500 text-xs">{cartData.restaurant?.name}</p>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Delivery Address */}
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} style={{ color: '#F59E0B' }} />
            <h3 className="text-white font-bold text-sm">عنوان التوصيل</h3>
          </div>

          <div className="flex gap-2 flex-wrap mb-3">
            {NEIGHBORHOOD_NAMES.map(d => (
              <button key={d} onClick={() => setDistrict(d)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={district === d
                  ? { background: 'rgba(245,158,11,0.2)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }
                  : { background: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.07)' }}>
                {d}
              </button>
            ))}
          </div>

          <input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="تفاصيل العنوان (الشارع، رقم المنزل...)"
            className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none mb-2"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}
          />
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="رقم الجوال"
            type="tel"
            className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}
          />
        </div>

        {/* Payment Method */}
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} style={{ color: '#9F5FF1' }} />
            <h3 className="text-white font-bold text-sm">طريقة الدفع</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'cash', label: 'كاش عند الاستلام', icon: <Banknote size={18} /> },
              { id: 'wallet', label: 'محفظة وفر', icon: <CreditCard size={18} /> },
            ].map(m => (
              <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                style={paymentMethod === m.id
                  ? { background: 'rgba(159,95,241,0.15)', border: '1.5px solid rgba(159,95,241,0.4)', color: '#9F5FF1' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#6B7280' }}>
                {m.icon}
                <span className="text-xs font-semibold">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 className="text-white font-bold text-sm mb-3">ملخص الطلب</h3>
          <div className="space-y-2 mb-3">
            {cartData.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">{item.name} × {item.qty}</span>
                <span className="text-white text-sm font-semibold">{(item.price * item.qty).toFixed(2)} ر</span>
              </div>
            ))}
          </div>

          {cartData.notes && (
            <p className="text-gray-600 text-xs mb-3 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              ملاحظة: {cartData.notes}
            </p>
          )}

          <div className="border-t pt-3 space-y-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">المنتجات</span>
              <span className="text-white">{cartData.total.toFixed(2)} ر</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">التوصيل</span>
              <span className="text-white">{deliveryFee} ر</span>
            </div>
            {deliveryZone && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">منطقة التوصيل</span>
                <span className="text-gray-400">{ZONE_LABELS_AR[deliveryZone.zone_type]} · {deliveryZone.calculated_distance_km} كم</span>
              </div>
            )}
            <div className="flex justify-between font-black">
              <span className="text-white">الإجمالي</span>
              <span style={{ color: '#F59E0B' }}>{total.toFixed(2)} ريال</span>
            </div>
          </div>
        </div>
      </div>

      {zoneError && (
        <div className="mx-4 mb-2 p-3 rounded-xl text-center text-sm" style={{ background: 'rgba(248,113,113,0.12)', color: '#F87171', border: '1px solid rgba(248,113,113,0.25)' }}>
          {zoneError}
        </div>
      )}

      {/* Place Order Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: 'rgba(15,15,26,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(245,158,11,0.15)' }}>
        <button
          onClick={placeOrder}
          disabled={!address || !phone || placing || createdOrder || deliveryZone?.is_service_available === false}
          className="w-full py-4 rounded-2xl text-white font-black text-base transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: placing || createdOrder ? '#6B7280' : 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: placing || createdOrder ? 'none' : '0 8px 28px rgba(245,158,11,0.4)' }}>
          {placing ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
          {placing ? 'جاري إرسال الطلب...' : `تأكيد الطلب — ${total.toFixed(2)} ر`}
        </button>
        {(!address || !phone) && (
          <p className="text-center text-xs mt-2" style={{ color: '#F59E0B' }}>يرجى إدخال العنوان ورقم الجوال</p>
        )}
      </div>
    </div>
  );
}