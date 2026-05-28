import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  MapPin,
  Save,
  RefreshCw,
  Layers,
  DollarSign,
  Ruler,
  ShoppingBag,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  NEIGHBORHOOD_NAMES,
  NEIGHBORHOOD_GROUPS,
  ZONE_LABELS_AR,
  ZONE_TYPES,
  getZoneConfig,
  saveZoneConfig,
  countOrdersByNeighborhood,
  DRIVER_GROUP_OPTIONS,
} from '@/lib/neighborhoodZones';

const glass = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(124, 58, 237, 0.2)',
  borderRadius: '16px',
};

export default function NeighborhoodZones() {
  const navigate = useNavigate();
  const [logged] = useState(() => localStorage.getItem('wafarAdmin') === 'true');
  const [config, setConfig] = useState(() => getZoneConfig());
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!logged) return;
    loadOrders();
  }, [logged]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const o = await base44.entities.Order.list('-created_date', 500);
      setOrders(o);
    } catch {
      setOrders([]);
    }
    setLoading(false);
  };

  if (!logged) {
    return (
      <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#0D0D1A' }}>
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🛡️</div>
          <h1 className="text-white font-black text-xl mb-2">إدارة الأحياء</h1>
          <p className="text-gray-500 text-sm mb-6">للمديرين فقط — سجّل دخولك من لوحة الإدارة أولاً</p>
          <button
            onClick={() => navigate('/admin')}
            className="w-full py-3 rounded-xl text-white font-bold"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)' }}
          >
            الذهاب للوحة الإدارة
          </button>
        </div>
      </div>
    );
  }

  const orderCounts = countOrdersByNeighborhood(orders);

  const updateRadii = (key, value) => {
    setConfig((c) => ({
      ...c,
      zone_radii: { ...c.zone_radii, [key]: parseFloat(value) || 0 },
    }));
  };

  const updatePricing = (zoneKey, field, value) => {
    setConfig((c) => ({
      ...c,
      zone_pricing: {
        ...c.zone_pricing,
        [zoneKey]: {
          ...c.zone_pricing[zoneKey],
          [field]: parseFloat(value) || 0,
        },
      },
    }));
  };

  const handleSave = () => {
    saveZoneConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const { inside_max_km, near_max_km, far_max_km } = config.zone_radii;

  return (
    <div dir="rtl" className="min-h-screen pb-10" style={{ background: '#0D0D1A' }}>
      <div
        className="sticky top-0 z-30 px-4 pt-4 pb-3"
        style={{
          background: 'rgba(13,13,26,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(124,58,237,0.15)',
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ChevronRight size={18} className="text-gray-300" />
          </button>
          <div>
            <h1 className="text-white font-black text-base flex items-center gap-2">
              <MapPin size={18} style={{ color: '#9F5FF1' }} />
              إدارة الأحياء
            </h1>
            <p className="text-gray-500 text-xs">وفر · موصل الحي · مناطق التوصيل</p>
          </div>
          <button
            onClick={loadOrders}
            className="ms-auto p-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            title="تحديث"
          >
            <RefreshCw size={16} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Zone radii */}
        <div style={glass} className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Ruler size={16} style={{ color: '#60A5FA' }} />
            <h2 className="text-white font-bold text-sm">نطاقات المسافة (كم)</h2>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between gap-3 p-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)' }}>
              <span className="text-gray-300">داخل الحي (0 —)</span>
              <input
                type="number"
                step="0.1"
                value={inside_max_km}
                onChange={(e) => updateRadii('inside_max_km', e.target.value)}
                className="w-20 px-2 py-1.5 rounded-lg text-white text-center outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }}
              />
            </div>
            <div className="flex items-center justify-between gap-3 p-2 rounded-xl" style={{ background: 'rgba(96,165,250,0.08)' }}>
              <span className="text-gray-300">قريب ({inside_max_km} —)</span>
              <input
                type="number"
                step="0.1"
                value={near_max_km}
                onChange={(e) => updateRadii('near_max_km', e.target.value)}
                className="w-20 px-2 py-1.5 rounded-lg text-white text-center outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }}
              />
            </div>
            <div className="flex items-center justify-between gap-3 p-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)' }}>
              <span className="text-gray-300">بعيد ({near_max_km} —)</span>
              <input
                type="number"
                step="0.1"
                value={far_max_km}
                onChange={(e) => updateRadii('far_max_km', e.target.value)}
                className="w-20 px-2 py-1.5 rounded-lg text-white text-center outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }}
              />
            </div>
            <p className="text-gray-600 text-center">أكثر من {far_max_km} كم = خارج النطاق</p>
          </div>
        </div>

        {/* Pricing */}
        <div style={glass} className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} style={{ color: '#FCD34D' }} />
            <h2 className="text-white font-bold text-sm">أسعار التوصيل (ريال)</h2>
          </div>
          <div className="space-y-3">
            {[ZONE_TYPES.inside, ZONE_TYPES.near, ZONE_TYPES.far].map((zk) => (
              <div key={zk} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-white text-xs font-bold mb-2">{ZONE_LABELS_AR[zk]}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-500 text-xs block mb-1">رسوم العميل</label>
                    <input
                      type="number"
                      value={config.zone_pricing[zk]?.customer_delivery_fee ?? 0}
                      onChange={(e) => updatePricing(zk, 'customer_delivery_fee', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg text-white text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }}
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs block mb-1">أجر المندوب</label>
                    <input
                      type="number"
                      value={config.zone_pricing[zk]?.driver_fee ?? 0}
                      onChange={(e) => updatePricing(zk, 'driver_fee', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg text-white text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2"
          style={{
            background: saved
              ? 'linear-gradient(135deg, #059669, #10B981)'
              : 'linear-gradient(135deg, #7C3AED, #9F5FF1)',
            boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
          }}
        >
          <Save size={18} />
          {saved ? 'تم الحفظ ✓' : 'حفظ التعديلات'}
        </button>

        {/* Neighborhoods list */}
        <div style={glass} className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers size={16} style={{ color: '#9F5FF1' }} />
            <h2 className="text-white font-bold text-sm">الأحياء</h2>
          </div>
          <p className="text-gray-500 text-xs mb-3">
            غصون والمعالي تابعة لمجموعة الجنادرية — المندوبون يُعيَّنون حسب المجموعة
          </p>
          <div className="space-y-2">
            {NEIGHBORHOOD_NAMES.map((name) => (
              <div
                key={name}
                className="p-3 rounded-xl flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div>
                  <p className="text-white text-sm font-bold">{name}</p>
                  <p className="text-gray-500 text-xs">
                    مجموعة: {NEIGHBORHOOD_GROUPS[name]}
                    {NEIGHBORHOOD_GROUPS[name] !== name && ' (فرعي)'}
                  </p>
                </div>
                <div className="text-left flex items-center gap-2">
                  <ShoppingBag size={14} className="text-gray-600" />
                  <span className="text-white font-bold text-sm">{orderCounts[name] || 0}</span>
                  <span className="text-gray-600 text-xs">طلب</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Driver groups reference */}
        <div
          className="p-4 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(159,95,241,0.06))',
            border: '1px solid rgba(124,58,237,0.25)',
          }}
        >
          <h3 className="text-white font-bold text-sm mb-2">مجموعات المناديب</h3>
          <div className="flex flex-wrap gap-2">
            {DRIVER_GROUP_OPTIONS.map((g) => (
              <span
                key={g}
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(159,95,241,0.2)', color: '#C4B5FD' }}
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
