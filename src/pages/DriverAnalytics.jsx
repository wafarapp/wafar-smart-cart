import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, TrendingUp, Package, Clock, Star, BarChart2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getDeliveredOrdersByDriver } from '@/lib/ordersService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const glass = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '16px' };

const DAYS_AR = ['أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];

function CustomTooltip({ active, payload, label, suffix = '' }) {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'rgba(13,13,26,0.95)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12, padding: '8px 14px' }}>
        <p style={{ color: '#9F5FF1', fontWeight: 700 }}>{label}</p>
        <p style={{ color: '#fff', fontSize: 13 }}>{payload[0].value}{suffix}</p>
      </div>
    );
  }
  return null;
}

export default function DriverAnalytics() {
  const navigate = useNavigate();
  const [driver] = useState(() => JSON.parse(localStorage.getItem('wafarDriver') || 'null'));
  const [orders, setOrders] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driver) { navigate('/driver'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const ords = await getDeliveredOrdersByDriver(driver.id);
      setOrders(ords);
    } catch {
      setOrders([]);
    }
    try {
      const rats = await base44.entities.Rating.filter({ driver_id: driver.id });
      setRatings(rats);
    } catch {
      setRatings([]);
    }
    setLoading(false);
  };

  // Completed orders per day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const dailyData = last7Days.map(d => {
    const count = orders.filter(o => new Date(o.updated_date).toDateString() === d.toDateString()).length;
    return { name: DAYS_AR[d.getDay()], طلبات: count };
  });

  // Peak hours
  const hourCounts = Array(24).fill(0);
  orders.forEach(o => { hourCounts[new Date(o.created_date).getHours()]++; });
  const peakData = hourCounts.map((v, h) => ({ name: `${h}:00`, طلبات: v })).filter(d => d.طلبات > 0 || [8,9,10,12,14,16,18,20,22].includes(parseInt(d.name)));

  // Delivery speed (avg minutes per day of week)
  const speedByDay = Array(7).fill(null).map(() => ({ total: 0, count: 0 }));
  orders.forEach(o => {
    if (o.picked_up_date && o.delivered_date) {
      const mins = (new Date(o.delivered_date) - new Date(o.picked_up_date)) / 60000;
      const day = new Date(o.delivered_date).getDay();
      speedByDay[day].total += mins;
      speedByDay[day].count++;
    } else if (o.estimated_minutes) {
      const day = new Date(o.updated_date).getDay();
      speedByDay[day].total += o.estimated_minutes;
      speedByDay[day].count++;
    }
  });
  const speedData = DAYS_AR.map((name, i) => ({
    name,
    'دقيقة': speedByDay[i].count > 0 ? Math.round(speedByDay[i].total / speedByDay[i].count) : 0
  }));

  const avgRating = ratings.length ? (ratings.reduce((s, r) => s + (r.driver_rating || 0), 0) / ratings.length).toFixed(1) : '—';
  const totalEarnings = orders.reduce((s, o) => s + (o.delivery_fee || 0) * 0.7, 0);

  if (loading) return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D1A' }}>
      <div className="w-10 h-10 border-4 border-purple-900 border-t-purple-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen pb-10" style={{ background: '#0D0D1A' }}>
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(13,13,26,0.96)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
        <button onClick={() => navigate('/driver')} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronRight size={18} className="text-gray-300" />
        </button>
        <div>
          <h1 className="text-white font-bold text-base">تحليلات الأداء</h1>
          <p className="text-gray-500 text-xs">{driver?.name}</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'إجمالي الطلبات', value: orders.length, icon: '📦', color: '#60A5FA' },
            { label: 'إجمالي الأرباح', value: `${totalEarnings.toFixed(0)} ر`, icon: '💰', color: '#FCD34D' },
            { label: 'متوسط التقييم', value: `${avgRating} ⭐`, icon: '⭐', color: '#F87171' },
            { label: 'تقييمات وصلتني', value: ratings.length, icon: '💬', color: '#6EE7B7' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-2xl text-center" style={glass}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-black text-lg" style={{ color: s.color }}>{s.value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Daily Orders Chart */}
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} style={{ color: '#9F5FF1' }} />
            <h3 className="text-white font-bold text-sm">الطلبات المكتملة (آخر 7 أيام)</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dailyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip suffix=" طلب" />} />
              <Bar dataKey="طلبات" fill="url(#purpleGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9F5FF1" />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Hours Chart */}
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} style={{ color: '#FCD34D' }} />
            <h3 className="text-white font-bold text-sm">ذروة ساعات الطلبات</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={peakData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip suffix=" طلب" />} />
              <Bar dataKey="طلبات" fill="url(#yellowGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="yellowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FCD34D" />
                  <stop offset="100%" stopColor="#D97706" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Delivery Speed Chart */}
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: '#6EE7B7' }} />
            <h3 className="text-white font-bold text-sm">متوسط وقت التوصيل (دقيقة)</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={speedData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip suffix=" د" />} />
              <Bar dataKey="دقيقة" fill="url(#greenGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6EE7B7" />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Ratings */}
        {ratings.length > 0 && (
          <div className="rounded-2xl p-4" style={glass}>
            <div className="flex items-center gap-2 mb-4">
              <Star size={16} style={{ color: '#FCD34D' }} />
              <h3 className="text-white font-bold text-sm">آخر التقييمات</h3>
            </div>
            <div className="space-y-3">
              {ratings.slice(0, 5).map(r => (
                <div key={r.id} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={12} fill={s <= (r.driver_rating || 0) ? '#FCD34D' : 'none'} style={{ color: '#FCD34D' }} />
                      ))}
                    </div>
                    <span className="text-gray-600 text-xs">{new Date(r.created_date).toLocaleDateString('ar-SA')}</span>
                  </div>
                  {r.comment && <p className="text-gray-300 text-xs mt-1">"{r.comment}"</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}