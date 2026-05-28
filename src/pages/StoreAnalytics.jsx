import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, TrendingUp, Package, Clock, DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

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

export default function StoreAnalytics() {
  const navigate = useNavigate();
  const [store] = useState(() => JSON.parse(localStorage.getItem('wafarStore') || 'null'));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store) { navigate('/store'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const ords = await base44.entities.Order.filter({ store_id: store.id });
    setOrders(ords);
    setLoading(false);
  };

  const completed = orders.filter(o => o.status === 'delivered');
  const cancelled = orders.filter(o => o.status === 'cancelled');

  // Last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d;
  });
  const dailyData = last7Days.map(d => {
    const dayOrders = completed.filter(o => new Date(o.updated_date).toDateString() === d.toDateString());
    return {
      name: DAYS_AR[d.getDay()],
      طلبات: dayOrders.length,
      إيراد: Math.round(dayOrders.reduce((s, o) => s + (o.items_total || 0), 0))
    };
  });

  // Peak hours
  const hourCounts = Array(24).fill(0);
  orders.forEach(o => { hourCounts[new Date(o.created_date).getHours()]++; });
  const peakData = Array.from({ length: 24 }, (_, h) => ({
    name: `${h}:00`, طلبات: hourCounts[h]
  })).filter(d => d.طلبات > 0 || [8,10,12,14,16,18,20,22].includes(parseInt(d.name)));

  // Prep time (avg per day)
  const prepByDay = Array(7).fill(null).map(() => ({ total: 0, count: 0 }));
  orders.forEach(o => {
    if (o.estimated_minutes) {
      const day = new Date(o.created_date).getDay();
      prepByDay[day].total += o.estimated_minutes;
      prepByDay[day].count++;
    }
  });
  const prepData = DAYS_AR.map((name, i) => ({
    name,
    'دقيقة': prepByDay[i].count > 0 ? Math.round(prepByDay[i].total / prepByDay[i].count) : 0
  }));

  const totalRevenue = completed.reduce((s, o) => s + (o.items_total || 0), 0);
  const avgOrderValue = completed.length ? (totalRevenue / completed.length).toFixed(1) : 0;

  if (loading) return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D1A' }}>
      <div className="w-10 h-10 border-4 border-purple-900 border-t-purple-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen pb-10" style={{ background: '#0D0D1A' }}>
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(13,13,26,0.96)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
        <button onClick={() => navigate('/store')} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronRight size={18} className="text-gray-300" />
        </button>
        <div>
          <h1 className="text-white font-bold text-base">تحليلات المتجر</h1>
          <p className="text-gray-500 text-xs">{store?.name}</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'إجمالي الطلبات', value: completed.length, icon: '📦', color: '#60A5FA' },
            { label: 'إجمالي الإيراد', value: `${totalRevenue.toFixed(0)} ر`, icon: '💰', color: '#FCD34D' },
            { label: 'متوسط قيمة الطلب', value: `${avgOrderValue} ر`, icon: '🧾', color: '#9F5FF1' },
            { label: 'طلبات ملغية', value: cancelled.length, icon: '❌', color: '#F87171' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-2xl text-center" style={glass}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-black text-lg" style={{ color: s.color }}>{s.value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Daily Orders + Revenue */}
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} style={{ color: '#9F5FF1' }} />
            <h3 className="text-white font-bold text-sm">الطلبات والإيراد (آخر 7 أيام)</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dailyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip suffix=" طلب" />} />
              <Bar dataKey="طلبات" fill="url(#purpleGrad2)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="purpleGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9F5FF1" />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Line Chart */}
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={16} style={{ color: '#FCD34D' }} />
            <h3 className="text-white font-bold text-sm">الإيراد اليومي (آخر 7 أيام)</h3>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={dailyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip suffix=" ر" />} />
              <Line type="monotone" dataKey="إيراد" stroke="#FCD34D" strokeWidth={2.5} dot={{ fill: '#FCD34D', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Hours */}
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} style={{ color: '#6EE7B7' }} />
            <h3 className="text-white font-bold text-sm">ذروة ساعات الطلبات</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={peakData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip suffix=" طلب" />} />
              <Bar dataKey="طلبات" fill="url(#greenGrad2)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="greenGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6EE7B7" />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Prep Speed */}
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: '#F87171' }} />
            <h3 className="text-white font-bold text-sm">متوسط وقت التجهيز (دقيقة)</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={prepData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip suffix=" د" />} />
              <Bar dataKey="دقيقة" fill="url(#redGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F87171" />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}