import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { ChevronRight, MapPin, Clock, Truck, Send, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DISTRICTS = ['الجنادرية', 'الشروق', 'المعالي', 'النظيم', 'غصون'];
const DISTRICT_CENTERS = {
  'الجنادرية': [24.7500, 46.8900],
  'الشروق':    [24.7900, 46.7200],
  'المعالي':   [24.8100, 46.6800],
  'النظيم':    [24.7200, 46.7800],
  'غصون':      [24.7600, 46.8200],
};

const glass = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(124,58,237,0.25)',
  borderRadius: '20px',
};

function MapPicker({ position, setPosition }) {
  useMapEvents({
    click(e) { setPosition([e.latlng.lat, e.latlng.lng]); },
  });
  return position ? <Marker position={position} /> : null;
}

export default function StoreRegistration() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    store_name: '',
    owner_name: '',
    phone: '',
    district: 'الجنادرية',
    working_hours: '',
    has_drivers: false,
    notes: '',
  });
  const [mapPos, setMapPos] = useState(null);
  const mapCenter = DISTRICT_CENTERS[form.district] || [24.7500, 46.8900];

  const update = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async () => {
    if (!form.store_name || !form.owner_name || !form.phone) return;
    setLoading(true);
    await base44.entities.StoreRegistrationRequest.create({
      ...form,
      lat: mapPos?.[0] || null,
      lng: mapPos?.[1] || null,
      status: 'pending',
    });
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: '#0D0D1A' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '400px', background: 'radial-gradient(ellipse, rgba(124,58,237,0.25) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>
      <div className="relative z-10 text-center max-w-sm">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(159,95,241,0.2))', border: '2px solid rgba(124,58,237,0.5)', boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}>
          <CheckCircle size={36} style={{ color: '#9F5FF1' }} />
        </div>
        <h2 className="text-white text-2xl font-black mb-4">تم الإرسال! 🎉</h2>
        <div className="p-5 rounded-2xl mb-6" style={glass}>
          <p className="text-gray-300 text-sm leading-relaxed">
            تم إرسال طلب التسجيل للإدارة وسيتم التواصل معك قريباً
          </p>
        </div>
        <button onClick={() => navigate('/app-login')}
          className="w-full py-4 rounded-2xl text-white font-black"
          style={{ background: 'linear-gradient(135deg, #4C1D95, #7C3AED)', boxShadow: '0 8px 30px rgba(124,58,237,0.4)' }}>
          العودة للرئيسية
        </button>
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen pb-10" style={{ background: '#0D0D1A' }}>
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '-5%', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '300px', background: 'radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-6 pb-4"
        style={{ background: 'rgba(13,13,26,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors">
          <ChevronRight size={18} />
          <span className="text-sm">رجوع</span>
        </button>
        <div className="text-center">
          <h1 className="text-white font-black text-base">طلب تسجيل بقالة</h1>
          <p className="text-gray-600 text-xs">وفر · انضم للمنصة</p>
        </div>
        <div className="w-14" />
      </div>

      <div className="relative z-10 px-4 pt-6 space-y-5">
        {/* Basic Info */}
        <div style={glass} className="p-5 space-y-4">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            🏪 معلومات البقالة
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-gray-500 text-xs mb-1 block">اسم البقالة *</label>
              <input value={form.store_name} onChange={e => update('store_name', e.target.value)}
                placeholder="مثال: بقالة النور"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
            </div>
            <div>
              <label className="text-gray-500 text-xs mb-1 block">اسم المالك *</label>
              <input value={form.owner_name} onChange={e => update('owner_name', e.target.value)}
                placeholder="الاسم الكامل"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
            </div>
            <div>
              <label className="text-gray-500 text-xs mb-1 block">رقم الجوال *</label>
              <input value={form.phone} onChange={e => update('phone', e.target.value)}
                placeholder="05XXXXXXXX" type="tel"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
            </div>
          </div>
        </div>

        {/* District */}
        <div style={glass} className="p-5 space-y-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <MapPin size={15} style={{ color: '#9F5FF1' }} /> الحي
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {DISTRICTS.map(d => (
              <button key={d} onClick={() => { update('district', d); setMapPos(null); }}
                className="py-2 rounded-xl text-xs font-medium transition-all"
                style={form.district === d
                  ? { background: '#7C3AED', color: '#fff', boxShadow: '0 0 12px rgba(124,58,237,0.5)' }
                  : { background: 'rgba(255,255,255,0.07)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.1)' }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Map */}
        <div style={glass} className="p-5 space-y-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <MapPin size={15} style={{ color: '#9F5FF1' }} /> موقع البقالة على الخريطة
          </h3>
          <p className="text-gray-500 text-xs">اضغط على الخريطة لتحديد الموقع</p>
          <div className="rounded-xl overflow-hidden" style={{ height: '220px', border: '1px solid rgba(124,58,237,0.3)' }}>
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} key={form.district}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapPicker position={mapPos} setPosition={setMapPos} />
            </MapContainer>
          </div>
          {mapPos && (
            <p className="text-xs text-center" style={{ color: '#9F5FF1' }}>
              ✓ تم تحديد الموقع ({mapPos[0].toFixed(4)}, {mapPos[1].toFixed(4)})
            </p>
          )}
        </div>

        {/* Working Hours */}
        <div style={glass} className="p-5 space-y-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Clock size={15} style={{ color: '#9F5FF1' }} /> ساعات العمل
          </h3>
          <input value={form.working_hours} onChange={e => update('working_hours', e.target.value)}
            placeholder="مثال: ٦ص - ١٢م يومياً"
            className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
        </div>

        {/* Has Drivers */}
        <div style={glass} className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck size={16} style={{ color: '#9F5FF1' }} />
              <div>
                <p className="text-white text-sm font-medium">هل يوجد مناديب خاصين؟</p>
                <p className="text-gray-500 text-xs mt-0.5">مناديب توصيل تابعون للبقالة</p>
              </div>
            </div>
            <button onClick={() => update('has_drivers', !form.has_drivers)}
              className="w-14 h-7 rounded-full transition-all relative"
              style={{ background: form.has_drivers ? 'linear-gradient(135deg, #7C3AED, #9F5FF1)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(124,58,237,0.3)' }}>
              <span className="absolute top-0.5 transition-all w-6 h-6 rounded-full bg-white"
                style={{ right: form.has_drivers ? '2px' : '30px', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            </button>
          </div>
        </div>

        {/* Notes */}
        <div style={glass} className="p-5 space-y-3">
          <h3 className="text-white font-bold text-sm">📝 ملاحظات إضافية</h3>
          <textarea value={form.notes} onChange={e => update('notes', e.target.value)}
            placeholder="أي معلومات إضافية تود إضافتها..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
        </div>

        {/* Buttons */}
        <div className="space-y-3 pb-4">
          <button onClick={handleSubmit}
            disabled={loading || !form.store_name || !form.owner_name || !form.phone}
            className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #4C1D95, #7C3AED)', boxShadow: '0 8px 30px rgba(124,58,237,0.5)' }}>
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Send size={18} />إرسال طلب التسجيل</>
            )}
          </button>
          <button onClick={() => navigate(-1)}
            className="w-full py-3.5 rounded-2xl text-gray-400 font-medium text-sm"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            رجوع
          </button>
        </div>
      </div>
    </div>
  );
}