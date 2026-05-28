import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Bike, Shield, MapPin } from 'lucide-react';
import { useDriver } from '@/context/DriverContext';
import { DRIVER_GROUP_OPTIONS } from '@/lib/neighborhoodZones';

export default function DriverLogin() {
  const navigate = useNavigate();
  const { login } = useDriver();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [group, setGroup] = useState('الجنادرية');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!name.trim() || !phone.trim()) return;
    setLoading(true);
    try {
      await login({ name: name.trim(), phone: phone.trim(), neighborhood_group: group });
      navigate('/driver/home', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-[#07070F]">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[80px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-violet-600/10 blur-[70px]" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-1 text-sm text-gray-500 transition hover:text-gray-300"
        >
          <ChevronRight size={16} />
          رجوع
        </button>

        <div className="mb-10 animate-fade-up text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
            <Bike size={36} className="text-white" strokeWidth={2.2} />
          </div>
          <h1 className="mb-1 text-3xl font-black text-white">وفر · المندوب</h1>
          <p className="text-sm text-gray-500">توصيل حيّك باحترافية</p>
        </div>

        <div className="animate-fade-up space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl" style={{ animationDelay: '80ms' }}>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-400">الاسم</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="محمد العتيبي"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-sm text-white outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-400">رقم الجوال</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              type="tel"
              dir="ltr"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-left text-sm text-white outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gray-400">
              <MapPin size={12} className="text-emerald-400" />
              مجموعة الحي
            </label>
            <div className="flex flex-wrap gap-2">
              {DRIVER_GROUP_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroup(g)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    group === g
                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'bg-white/[0.05] text-gray-400 ring-1 ring-white/10 hover:bg-white/[0.08]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-gray-600">ستظهر لك طلبات هذه المجموعة فقط</p>
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-500 py-4 text-sm font-black text-white shadow-lg shadow-emerald-500/25 transition active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? 'جاري الدخول...' : 'ابدأ التوصيل'}
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-600">
          <Shield size={14} className="text-emerald-600" />
          <span>حساب آمن · موصل الحي</span>
        </div>
      </div>
    </div>
  );
}
