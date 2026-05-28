import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Store, Bike, ShoppingBag, TrendingUp, Settings, ChevronRight, Check, X, Plus, BookOpen, ChevronDown, MapPin } from 'lucide-react';
import { NEIGHBORHOOD_NAMES } from '@/lib/neighborhoodZones';
import BottomSheet from '../components/BottomSheet';
import { base44 } from '@/api/base44Client';

const glass = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: '16px' };

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [pin, setPin] = useState('');
  const [logged, setLogged] = useState(() => localStorage.getItem('wafarAdmin') === 'true');
  const [pinError, setPinError] = useState(false);
  const [stores, setStores] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFee, setNewFee] = useState({ label: '', distance_min_km: 0, distance_max_km: 2, base_fee: 6.99 });
  const [showAddFee, setShowAddFee] = useState(false);
  const [showAddStore, setShowAddStore] = useState(false);
  const [newStore, setNewStore] = useState({ name: '', district: 'الجنادرية', phone: '', password: '', distance_km: 1.5, prep_time_minutes: 15 });
  const [districtSheetOpen, setDistrictSheetOpen] = useState(false);

  useEffect(() => { if (logged) loadAll(); }, [logged]);

  const loadAll = async () => {
    setLoading(true);
    const [s, d, o, f] = await Promise.all([
      base44.entities.Store.list(),
      base44.entities.Driver.list(),
      base44.entities.Order.list('-created_date', 50),
      base44.entities.DeliveryFee.list()
    ]);
    setStores(s); setDrivers(d); setOrders(o); setFees(f);
    setLoading(false);
  };

  const approveStore = async (id, val) => { await base44.entities.Store.update(id, { is_approved: val }); loadAll(); };
  const hashPassword = async (text) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const addStore = async () => {
    if (!newStore.name || !newStore.password) return;
    const hashedPassword = await hashPassword(newStore.password);
    await base44.entities.Store.create({ ...newStore, password: hashedPassword, distance_km: parseFloat(newStore.distance_km), prep_time_minutes: parseInt(newStore.prep_time_minutes), is_active: true, is_approved: true, rating_avg: 4.5, total_orders: 0 });
    setNewStore({ name: '', district: 'الجنادرية', phone: '', password: '', distance_km: 1.5, prep_time_minutes: 15 });
    setShowAddStore(false);
    loadAll();
  };
  const approveDriver = async (id, val) => { await base44.entities.Driver.update(id, { is_approved: val }); loadAll(); };
  const addFee = async () => { await base44.entities.DeliveryFee.create({ ...newFee, base_fee: parseFloat(newFee.base_fee), rush_hour_surcharge: 3, express_surcharge: 3, is_active: true }); setShowAddFee(false); loadAll(); };

  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total_amount || 0), 0);
  const todayOrders = orders.filter(o => new Date(o.created_date).toDateString() === new Date().toDateString());
  const STATUS_COLORS = { pending: '#FCD34D', accepted: '#60A5FA', preparing: '#9F5FF1', picked_up: '#6EE7B7', on_way: '#6EE7B7', delivered: '#10B981', cancelled: '#F87171' };
  const STATUS_AR = { pending: 'معلق', accepted: 'مقبول', preparing: 'يُجهز', picked_up: 'استُلم', on_way: 'في الطريق', delivered: 'مسلّم', cancelled: 'ملغي' };

  const TABS = [
    { key: 'overview', label: 'نظرة عامة', icon: TrendingUp },
    { key: 'stores', label: 'البقالات', icon: Store },
    { key: 'drivers', label: 'المناديب', icon: Bike },
    { key: 'orders', label: 'الطلبات', icon: ShoppingBag },
    { key: 'fees', label: 'الرسوم', icon: Settings },
    { key: 'catalog', label: 'الكتالوج', icon: BookOpen },
    { key: 'zones', label: 'إدارة الأحياء', icon: MapPin },
  ];

  const loginAdmin = async () => {
    try {
      const { base44 } = await import('@/api/base44Client');
      const res = await base44.functions.invoke('verifyAdminPin', { pin });
      if (res.data?.success) {
        localStorage.setItem('wafarAdmin', 'true');
        setLogged(true);
      } else {
        setPinError(true);
        setTimeout(() => setPinError(false), 2000);
      }
    } catch {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const logout = () => {
    localStorage.removeItem('wafarAdmin');
    navigate('/');
  };

  if (!logged) return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#0D0D1A' }}>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(248,113,113,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="w-full max-w-sm">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-gray-500 mb-6 hover:text-gray-300">
          <ChevronRight size={16} /><span className="text-sm">رجوع</span>
        </button>
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🛡️</div>
          <h1 className="text-3xl font-black text-white mb-1">لوحة الإدارة</h1>
          <p className="text-gray-500 text-sm">وفر · للمديرين فقط</p>
        </div>
        <div style={glass} className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-3">أدخل رمز الدخول</p>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loginAdmin()}
              placeholder="••••"
              maxLength={6}
              className="w-full px-4 py-4 rounded-xl text-white text-center text-2xl tracking-widest outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${pinError ? 'rgba(248,113,113,0.5)' : 'rgba(124,58,237,0.2)'}`, letterSpacing: '0.5em' }}
            />
            {pinError && <p className="text-red-400 text-xs mt-2">رمز خاطئ، حاول مجدداً</p>}
          </div>
          <button onClick={loginAdmin} className="w-full py-3.5 rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg, #DC2626, #EF4444)', boxShadow: '0 4px 20px rgba(220,38,38,0.3)' }}>
            دخول
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen pb-8" style={{ background: '#0D0D1A' }}>
      <div className="sticky top-0 z-30 px-4 pt-4 pb-2" style={{ background: 'rgba(13,13,26,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
        <div className="flex items-center gap-3 mb-3">
        <button onClick={logout} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}><ChevronRight size={18} className="text-gray-300" /></button>
          <div>
            <h1 className="text-white font-black text-base">لوحة الإدارة</h1>
            <p className="text-gray-500 text-xs">وفر · نظرة كاملة</p>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
              style={tab === t.key ? { background: '#7C3AED', color: '#fff' } : { background: 'rgba(255,255,255,0.07)', color: '#9CA3AF' }}>
              <t.icon size={12} />{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'إجمالي الإيرادات', value: `${totalRevenue.toFixed(0)} ر`, icon: '💰', color: '#FCD34D', bg: 'rgba(252,211,77,0.1)' },
                { label: 'طلبات اليوم', value: todayOrders.length, icon: '📦', color: '#6EE7B7', bg: 'rgba(110,231,183,0.1)' },
                { label: 'البقالات المعتمدة', value: stores.filter(s => s.is_approved).length, icon: '🏪', color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
                { label: 'المناديب النشطون', value: drivers.filter(d => d.is_online).length, icon: '🛵', color: '#9F5FF1', bg: 'rgba(159,95,241,0.1)' },
              ].map(stat => (
                <div key={stat.label} className="p-4 rounded-2xl" style={{ background: stat.bg, border: `1px solid ${stat.color}22` }}>
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="font-black text-xl" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-gray-500 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
            <div style={glass} className="p-4">
              <h3 className="text-white font-bold mb-3 text-sm">آخر الطلبات</h3>
              <div className="space-y-2">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center justify-between p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div><p className="text-white text-xs font-medium">#{o.order_number}</p><p className="text-gray-600 text-xs">{o.store_name} · {o.district}</p></div>
                    <div className="text-left"><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${STATUS_COLORS[o.status]}22`, color: STATUS_COLORS[o.status] }}>{STATUS_AR[o.status]}</span><p className="text-gray-500 text-xs mt-0.5">{o.total_amount?.toFixed(2)} ر</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              {NEIGHBORHOOD_NAMES.map(d => {
                const cnt = orders.filter(o => o.district === d).length;
                return <div key={d} className="p-3 rounded-xl" style={glass}><p className="text-white font-bold text-sm">{cnt}</p><p className="text-gray-500 mt-0.5">{d}</p></div>;
              })}
            </div>
          </div>
        )}

        {tab === 'stores' && (
          <div className="space-y-3">
            <button onClick={() => setShowAddStore(true)} className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
              <Plus size={16} />إضافة بقالة جديدة
            </button>
            {showAddStore && (
              <div style={glass} className="p-4 space-y-4">
                <h3 className="text-white font-bold text-sm mb-1">بقالة جديدة</h3>

                {/* Store Name */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-gray-300 text-xs font-bold">اسم البقالة *</label>
                    <span title="اسم المتجر كما يظهر للعملاء في التطبيق" className="text-gray-600 cursor-help text-xs">ⓘ</span>
                  </div>
                  <input value={newStore.name} onChange={e => setNewStore(s => ({ ...s, name: e.target.value }))} placeholder="مثال: بقالة النور" className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
                  <p className="text-gray-600 text-xs mt-1">الاسم الذي سيظهر للعملاء عند تصفح المتاجر</p>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-gray-300 text-xs font-bold">كلمة المرور *</label>
                    <span title="كلمة سر تمنحها أنت لصاحب البقالة لتسجيل الدخول" className="text-gray-600 cursor-help text-xs">ⓘ</span>
                  </div>
                  <input value={newStore.password} onChange={e => setNewStore(s => ({ ...s, password: e.target.value }))} placeholder="مثال: store@2025" className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
                  <p className="text-gray-600 text-xs mt-1">ستشارك هذه الكلمة مع صاحب البقالة لتمكينه من الدخول للوحة التحكم</p>
                </div>

                {/* District */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-gray-300 text-xs font-bold">الحي</label>
                    <span title="الحي الذي تقع فيه البقالة — يتحدد به نطاق التوصيل" className="text-gray-600 cursor-help text-xs">ⓘ</span>
                  </div>
                  <button onClick={() => setDistrictSheetOpen(true)} className="w-full px-3 py-2.5 rounded-xl text-white text-sm flex items-center justify-between" style={{ background: 'rgba(13,13,26,0.9)', border: '1px solid rgba(124,58,237,0.2)' }}>
                    <span>{newStore.district}</span>
                    <ChevronDown size={14} className="text-gray-500" />
                  </button>
                  <BottomSheet open={districtSheetOpen} onClose={() => setDistrictSheetOpen(false)} title="اختر الحي" options={NEIGHBORHOOD_NAMES} value={newStore.district} onChange={v => setNewStore(s => ({ ...s, district: v }))} />
                  <p className="text-gray-600 text-xs mt-1">يظهر للعملاء الذين يبحثون في نفس المنطقة</p>
                </div>

                {/* Phone */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-gray-300 text-xs font-bold">رقم الجوال</label>
                    <span title="رقم التواصل مع صاحب البقالة" className="text-gray-600 cursor-help text-xs">ⓘ</span>
                  </div>
                  <input value={newStore.phone} onChange={e => setNewStore(s => ({ ...s, phone: e.target.value }))} placeholder="مثال: 0512345678" className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
                  <p className="text-gray-600 text-xs mt-1">يستخدم للتواصل مع البقالة عند الحاجة</p>
                </div>

                {/* Distance */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-gray-300 text-xs font-bold">المسافة عن مركز الحي</label>
                    <span title="المسافة التقريبية بين البقالة ومركز الحي — تؤثر على حساب رسوم التوصيل" className="text-gray-600 cursor-help text-xs">ⓘ</span>
                  </div>
                  <div className="relative">
                    <input type="number" min="0" step="0.1" value={newStore.distance_km} onChange={e => setNewStore(s => ({ ...s, distance_km: e.target.value }))} placeholder="1.5" className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none pl-12" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: '#9F5FF1' }}>كم</span>
                  </div>
                  <p className="text-gray-600 text-xs mt-1">مثال: 1.5 كم — تحدد بناءً عليها رسوم التوصيل للعميل</p>
                </div>

                {/* Prep Time */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-gray-300 text-xs font-bold">وقت التجهيز</label>
                    <span title="متوسط الوقت الذي تحتاجه البقالة لتجهيز الطلب قبل الاستلام" className="text-gray-600 cursor-help text-xs">ⓘ</span>
                  </div>
                  <div className="relative">
                    <input type="number" min="1" step="1" value={newStore.prep_time_minutes} onChange={e => setNewStore(s => ({ ...s, prep_time_minutes: e.target.value }))} placeholder="15" className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none pl-16" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: '#9F5FF1' }}>دقيقة</span>
                  </div>
                  <p className="text-gray-600 text-xs mt-1">مثال: 15 دقيقة — يظهر للعميل ضمن الوقت المتوقع للتوصيل</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button onClick={() => setShowAddStore(false)} className="py-2.5 rounded-xl text-gray-400 text-sm" style={{ background: 'rgba(255,255,255,0.05)' }}>إلغاء</button>
                  <button onClick={addStore} disabled={!newStore.name || !newStore.password} className="py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)' }}>حفظ ✓</button>
                </div>
              </div>
            )}
            {stores.map(s => (
              <div key={s.id} style={glass} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">{s.name}</p>
                    <p className="text-gray-500 text-xs">{s.district} · {s.is_active ? 'نشطة' : 'متوقفة'}</p>
                  </div>
                  <div className="flex gap-2">
                    {!s.is_approved ? (
                      <button onClick={() => approveStore(s.id, true)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>اعتماد</button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>✓ معتمدة</span>
                    )}
                    {s.is_approved && <button onClick={() => approveStore(s.id, false)} className="p-1.5 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)' }}><X size={14} style={{ color: '#F87171' }} /></button>}
                  </div>
                </div>
              </div>
            ))}
            {stores.length === 0 && <div className="py-12 text-center text-gray-600"><Store size={36} className="mx-auto mb-3 text-gray-700" /><p>لا توجد بقالات</p></div>}
          </div>
        )}

        {tab === 'drivers' && (
          <div className="space-y-3">
            {drivers.map(d => (
              <div key={d.id} style={glass} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">{d.name}</p>
                    <p className="text-gray-500 text-xs">{d.phone} · {d.neighborhood_group || d.district || 'غير محدد'}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={d.is_online ? { background: 'rgba(16,185,129,0.15)', color: '#10B981' } : { background: 'rgba(255,255,255,0.07)', color: '#6B7280' }}>{d.is_online ? '🟢 أونلاين' : '⚫ أوفلاين'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!d.is_approved ? (
                      <button onClick={() => approveDriver(d.id, true)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>اعتماد</button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>✓ معتمد</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {drivers.length === 0 && <div className="py-12 text-center text-gray-600"><Bike size={36} className="mx-auto mb-3 text-gray-700" /><p>لا توجد مناديب</p></div>}
          </div>
        )}

        {tab === 'orders' && (
          <div className="space-y-2">
            {orders.map(o => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-xl" style={glass}>
                <div><p className="text-white text-xs font-bold">#{o.order_number}</p><p className="text-gray-500 text-xs">{o.store_name} · {o.customer_phone}</p><p className="text-gray-600 text-xs">{new Date(o.created_date).toLocaleDateString('ar')}</p></div>
                <div className="text-left"><span className="text-xs px-2 py-0.5 rounded-full block mb-1 text-center" style={{ background: `${STATUS_COLORS[o.status]}22`, color: STATUS_COLORS[o.status] }}>{STATUS_AR[o.status]}</span><p className="text-gray-400 text-xs text-center">{o.total_amount?.toFixed(2)} ر</p></div>
              </div>
            ))}
            {orders.length === 0 && <div className="py-12 text-center text-gray-600"><ShoppingBag size={36} className="mx-auto mb-3 text-gray-700" /><p>لا توجد طلبات</p></div>}
          </div>
        )}

        {tab === 'fees' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(159,95,241,0.08))', border: '1px solid rgba(124,58,237,0.3)' }}>
              <h3 className="text-white font-bold mb-3 text-sm">🚚 نظام الرسوم الديناميكي</h3>
              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}><span>أقل من 2 كم</span><span className="font-bold text-white">6.99 ريال</span></div>
                <div className="flex justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}><span>2 إلى 5 كم</span><span className="font-bold text-white">9.99 ريال</span></div>
                <div className="flex justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}><span>وقت الزحمة</span><span className="font-bold" style={{ color: '#FCD34D' }}>+ 3 ريال</span></div>
                <div className="flex justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}><span>طلب سريع</span><span className="font-bold" style={{ color: '#FCD34D' }}>+ 3 ريال</span></div>
              </div>
            </div>
            <button onClick={() => setShowAddFee(true)} className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
              <Plus size={16} />إضافة شريحة رسوم
            </button>
            {showAddFee && (
              <div style={glass} className="p-4 space-y-3">
                <input value={newFee.label} onChange={e => setNewFee(f => ({ ...f, label: e.target.value }))} placeholder="التسمية" className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" value={newFee.distance_min_km} onChange={e => setNewFee(f => ({ ...f, distance_min_km: parseFloat(e.target.value) }))} placeholder="من (كم)" className="px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
                  <input type="number" value={newFee.distance_max_km} onChange={e => setNewFee(f => ({ ...f, distance_max_km: parseFloat(e.target.value) }))} placeholder="إلى (كم)" className="px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
                  <input type="number" value={newFee.base_fee} onChange={e => setNewFee(f => ({ ...f, base_fee: e.target.value }))} placeholder="الرسوم" className="px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowAddFee(false)} className="py-2.5 rounded-xl text-gray-400 text-sm" style={{ background: 'rgba(255,255,255,0.05)' }}>إلغاء</button>
                  <button onClick={addFee} className="py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)' }}>حفظ</button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {fees.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-xl" style={glass}>
                  <div><p className="text-white text-sm font-medium">{f.label}</p><p className="text-gray-500 text-xs">{f.distance_min_km} - {f.distance_max_km} كم</p></div>
                  <span className="font-black text-sm" style={{ color: '#9F5FF1' }}>{f.base_fee} ر</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'catalog' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(159,95,241,0.08))', border: '1px solid rgba(124,58,237,0.3)' }}>
              <p className="text-white font-bold text-sm mb-1">📚 كتالوج المنتجات الموحد</p>
              <p className="text-gray-400 text-xs">منتجات مشتركة بين جميع البقالات — كل بقالة تحدد سعرها ومخزونها فقط</p>
            </div>
            <button onClick={() => navigate('/catalog')} className="w-full py-4 rounded-2xl text-white font-black flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
              <BookOpen size={18} />فتح كتالوج المنتجات
            </button>
          </div>
        )}

        {tab === 'zones' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(59,130,246,0.06))', border: '1px solid rgba(96,165,250,0.25)' }}>
              <p className="text-white font-bold text-sm mb-1">🗺️ مناطق الأحياء والتوصيل</p>
              <p className="text-gray-400 text-xs">الجنادرية · الشروق · النظيم · المعالي · غصون · الندوة — رسوم حسب المسافة</p>
            </div>
            <button onClick={() => navigate('/neighborhood-zones')} className="w-full py-4 rounded-2xl text-white font-black flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)', boxShadow: '0 4px 20px rgba(37,99,235,0.3)' }}>
              <MapPin size={18} />إدارة الأحياء
            </button>
          </div>
        )}
      </div>
    </div>
  );
}