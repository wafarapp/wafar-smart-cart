import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Package, FileText, Zap, RefreshCw, Home, AlertCircle } from 'lucide-react';
import { createOrder, finalizeCheckout } from '@/lib/localOrders';
import {
  resolveNeighborhoodZone,
  orderZoneFields,
  OUT_OF_SERVICE_MESSAGE,
  ZONE_LABELS_AR,
} from '@/lib/neighborhoodZones';

const glass = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '16px' };

export default function FastDelivery() {
  const navigate = useNavigate();
  const customer = JSON.parse(localStorage.getItem('wafarCustomer') || '{"name":"زائر","phone":"","district":"الجنادرية"}');

  const [form, setForm] = useState({
    pickup: '',
    delivery: '',
    item: '',
    notes: '',
  });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [showTrackBtn, setShowTrackBtn] = useState(false);
  const [checkoutSessionId, setCheckoutSessionId] = useState(null);

  const deliveryZone = resolveNeighborhoodZone({
    neighborhoodName: customer.district || 'الجنادرية',
    customerLat: customer.lat,
    customerLng: customer.lng,
    fallbackDistanceKm: 2.5,
  });
  const deliveryFee = deliveryZone.is_service_available ? deliveryZone.customer_delivery_fee : 0;

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const submit = async () => {
    // Prevent duplicate submissions
    if (placing || createdOrder) return;
    if (!form.pickup.trim()) { setError('يرجى إدخال موقع الاستلام'); return; }
    if (!form.delivery.trim()) { setError('يرجى إدخال موقع التوصيل'); return; }
    if (!form.item.trim()) { setError('يرجى وصف ما تريد إرساله'); return; }
    if (!customer.phone || !customer.verified) { navigate('/login?returnUrl=/fast-delivery'); return; }
    const zone = resolveNeighborhoodZone({
      neighborhoodName: customer.district || 'الجنادرية',
      customerLat: customer.lat,
      customerLng: customer.lng,
      fallbackDistanceKm: 2.5,
    });
    if (!zone.is_service_available) {
      setError(OUT_OF_SERVICE_MESSAGE);
      return;
    }
    setError('');
    
    const sessionId = `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCheckoutSessionId(sessionId);
    setPlacing(true);
    try {
      const orderNum = 'WFR' + Date.now().toString().slice(-6);
      const { order } = await createOrder({
        order_number: orderNum,
        order_type: 'fast_delivery',
        status: 'pending',
        customer_phone: customer.phone,
        customer_name: customer.name,
        store_name: form.pickup.trim(),
        store_id: 'fast_delivery',
        customer_address: form.delivery.trim(),
        district: customer.district || 'الجنادرية',
        items_total: 0,
        delivery_fee: zone.customer_delivery_fee,
        total_amount: zone.customer_delivery_fee,
        ...orderZoneFields(zone),
        notes: `${form.item.trim()}${form.notes ? ' — ' + form.notes : ''}`,
        estimated_minutes: 30,
        payment_method: 'cash',
        cart_items: JSON.stringify([{ productName: form.item, quantity: 1, price: 0, unit: 'قطعة' }]),
        checkout_session_id: sessionId,
      });
      finalizeCheckout(order, { phone: customer.phone });
      setCreatedOrder(order);
    } catch (err) {
      console.error('Order creation failed:', err);
      setError('تعذّر إرسال الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setPlacing(false);
    }
  };

  useEffect(() => {
    if (!createdOrder) return;
    const t = setTimeout(() => setShowTrackBtn(true), 3000);
    return () => clearTimeout(t);
  }, [createdOrder?.id]);

  if (createdOrder) {
    return (
      <div dir="rtl" className="min-h-screen pb-20" style={{ background: '#0D0D1A' }}>
        {/* Header */}
        <div className="sticky top-0 z-30 px-4 py-4 flex items-center gap-3" style={{ background: 'rgba(13,13,26,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(96,165,250,0.15)' }}>
          <button onClick={() => navigate('/')} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <ChevronRight size={18} className="text-gray-300" />
          </button>
          <h1 className="text-white font-bold text-lg">تم الطلب</h1>
        </div>

        {/* Success Hero */}
        <div className="mx-4 mt-6 rounded-3xl p-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(59,130,246,0.08))', border: '1px solid rgba(96,165,250,0.3)' }}>
          <div className="text-6xl mb-3">✅</div>
          <h2 className="text-white font-black text-xl mb-1">تم إرسال طلبك للمندوب</h2>
          <p className="text-blue-300 text-sm">جاري البحث عن مندوب قريب لتنفيذ طلبك</p>
        </div>

        {/* Order Info */}
        <div className="mx-4 mt-4 p-4 rounded-3xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">رقم الطلب</span>
            <span className="text-white font-bold">#{createdOrder.order_number}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">الحي</span>
            <span className="text-white">{createdOrder.district}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">من</span>
            <span className="text-white text-sm text-left">{createdOrder.store_name}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">إلى</span>
            <span className="text-white text-sm text-left">{createdOrder.customer_address || 'غير محدد'}</span>
          </div>
          <div className="border-t pt-3 mt-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">التكلفة</span>
              <span className="font-black text-xl" style={{ color: '#60A5FA' }}>{createdOrder.total_amount?.toFixed(2)} ريال</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">طريقة الدفع</span>
              <span className="text-white text-sm">💵 كاش</span>
            </div>
          </div>
        </div>

        {/* Status Steps */}
        <div className="mx-4 mt-4 rounded-3xl overflow-hidden py-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="relative px-4 py-2">
            <div className="absolute top-[30px] right-[32px] left-[32px] h-0.5" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="absolute top-[30px] right-[32px] h-0.5" style={{ background: 'linear-gradient(90deg, #60A5FA, #3B82F6)', width: '0%', boxShadow: '0 0 8px rgba(96,165,250,0.6)', left: 'auto', right: '32px' }} />
            <div className="flex justify-between relative z-10">
              {[
                { key: 'pending', label: 'بانتظار القبول', icon: '⏳', color: '#FCD34D' },
                { key: 'preparing', label: 'يُجهّز', icon: '📦', color: '#9F5FF1' },
                { key: 'on_way', label: 'في الطريق', icon: '🛵', color: '#60A5FA' },
                { key: 'delivered', label: 'تم التسليم', icon: '🎉', color: '#34D399' },
              ].map((step, i) => (
                <div key={step.key} className="flex flex-col items-center gap-1" style={{ width: '25%' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={i === 0 ? { background: `linear-gradient(135deg, #60A5FA, ${step.color})`, boxShadow: `0 0 20px rgba(96,165,250,0.7)`, border: '2px solid rgba(255,255,255,0.3)' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
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
              style={{ background: 'linear-gradient(135deg, #60A5FA, #3B82F6)', boxShadow: '0 4px 20px rgba(96,165,250,0.3)' }}>
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
    <div dir="rtl" className="min-h-screen pb-16" style={{ background: '#0D0D1A' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 py-4 flex items-center gap-3"
        style={{ background: 'rgba(13,13,26,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(96,165,250,0.15)' }}>
        <button onClick={() => navigate('/')} className="p-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronRight size={18} className="text-gray-300" />
        </button>
        <div>
          <h1 className="text-white font-black text-lg flex items-center gap-2">
            <Zap size={18} style={{ color: '#60A5FA' }} /> طلب سريع
          </h1>
          <p className="text-gray-500 text-xs">توصيل أي شيء في حيك</p>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">

        {/* Pickup */}
        <div style={glass} className="p-4 space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-white">
            <MapPin size={15} style={{ color: '#34D399' }} /> موقع الاستلام
          </label>
          <input
            value={form.pickup}
            onChange={e => set('pickup', e.target.value)}
            placeholder="مثال: بقالة الراشد، حي الجنادرية"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(96,165,250,0.2)', color: '#fff' }}
          />
        </div>

        {/* Delivery */}
        <div style={glass} className="p-4 space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-white">
            <MapPin size={15} style={{ color: '#F87171' }} /> موقع التوصيل
          </label>
          <input
            value={form.delivery}
            onChange={e => set('delivery', e.target.value)}
            placeholder="مثال: شارع 15، المنزل رقم 4"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(96,165,250,0.2)', color: '#fff' }}
          />
        </div>

        {/* Item description */}
        <div style={glass} className="p-4 space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-white">
            <Package size={15} style={{ color: '#FCD34D' }} /> ماذا تريد إرساله؟
          </label>
          <input
            value={form.item}
            onChange={e => set('item', e.target.value)}
            placeholder="مثال: وثيقة، طرد صغير، حقيبة..."
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(96,165,250,0.2)', color: '#fff' }}
          />
        </div>

        {/* Notes */}
        <div style={glass} className="p-4 space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-white">
            <FileText size={15} style={{ color: '#A78BFA' }} /> ملاحظات (اختياري)
          </label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="أي تعليمات إضافية للمندوب..."
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(96,165,250,0.2)', color: '#fff' }}
          />
        </div>

        {/* Price estimate */}
        <div className="p-4 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(59,130,246,0.06))', border: '1px solid rgba(96,165,250,0.25)' }}>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">التكلفة المقدرة</span>
            <span className="font-black text-xl" style={{ color: '#60A5FA' }}>{deliveryFee} <span className="text-sm font-normal">ريال</span></span>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            {deliveryZone.is_service_available
              ? `${ZONE_LABELS_AR[deliveryZone.zone_type]} · ${deliveryZone.calculated_distance_km} كم · دفع كاش للمندوب`
              : OUT_OF_SERVICE_MESSAGE}
          </p>
        </div>

        {error && (
          <p className="text-xs text-center py-2 px-3 rounded-xl"
            style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}>
            {error}
          </p>
        )}

        <button onClick={submit} disabled={placing || createdOrder || !deliveryZone.is_service_available}
          className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: placing || createdOrder ? '#6B7280' : 'linear-gradient(135deg, #2563EB, #3B82F6)', boxShadow: placing || createdOrder ? 'none' : '0 8px 28px rgba(37,99,235,0.45)' }}>
          {placing ? '⏳ جاري إرسال الطلب...' : `⚡ إرسال الطلب · ${deliveryFee} ريال`}
        </button>

      </div>
    </div>
  );
}