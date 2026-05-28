import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, ArrowUpCircle, ArrowDownCircle, Wallet as WalletIcon, CheckCircle2, Clock } from 'lucide-react';
import CustomerBottomNav from '../components/CustomerBottomNav';
import { base44 } from '@/api/base44Client';

const glass = { background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '20px' };

const TOP_UP_AMOUNTS = [20, 50, 100, 200, 500];

const PAYMENT_METHODS = [
  { key: 'mada', label: 'مدى', icon: '💳', desc: 'بطاقة مدى' },
  { key: 'visa', label: 'Visa / Mastercard', icon: '💳', desc: 'بطاقة ائتمانية' },
  { key: 'stcpay', label: 'STC Pay', icon: '📱', desc: 'محفظة STC' },
  { key: 'apple_pay', label: 'Apple Pay', icon: '🍎', desc: 'ادفع بـ Apple Pay' },
  { key: 'bank', label: 'تحويل بنكي', icon: '🏦', desc: 'تحويل مباشر' },
];

export default function Wallet() {
  const navigate = useNavigate();
  const [customer] = useState(() => JSON.parse(localStorage.getItem('wafarCustomer') || '{"name":"زائر","phone":"","district":"الجنادرية"}'));
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { loadWallet(); }, []);

  const loadWallet = async () => {
    setLoading(true);
    const wallets = await base44.entities.Wallet.filter({ customer_phone: customer.phone });
    let w = wallets[0];
    if (!w && customer.phone) {
      w = await base44.entities.Wallet.create({ customer_phone: customer.phone, customer_name: customer.name, balance: 0 });
    }
    setWallet(w || { balance: 0 });

    if (w) {
      const txs = await base44.entities.WalletTransaction.filter({ customer_phone: customer.phone }, '-created_date', 50);
      setTransactions(txs);
    }
    setLoading(false);
  };

  const finalAmount = selectedAmount || parseFloat(customAmount) || 0;

  const handleTopUp = async () => {
    if (!finalAmount || finalAmount < 5 || !selectedMethod || !wallet?.id) return;
    setProcessing(true);
    const newBalance = (wallet.balance || 0) + finalAmount;
    await base44.entities.Wallet.update(wallet.id, { balance: newBalance });
    await base44.entities.WalletTransaction.create({
      customer_phone: customer.phone,
      wallet_id: wallet.id,
      type: 'credit',
      amount: finalAmount,
      description: `شحن رصيد عبر ${PAYMENT_METHODS.find(m => m.key === selectedMethod)?.label}`,
      payment_method: selectedMethod,
      balance_after: newBalance,
    });
    setProcessing(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setShowTopUp(false);
      setSelectedAmount(null);
      setCustomAmount('');
      setSelectedMethod(null);
      loadWallet();
    }, 2000);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D1A' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-900 border-t-purple-400 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">جاري تحميل المحفظة...</p>
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen pb-24" style={{ background: '#0D0D1A' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(13,13,26,0.96)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
        <button onClick={() => navigate('/home')} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronRight size={18} className="text-gray-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-base">محفظتي</h1>
          <p className="text-gray-500 text-xs">{customer.name}</p>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Balance Card */}
        <div className="relative rounded-3xl p-6 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #4C1D95, #7C3AED, #9F5FF1)', boxShadow: '0 16px 48px rgba(124,58,237,0.4)' }}>
          {/* decorative circles */}
          <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full opacity-10" style={{ background: 'rgba(255,255,255,0.3)' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <WalletIcon size={20} className="text-purple-200" />
              <span className="text-purple-200 text-sm font-medium">رصيد المحفظة</span>
            </div>
            <div className="mb-4">
              <span className="text-white font-black" style={{ fontSize: '42px', lineHeight: 1 }}>{(wallet?.balance || 0).toFixed(2)}</span>
              <span className="text-purple-200 text-lg mr-1">ريال</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-purple-300 text-xs">{customer.phone || 'لم يتم تسجيل الدخول'}</span>
              <div className="flex items-center gap-1 px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                <span className="text-white text-xs font-semibold">نشطة</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Up Button */}
        <button
          onClick={() => setShowTopUp(true)}
          className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-98"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)', boxShadow: '0 6px 24px rgba(124,58,237,0.4)' }}
        >
          <Plus size={20} />
          شحن الرصيد
        </button>

        {/* Top-Up Sheet */}
        {showTopUp && (
          <div className="rounded-3xl overflow-hidden" style={{ ...glass, border: '1px solid rgba(124,58,237,0.35)' }}>
            {success ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(110,231,183,0.15)', border: '2px solid #6EE7B7' }}>
                  <CheckCircle2 size={32} style={{ color: '#6EE7B7' }} />
                </div>
                <p className="text-white font-black text-xl mb-1">تم الشحن بنجاح! 🎉</p>
                <p className="text-gray-400 text-sm">تم إضافة {finalAmount} ريال لمحفظتك</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-base">شحن الرصيد</h3>
                  <button onClick={() => setShowTopUp(false)} className="text-gray-500 text-xl">✕</button>
                </div>

                {/* Amount Selection */}
                <div>
                  <p className="text-gray-400 text-xs mb-2">اختر المبلغ</p>
                  <div className="grid grid-cols-5 gap-2">
                    {TOP_UP_AMOUNTS.map(amt => (
                      <button key={amt} onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                        className="py-2.5 rounded-xl text-sm font-bold transition-all"
                        style={selectedAmount === amt
                          ? { background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)', color: '#fff', boxShadow: '0 0 14px rgba(124,58,237,0.5)' }
                          : { background: 'rgba(255,255,255,0.06)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.08)' }
                        }>
                        {amt}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.2)' }}>
                    <span className="text-gray-500 text-sm">ريال</span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                      placeholder="أو أدخل مبلغاً آخر (الحد الأدنى 5)"
                      className="flex-1 bg-transparent text-white text-sm outline-none text-right"
                    />
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <p className="text-gray-400 text-xs mb-2">طريقة الدفع</p>
                  <div className="space-y-2">
                    {PAYMENT_METHODS.map(m => (
                      <button key={m.key} onClick={() => setSelectedMethod(m.key)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-right"
                        style={selectedMethod === m.key
                          ? { background: 'rgba(124,58,237,0.2)', border: '1.5px solid #7C3AED' }
                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }
                        }>
                        <span className="text-xl">{m.icon}</span>
                        <div className="flex-1">
                          <p className="text-white text-sm font-semibold">{m.label}</p>
                          <p className="text-gray-500 text-xs">{m.desc}</p>
                        </div>
                        {selectedMethod === m.key && <CheckCircle2 size={18} style={{ color: '#9F5FF1' }} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confirm */}
                <button
                  onClick={handleTopUp}
                  disabled={!finalAmount || finalAmount < 5 || !selectedMethod || processing}
                  className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-40 transition-all"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}
                >
                  {processing ? '⏳ جاري المعالجة...' : `شحن ${finalAmount || 0} ريال`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Transactions */}
        <div>
          <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <Clock size={15} style={{ color: '#9F5FF1' }} />
            سجل العمليات
          </h3>
          {transactions.length === 0 ? (
            <div className="text-center py-10" style={glass}>
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-500 text-sm">لا توجد عمليات بعد</p>
              <p className="text-gray-600 text-xs mt-1">ستظهر هنا بعد أول شحن أو دفع</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 p-4 rounded-2xl" style={glass}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={tx.type === 'credit'
                      ? { background: 'rgba(110,231,183,0.12)', border: '1px solid rgba(110,231,183,0.2)' }
                      : { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }
                    }>
                    {tx.type === 'credit'
                      ? <ArrowUpCircle size={20} style={{ color: '#6EE7B7' }} />
                      : <ArrowDownCircle size={20} style={{ color: '#F87171' }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{formatDate(tx.created_date)}</p>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className="font-black text-sm" style={{ color: tx.type === 'credit' ? '#6EE7B7' : '#F87171' }}>
                      {tx.type === 'credit' ? '+' : '-'}{tx.amount?.toFixed(2)} ر
                    </p>
                    {tx.balance_after != null && (
                      <p className="text-gray-600 text-xs">رصيد: {tx.balance_after?.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <CustomerBottomNav active="wallet" />
    </div>
  );
}