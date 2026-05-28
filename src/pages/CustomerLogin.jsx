import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, CheckCircle, ChevronRight } from 'lucide-react';

const glass = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(124, 58, 237, 0.25)',
  borderRadius: '20px'
};

export default function CustomerLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = () => {
    if (phone.length < 10) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('otp'); }, 1200);
  };

  const verifyOtp = () => {
    if (otp.length < 4) return;
    setLoading(true);
    setTimeout(() => {
      const userId = 'cust_' + phone;
      localStorage.setItem('wafarCustomer', JSON.stringify({ phone, name: name || `مستخدم ${phone.slice(-4)}`, district: 'الجنادرية', user_id: userId, verified: true }));
      setLoading(false);
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get('returnUrl');
      navigate(returnUrl || '/home');
    }, 1000);
  };

  return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #1A1A2E 60%, #0D0D1A 100%)' }}>

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="w-full max-w-sm relative">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-gray-500 mb-6 hover:text-gray-300 transition-colors">
          <ChevronRight size={16} />
          <span className="text-sm">رجوع</span>
        </button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-1" style={{ color: '#fff', textShadow: '0 0 30px rgba(159,95,241,0.6)' }}>وفر</h1>
          <p className="text-gray-400 text-sm">{step === 'phone' ? 'أدخل رقم جوالك للمتابعة' : 'أدخل رمز التحقق'}</p>
        </div>

        <div style={glass} className="p-6">
          {step === 'phone' ? (
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">الاسم (اختياري)</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="اسمك الكريم"
                  className="w-full px-4 py-3 rounded-xl text-white text-right outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }}
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-2 block">رقم الجوال</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    maxLength={10}
                    className="flex-1 px-4 py-3 rounded-xl text-white text-right outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }}
                  />
                  <span className="px-3 py-3 rounded-xl text-gray-300 text-sm flex items-center"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }}>
                    🇸🇦 +966
                  </span>
                </div>
              </div>
              <button
                onClick={sendOtp}
                disabled={phone.length < 10 || loading}
                className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
              >
                {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(124,58,237,0.2)', border: '2px solid rgba(124,58,237,0.4)' }}>
                  <Phone size={24} style={{ color: '#9F5FF1' }} />
                </div>
                <p className="text-gray-300 text-sm">تم إرسال رمز التحقق إلى</p>
                <p className="text-white font-bold">{phone}</p>
              </div>
              <input
                type="number"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="أدخل الرمز المكون من 4 أرقام"
                maxLength={4}
                className="w-full px-4 py-3 rounded-xl text-white text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-purple-500"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,58,237,0.2)' }}
              />
              <p className="text-gray-600 text-xs text-center">للتجربة: أي رمز مكون من 4 أرقام</p>
              <button
                onClick={verifyOtp}
                disabled={otp.length < 4 || loading}
                className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
              >
                {loading ? 'جاري التحقق...' : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle size={18} />تأكيد الدخول
                  </span>
                )}
              </button>
              <button onClick={() => setStep('phone')} className="w-full text-gray-500 text-sm text-center hover:text-gray-300">
                تغيير رقم الجوال
              </button>
            </div>
          )}
        </div>

        {/* Footer links */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button onClick={() => navigate('/privacy')} className="text-gray-600 text-xs hover:text-gray-400 transition-colors underline underline-offset-2">
            سياسة الخصوصية
          </button>
          <span className="text-gray-800 text-xs">·</span>
          <button onClick={() => navigate('/delete-account')} className="text-gray-600 text-xs hover:text-gray-400 transition-colors underline underline-offset-2">
            حذف الحساب
          </button>
        </div>
      </div>
    </div>
  );
}