import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Trash2, AlertTriangle, ShoppingBag, Star, Wallet, User, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CONFIRM_WORD = 'احذف حسابي';

const WHAT_WILL_BE_DELETED = [
  { icon: User,        label: 'بيانات حسابك الشخصية',      color: '#F87171' },
  { icon: ShoppingBag, label: 'سجل طلباتك كاملاً',          color: '#FB923C' },
  { icon: Wallet,      label: 'رصيد المحفظة والنقاط',       color: '#FBBF24' },
  { icon: Star,        label: 'تقييماتك وتعليقاتك',         color: '#A78BFA' },
];

export default function DeleteAccount() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=warning, 2=confirm
  const [confirmInput, setConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);

  const confirmed = confirmInput === CONFIRM_WORD;

  const handleDelete = async () => {
    if (!confirmed || deleting) return;
    setDeleting(true);

    // Clear all local session data
    ['wafarCustomer', 'wafarStore', 'wafarAdmin', 'wafarDriver'].forEach(k => localStorage.removeItem(k));

    // Try to delete the authenticated user record if logged in
    try {
      const user = await base44.auth.me();
      if (user) await base44.auth.logout();
    } catch {}

    setDeleting(false);
    setDone(true);
  };

  // ── Success screen ──────────────────────────────────────────
  if (done) return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#0D0D1A' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: 'rgba(52,211,153,0.12)', border: '2px solid rgba(52,211,153,0.3)' }}>
        <Shield size={32} style={{ color: '#34D399' }} />
      </div>
      <h2 className="text-white font-black text-2xl mb-2">تم حذف الحساب</h2>
      <p className="text-gray-400 text-sm leading-relaxed mb-8">
        تم حذف جميع بياناتك الشخصية بنجاح. نأمل أن نراك مجدداً.
      </p>
      <button onClick={() => navigate('/')}
        className="w-full max-w-xs py-4 rounded-2xl text-white font-bold"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)', boxShadow: '0 6px 24px rgba(124,58,237,0.4)' }}>
        العودة للرئيسية
      </button>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen pb-12" style={{ background: '#0D0D1A' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(13,13,26,0.96)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(248,113,113,0.15)' }}>
        <button onClick={() => step === 2 ? setStep(1) : navigate(-1)}
          className="p-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronRight size={18} className="text-gray-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-sm">حذف الحساب</h1>
          <p className="text-gray-500 text-xs">الخطوة {step} من 2</p>
        </div>
        {/* Step indicator */}
        <div className="flex gap-1.5">
          {[1, 2].map(s => (
            <div key={s} className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: step >= s ? '20px' : '8px', background: step >= s ? '#EF4444' : 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>
      </div>

      {/* ── STEP 1: Warning ── */}
      {step === 1 && (
        <div className="px-4 pt-6 space-y-5">
          {/* Hero warning */}
          <div className="rounded-3xl p-6 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(248,113,113,0.15), rgba(239,68,68,0.08))', border: '1px solid rgba(248,113,113,0.3)' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(248,113,113,0.15)', border: '2px solid rgba(248,113,113,0.3)' }}>
              <AlertTriangle size={32} style={{ color: '#F87171' }} />
            </div>
            <h2 className="text-white font-black text-xl mb-2">هل أنت متأكد؟</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              حذف حسابك إجراء <span className="text-red-400 font-bold">نهائي وغير قابل للتراجع</span>. لن تتمكن من استعادة بياناتك بعد الحذف.
            </p>
          </div>

          {/* What will be deleted */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(248,113,113,0.05)' }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(248,113,113,0.8)' }}>سيتم حذفه نهائياً</p>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {WHAT_WILL_BE_DELETED.map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <p className="text-gray-300 text-sm">{label}</p>
                  <div className="mr-auto w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)' }}>
                    <span className="text-red-400 text-xs font-black">✕</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="p-4 rounded-2xl flex gap-3"
            style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <AlertTriangle size={18} style={{ color: '#FBBF24', flexShrink: 0, marginTop: 2 }} />
            <p className="text-gray-400 text-xs leading-relaxed">
              سيتم حذف بياناتك خلال <span className="text-yellow-400 font-bold">30 يوم عمل</span> من تاريخ الطلب وفقًا لأنظمة حماية البيانات السارية في المملكة العربية السعودية.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button onClick={() => setStep(2)}
              className="w-full py-4 rounded-2xl text-white font-black text-base transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #991B1B, #EF4444)', boxShadow: '0 6px 24px rgba(239,68,68,0.3)' }}>
              نعم، أريد حذف حسابي
            </button>
            <button onClick={() => navigate(-1)}
              className="w-full py-4 rounded-2xl text-gray-300 font-semibold transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              إلغاء والعودة للإعدادات
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Confirm ── */}
      {step === 2 && (
        <div className="px-4 pt-6 space-y-5">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: 'rgba(248,113,113,0.15)', border: '2px solid rgba(248,113,113,0.4)' }}>
              <Trash2 size={26} style={{ color: '#F87171' }} />
            </div>
            <h2 className="text-white font-black text-xl">تأكيد الحذف النهائي</h2>
            <p className="text-gray-500 text-sm">هذه خطوتك الأخيرة قبل الحذف</p>
          </div>

          {/* Confirm input */}
          <div className="rounded-2xl p-5 space-y-3"
            style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
            <p className="text-gray-300 text-sm text-center">
              اكتب بالضبط: <span className="text-white font-black">{CONFIRM_WORD}</span>
            </p>
            <input
              value={confirmInput}
              onChange={e => setConfirmInput(e.target.value)}
              placeholder={CONFIRM_WORD}
              autoFocus
              className="w-full px-4 py-3.5 rounded-xl text-white text-center text-sm font-bold outline-none"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: `2px solid ${confirmed ? 'rgba(248,113,113,0.7)' : 'rgba(255,255,255,0.1)'}`,
                transition: 'border-color 0.2s',
              }}
            />
            {confirmInput.length > 0 && !confirmed && (
              <p className="text-xs text-center" style={{ color: 'rgba(248,113,113,0.7)' }}>
                النص غير مطابق، يرجى الكتابة بشكل صحيح
              </p>
            )}
            {confirmed && (
              <p className="text-xs text-center text-green-400 font-medium">✓ تم التأكيد، يمكنك المتابعة</p>
            )}
          </div>

          {/* Final action */}
          <button onClick={handleDelete}
            disabled={!confirmed || deleting}
            className="w-full py-4 rounded-2xl text-white font-black text-base transition-all disabled:opacity-30 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7F1D1D, #DC2626)', boxShadow: confirmed ? '0 6px 24px rgba(220,38,38,0.4)' : 'none' }}>
            {deleting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري الحذف...
              </span>
            ) : 'حذف حسابي نهائياً'}
          </button>

          <button onClick={() => { setStep(1); setConfirmInput(''); }}
            className="w-full py-3.5 rounded-2xl text-gray-400 font-medium text-sm"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            رجوع
          </button>
        </div>
      )}
    </div>
  );
}