import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ChevronRight, ArrowLeft } from 'lucide-react';

const ROLES = [
  { id: 'customer', label: 'عميل', sub: 'تسوق وتتبع طلباتك', icon: '🛒', color: '#7C3AED', glow: 'rgba(124,58,237,0.4)' },
  { id: 'driver',   label: 'مندوب توصيل', sub: 'استقبل طلبات واكسب', icon: '🛵', color: '#059669', glow: 'rgba(5,150,105,0.4)' },
  { id: 'store',    label: 'صاحب بقالة', sub: 'أدر متجرك ومنتجاتك', icon: '🏪', color: '#D97706', glow: 'rgba(217,119,6,0.4)' },
];

const glass = (border) => ({
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  border: `1px solid ${border}`,
  borderRadius: '20px',
});

export default function AppLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState('role'); // 'role' | 'form'
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);

  // Customer fields
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [name, setName] = useState('');

  // Driver fields
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  // Store fields
  const [storeName, setStoreName] = useState('');
  const [storePassword, setStorePassword] = useState('');
  const [storeError, setStoreError] = useState('');

  const selectedRole = ROLES.find(r => r.id === role);

  const handleSelectRole = (r) => {
    setRole(r);
    setStep('form');
  };

  const sendOtp = () => {
    if (!phone || phone.length < 9) return;
    setOtpSent(true);
  };

  const loginCustomer = () => {
    if (!name || !phone) return;
    const customer = { name, phone, district: 'الجنادرية' };
    localStorage.setItem('wafarCustomer', JSON.stringify(customer));
    navigate('/home');
  };

  const loginDriver = async () => {
    if (!driverName || !driverPhone) return;
    setLoading(true);
    const trimmedName = driverName.trim();
    const trimmedPhone = driverPhone.trim();
    const group = 'الجنادرية';

    const d = {
      id: `demo-${trimmedPhone.replace(/\D/g, '')}`,
      name: trimmedName,
      phone: trimmedPhone,
      neighborhood_group: group,
      district: group,
      online_status: true,
      is_online: true,
      is_approved: true,
      daily_earnings: 0,
      total_orders: 0,
      status: 'available',
      _localDemo: true,
    };
    localStorage.setItem('wafarDriver', JSON.stringify(d));
    setLoading(false);
    navigate('/driver/home');
  };

  const loginStore = async () => {
    if (!storeName || !storePassword) return;
    setStoreError('');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('verifyStorePassword', { storeName: storeName.trim(), password: storePassword });
      if (res.data?.success) {
        localStorage.setItem('wafarStore', JSON.stringify(res.data.store));
        navigate('/store');
      } else {
        setStoreError(res.data?.error || 'حدث خطأ، حاول مجدداً');
      }
    } catch {
      setStoreError('حدث خطأ في الاتصال، حاول مجدداً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex flex-col" style={{ background: '#0D0D1A' }}>
      {/* Glow bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-6 pb-4">
        <button onClick={() => step === 'form' ? setStep('role') : navigate('/')}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors">
          <ChevronRight size={18} />
          <span className="text-sm">رجوع</span>
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-black text-white" style={{ textShadow: '0 0 20px rgba(159,95,241,0.6)' }}>وفر</h1>
        </div>
        <div className="w-14" />
      </div>

      <div className="relative z-10 flex-1 px-4 pb-10">
        {step === 'role' && (
          <div className="pt-4">
            <div className="text-center mb-8">
              <h2 className="text-white text-2xl font-black mb-2">أهلاً بك 👋</h2>
              <p className="text-gray-500 text-sm">اختر نوع حسابك للمتابعة</p>
            </div>
            <div className="space-y-4">
              {ROLES.map(r => (
                <button key={r.id} onClick={() => handleSelectRole(r.id)}
                  className="w-full text-right transition-all active:scale-98 hover:scale-101"
                  style={glass(`${r.color}66`)}>
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{ background: `${r.color}22`, border: `1px solid ${r.color}44` }}>
                      {r.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-black text-lg">{r.label}</p>
                      <p className="text-gray-500 text-sm">{r.sub}</p>
                    </div>
                    <ArrowLeft size={18} style={{ color: r.color }} />
                  </div>
                  <div className="h-0.5 mx-4 mb-0 rounded-full opacity-40" style={{ background: `linear-gradient(90deg, ${r.color}, transparent)` }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'form' && selectedRole && (
          <div className="pt-4">
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">{selectedRole.icon}</div>
              <h2 className="text-white text-xl font-black">{selectedRole.label}</h2>
              <p className="text-gray-500 text-sm mt-1">{selectedRole.sub}</p>
            </div>

            {/* Customer Form */}
            {role === 'customer' && (
              <div style={glass(`${selectedRole.color}44`)} className="p-5 space-y-4">
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="الاسم الكريم"
                  className="w-full px-4 py-3.5 rounded-2xl text-white text-right outline-none text-sm"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.25)' }} />
                <div className="flex gap-2">
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="رقم الجوال" type="tel"
                    className="flex-1 px-4 py-3.5 rounded-2xl text-white text-right outline-none text-sm"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.25)' }} />
                  {!otpSent && (
                    <button onClick={sendOtp}
                      className="px-4 py-3.5 rounded-2xl text-white text-sm font-bold whitespace-nowrap"
                      style={{ background: `${selectedRole.color}33`, border: `1px solid ${selectedRole.color}55`, color: selectedRole.color }}>
                      إرسال
                    </button>
                  )}
                </div>
                {otpSent && (
                  <input value={otp} onChange={e => setOtp(e.target.value)}
                    placeholder="رمز التحقق (أي رقم)"
                    className="w-full px-4 py-3.5 rounded-2xl text-white text-right outline-none text-sm text-center tracking-widest"
                    style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${selectedRole.color}55` }} />
                )}
                <button onClick={loginCustomer}
                  disabled={!name || !phone}
                  className="w-full py-4 rounded-2xl text-white font-black text-base transition-all disabled:opacity-40"
                  style={{ background: `linear-gradient(135deg, #4C1D95, #7C3AED)`, boxShadow: '0 8px 30px rgba(124,58,237,0.4)' }}>
                  دخول التطبيق ←
                </button>
              </div>
            )}

            {/* Driver Form */}
            {role === 'driver' && (
              <div style={glass(`${selectedRole.color}44`)} className="p-5 space-y-4">
                <input value={driverName} onChange={e => setDriverName(e.target.value)}
                  placeholder="اسمك الكريم"
                  className="w-full px-4 py-3.5 rounded-2xl text-white text-right outline-none text-sm"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(16,185,129,0.25)' }} />
                <input value={driverPhone} onChange={e => setDriverPhone(e.target.value)}
                  placeholder="رقم الجوال" type="tel"
                  className="w-full px-4 py-3.5 rounded-2xl text-white text-right outline-none text-sm"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(16,185,129,0.25)' }} />
                <button onClick={loginDriver} disabled={loading || !driverName || !driverPhone}
                  className="w-full py-4 rounded-2xl text-white font-black text-base transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #064E3B, #059669)', boxShadow: '0 8px 30px rgba(5,150,105,0.4)' }}>
                  {loading ? '⏳ جاري التحقق...' : 'دخول تطبيق المندوب ←'}
                </button>
              </div>
            )}

            {/* Store Form */}
            {role === 'store' && (
              <div style={glass(`${selectedRole.color}44`)} className="p-5 space-y-4">
                <input value={storeName} onChange={e => { setStoreName(e.target.value); setStoreError(''); }}
                  placeholder="اسم البقالة كما سجلته الإدارة"
                  className="w-full px-4 py-3.5 rounded-2xl text-white text-right outline-none text-sm"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(217,119,6,0.25)' }} />
                <input value={storePassword} onChange={e => { setStorePassword(e.target.value); setStoreError(''); }}
                  placeholder="كلمة المرور (من الإدارة)" type="password"
                  className="w-full px-4 py-3.5 rounded-2xl text-white text-right outline-none text-sm"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(217,119,6,0.25)' }} />
                {storeError && (
                  <p className="text-xs text-center py-2 px-3 rounded-xl" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}>{storeError}</p>
                )}
                <button onClick={loginStore} disabled={loading || !storeName || !storePassword}
                  className="w-full py-4 rounded-2xl text-white font-black text-base transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #78350F, #D97706)', boxShadow: '0 8px 30px rgba(217,119,6,0.4)' }}>
                  {loading ? 'جاري التحقق...' : 'دخول لوحة البقالة ←'}
                </button>
                <p className="text-center text-xs text-gray-600">لست مسجلاً؟{' '}<button onClick={() => navigate('/store-register')} className="underline" style={{ color: '#9F5FF1' }}>تواصل مع الإدارة</button></p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}