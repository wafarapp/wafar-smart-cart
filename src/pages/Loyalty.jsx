import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Star, Gift, Zap, TrendingUp, Award, ArrowUpCircle, ArrowDownCircle, Copy, Check } from 'lucide-react';
import CustomerBottomNav from '../components/CustomerBottomNav';
import { base44 } from '@/api/base44Client';

const TIERS = {
  'برونزي':  { min: 0,    max: 499,  color: '#CD7F32', bg: 'rgba(205,127,50,0.15)',  icon: '🥉', next: 'فضي' },
  'فضي':    { min: 500,  max: 1499, color: '#C0C0C0', bg: 'rgba(192,192,192,0.15)', icon: '🥈', next: 'ذهبي' },
  'ذهبي':   { min: 1500, max: 3999, color: '#FFD700', bg: 'rgba(255,215,0,0.15)',   icon: '🥇', next: 'بلاتيني' },
  'بلاتيني': { min: 4000, max: null, color: '#A78BFA', bg: 'rgba(167,139,250,0.15)', icon: '💎', next: null },
};

const REDEEM_OPTIONS = [
  { key: 'wallet_100', points: 100, label: '5 ريال رصيد محفظة', desc: '100 نقطة = 5 ريال', icon: '💰', type: 'wallet', value: 5 },
  { key: 'wallet_200', points: 200, label: '11 ريال رصيد محفظة', desc: '200 نقطة = 11 ريال (توفير إضافي)', icon: '💰', type: 'wallet', value: 11 },
  { key: 'coupon_10', points: 150, label: 'كوبون خصم 10%', desc: '150 نقطة = خصم 10% على طلبك القادم', icon: '🎟️', type: 'coupon', value: 10 },
  { key: 'coupon_20', points: 350, label: 'كوبون خصم 20%', desc: '350 نقطة = خصم 20% على طلبك القادم', icon: '🎟️', type: 'coupon', value: 20 },
  { key: 'free_delivery', points: 80, label: 'توصيل مجاني', desc: '80 نقطة = توصيل مجاني لطلب واحد', icon: '🛵', type: 'coupon', value: 0 },
];

function getTier(points) {
  if (points >= 4000) return 'بلاتيني';
  if (points >= 1500) return 'ذهبي';
  if (points >= 500) return 'فضي';
  return 'برونزي';
}

function TierProgressBar({ totalEarned }) {
  const tier = getTier(totalEarned);
  const info = TIERS[tier];
  const nextTierMin = info.next ? TIERS[info.next].min : null;
  const progress = nextTierMin
    ? Math.min(100, ((totalEarned - info.min) / (nextTierMin - info.min)) * 100)
    : 100;

  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs mb-1.5">
        <span style={{ color: info.color }} className="font-semibold">{info.icon} {tier}</span>
        {info.next
          ? <span className="text-gray-500">{nextTierMin - totalEarned} نقطة للوصول لـ {info.next}</span>
          : <span style={{ color: info.color }}>أعلى مستوى 🏆</span>
        }
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${info.color}, ${info.color}aa)`, boxShadow: `0 0 8px ${info.color}66` }} />
      </div>
    </div>
  );
}

export default function LoyaltyPage() {
  const navigate = useNavigate();
  const [customer] = useState(() => JSON.parse(localStorage.getItem('wafarCustomer') || '{"name":"زائر","phone":"","district":"الجنادرية"}'));
  const [loyalty, setLoyalty] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [copiedCoupon, setCopiedCoupon] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { loadLoyalty(); }, []);

  const loadLoyalty = async () => {
    setLoading(true);
    const records = await base44.entities.LoyaltyPoints.filter({ customer_phone: customer.phone });
    let rec = records[0];
    if (!rec && customer.phone) {
      rec = await base44.entities.LoyaltyPoints.create({
        customer_phone: customer.phone,
        customer_name: customer.name,
        points_balance: 0, total_earned: 0, total_redeemed: 0,
        tier: 'برونزي',
      });
    }
    setLoyalty(rec || { points_balance: 0, total_earned: 0, total_redeemed: 0, tier: 'برونزي' });
    if (rec) {
      const txs = await base44.entities.LoyaltyTransaction.filter({ customer_phone: customer.phone }, '-created_date', 50);
      setTransactions(txs);
    }
    setLoading(false);
  };

  const handleRedeem = async (option) => {
    if (!loyalty?.id || loyalty.points_balance < option.points) return;
    setRedeeming(option.key);

    const newBalance = loyalty.points_balance - option.points;
    const newRedeemed = (loyalty.total_redeemed || 0) + option.points;
    const newTier = getTier(loyalty.total_earned || 0);
    await base44.entities.LoyaltyPoints.update(loyalty.id, {
      points_balance: newBalance,
      total_redeemed: newRedeemed,
      tier: newTier,
    });

    if (option.type === 'wallet') {
      // Add to wallet
      const wallets = await base44.entities.Wallet.filter({ customer_phone: customer.phone });
      if (wallets[0]) {
        const newWalBal = (wallets[0].balance || 0) + option.value;
        await base44.entities.Wallet.update(wallets[0].id, { balance: newWalBal });
        await base44.entities.WalletTransaction.create({
          customer_phone: customer.phone, wallet_id: wallets[0].id,
          type: 'credit', amount: option.value,
          description: `استبدال ${option.points} نقطة ولاء`,
          balance_after: newWalBal,
        });
      }
    }

    await base44.entities.LoyaltyTransaction.create({
      customer_phone: customer.phone,
      loyalty_id: loyalty.id,
      type: 'redeem',
      points: option.points,
      description: option.label,
      balance_after: newBalance,
      redeem_type: option.type,
    });

    if (option.type === 'coupon') {
      const code = 'WAFAR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      setSuccessMsg(`تم إنشاء كوبونك: ${code}`);
      setCopiedCoupon(code);
    } else {
      setSuccessMsg(`تم إضافة ${option.value} ريال لمحفظتك! 🎉`);
    }

    setRedeeming(null);
    loadLoyalty();
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCoupon(code);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });

  if (loading) return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D1A' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-900 border-t-yellow-400 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">جاري تحميل برنامج الولاء...</p>
      </div>
    </div>
  );

  const tierInfo = TIERS[getTier(loyalty?.total_earned || 0)];

  return (
    <div dir="rtl" className="min-h-screen pb-24" style={{ background: '#0D0D1A' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(13,13,26,0.96)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
        <button onClick={() => navigate('/home')} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronRight size={18} className="text-gray-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-base">برنامج الولاء</h1>
          <p className="text-gray-500 text-xs">نقاط وفر</p>
        </div>
        <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: tierInfo.bg, color: tierInfo.color, border: `1px solid ${tierInfo.color}44` }}>
          {tierInfo.icon} {getTier(loyalty?.total_earned || 0)}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Points Card */}
        <div className="relative rounded-3xl p-6 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1E1B4B, #3730A3, #7C3AED)', boxShadow: '0 16px 48px rgba(124,58,237,0.35)' }}>
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10" style={{ background: '#FCD34D' }} />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-10" style={{ background: '#9F5FF1' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Star size={18} className="text-yellow-300" fill="#FCD34D" />
              <span className="text-purple-200 text-sm font-medium">رصيد نقاطك</span>
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-white font-black" style={{ fontSize: '52px', lineHeight: 1 }}>{(loyalty?.points_balance || 0).toLocaleString()}</span>
              <span className="text-purple-200 text-lg mb-1">نقطة</span>
            </div>
            <p className="text-purple-300 text-xs mb-4">= {((loyalty?.points_balance || 0) / 20).toFixed(1)} ريال تقريباً</p>
            <TierProgressBar totalEarned={loyalty?.total_earned || 0} />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'مكتسبة', value: (loyalty?.total_earned || 0).toLocaleString(), icon: <TrendingUp size={14} />, color: '#6EE7B7' },
            { label: 'مستبدلة', value: (loyalty?.total_redeemed || 0).toLocaleString(), icon: <Gift size={14} />, color: '#F87171' },
            { label: 'كل ريال = نقطة', value: '1 نقطة', icon: <Zap size={14} />, color: '#FCD34D' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
              <p className="font-black text-sm text-white">{s.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div className="p-4 rounded-2xl flex items-center gap-3" style={{ background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.3)' }}>
            <span className="text-2xl">🎉</span>
            <p className="text-green-300 font-semibold text-sm flex-1">{successMsg}</p>
            {copiedCoupon && successMsg.includes('كوبون') && (
              <button onClick={() => copyCode(copiedCoupon)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(110,231,183,0.2)', color: '#6EE7B7' }}>
                <Copy size={12} /> نسخ
              </button>
            )}
          </div>
        )}

        {/* Redeem Section */}
        <div>
          <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <Gift size={15} style={{ color: '#9F5FF1' }} />
            استبدال النقاط
          </h3>
          <div className="space-y-2">
            {REDEEM_OPTIONS.map(opt => {
              const canRedeem = (loyalty?.points_balance || 0) >= opt.points;
              return (
                <div key={opt.key} className="p-4 rounded-2xl flex items-center gap-3 transition-all"
                  style={{ background: canRedeem ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)', border: canRedeem ? '1px solid rgba(124,58,237,0.25)' : '1px solid rgba(255,255,255,0.05)', opacity: canRedeem ? 1 : 0.5 }}>
                  <span className="text-2xl flex-shrink-0">{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold">{opt.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{opt.desc}</p>
                  </div>
                  <button
                    onClick={() => handleRedeem(opt)}
                    disabled={!canRedeem || redeeming === opt.key}
                    className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                    style={canRedeem
                      ? { background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)', color: '#fff', boxShadow: '0 0 14px rgba(124,58,237,0.35)' }
                      : { background: 'rgba(255,255,255,0.07)', color: '#6B7280' }
                    }>
                    {redeeming === opt.key ? '...' : `${opt.points} نقطة`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* How to Earn */}
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(252,211,77,0.06)', border: '1px solid rgba(252,211,77,0.15)' }}>
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: '#FCD34D' }}>
            <Award size={15} style={{ color: '#FCD34D' }} />
            كيف تكسب نقاطاً أكثر؟
          </h3>
          <div className="space-y-2 text-xs text-gray-400">
            {[
              { emoji: '🛒', text: 'كل ريال تنفقه = نقطة واحدة' },
              { emoji: '🥈', text: 'مستوى فضي (500+ نقطة): نقطة مضاعفة' },
              { emoji: '🥇', text: 'مستوى ذهبي (1500+ نقطة): 3× نقاط' },
              { emoji: '💎', text: 'مستوى بلاتيني (4000+ نقطة): 5× نقاط' },
            ].map(tip => (
              <div key={tip.emoji} className="flex items-center gap-2">
                <span>{tip.emoji}</span>
                <span>{tip.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions History */}
        <div>
          <h3 className="text-white font-bold text-sm mb-3">سجل النقاط</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-10 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-4xl mb-3">⭐</div>
              <p className="text-gray-500 text-sm">لا توجد معاملات بعد</p>
              <p className="text-gray-600 text-xs mt-1">أتمم طلبك الأول لتبدأ بكسب النقاط</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.1)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={tx.type === 'earn'
                      ? { background: 'rgba(252,211,77,0.12)', border: '1px solid rgba(252,211,77,0.2)' }
                      : { background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)' }
                    }>
                    {tx.type === 'earn'
                      ? <ArrowUpCircle size={18} style={{ color: '#FCD34D' }} />
                      : <ArrowDownCircle size={18} style={{ color: '#A78BFA' }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-gray-500 text-xs">{formatDate(tx.created_date)}</p>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className="font-black text-sm" style={{ color: tx.type === 'earn' ? '#FCD34D' : '#A78BFA' }}>
                      {tx.type === 'earn' ? '+' : '-'}{tx.points} نقطة
                    </p>
                    {tx.balance_after != null && <p className="text-gray-600 text-xs">رصيد: {tx.balance_after}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <CustomerBottomNav active="loyalty" />
    </div>
  );
}