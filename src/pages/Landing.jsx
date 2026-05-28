import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Search,
  ShoppingCart,
  Bell,
  ChevronLeft,
  Clock,
  Truck,
  ShieldCheck,
  Sparkles,
  Star,
  Percent,
  Zap,
  UtensilsCrossed,
} from 'lucide-react';
import CustomerBottomNav from '../components/CustomerBottomNav';

import { NEIGHBORHOOD_NAMES } from '@/lib/neighborhoodZones';

const DISTRICTS = NEIGHBORHOOD_NAMES;

const CATEGORIES = [
  { emoji: '🥬', label: 'خضروات وفواكه', color: '#DCFCE7', accent: '#16A34A' },
  { emoji: '🥛', label: 'ألبان وبيض', color: '#DBEAFE', accent: '#2563EB' },
  { emoji: '🍞', label: 'مخبوزات', color: '#FEF3C7', accent: '#D97706' },
  { emoji: '🥩', label: 'لحوم ودواجن', color: '#FEE2E2', accent: '#DC2626' },
  { emoji: '🧴', label: 'منظفات', color: '#E0E7FF', accent: '#4F46E5' },
  { emoji: '💧', label: 'مياه ومشروبات', color: '#CFFAFE', accent: '#0891B2' },
  { emoji: '🍫', label: 'سناكس وحلويات', color: '#FCE7F3', accent: '#DB2777' },
  { emoji: '🧺', label: 'احتياجات يومية', color: '#F3E8FF', accent: '#7C3AED' },
];

const DEALS = [
  { title: 'خصم ٢٠٪', subtitle: 'على الخضروات الطازجة', badge: 'عرض اليوم', emoji: '🥕', gradient: 'from-emerald-500 to-teal-600' },
  { title: 'توصيل مجاني', subtitle: 'للطلبات فوق ٧٥ ريال', badge: 'لفترة محدودة', emoji: '🚚', gradient: 'from-amber-500 to-orange-500' },
  { title: 'باقة العائلة', subtitle: 'وفّر حتى ٤٠ ريال', badge: 'الأكثر طلباً', emoji: '👨‍👩‍👧‍👦', gradient: 'from-violet-500 to-purple-600' },
];

const POPULAR = [
  { name: 'حليب نادك كامل الدسم', unit: '٢ لتر', price: '١٢.٥٠', emoji: '🥛', rating: 4.9 },
  { name: 'خبز تمر صامولي', unit: '٦ حبات', price: '٣.٠٠', emoji: '🍞', rating: 4.8 },
  { name: 'مياه العين', unit: '٢٤ × ٣٣٠ مل', price: '١٨.٠٠', emoji: '💧', rating: 4.9 },
  { name: 'طماطم محلية', unit: '١ كجم', price: '٥.٩٩', emoji: '🍅', rating: 4.7 },
];

const TRUST = [
  { icon: Clock, label: 'توصيل خلال ٣٠ دقيقة', sub: 'من بقالات حيّك' },
  { icon: ShieldCheck, label: 'منتجات طازجة', sub: 'مختارة بعناية' },
  { icon: Truck, label: 'أسعار الحي', sub: 'بدون زيادة مخفية' },
];

const SERVICE_CARDS = [
  {
    key: 'grocery',
    title: 'بقالة وفر',
    subtitle: 'خضروات · ألبان · مخبوزات · منظفات — كل احتياجات البيت',
    badge: 'الأكثر طلباً',
    emoji: '🛒',
    Icon: ShoppingCart,
    gradient: 'from-emerald-700 via-emerald-600 to-teal-500',
    shadow: 'shadow-emerald-200/70',
    path: '/grocery',
    action: 'grocery',
  },
  {
    key: 'restaurants',
    title: 'المطاعم',
    subtitle: 'اطلب من مطاعم حيّك — برجر، شاورما، بيتزا وأكثر',
    badge: 'عروض حصرية',
    emoji: '🍔',
    Icon: UtensilsCrossed,
    gradient: 'from-amber-500 via-orange-500 to-orange-600',
    shadow: 'shadow-amber-200/70',
    path: '/restaurants',
    action: 'navigate',
  },
  {
    key: 'fast-delivery',
    title: 'طلب سريع',
    subtitle: 'توصيل عاجل لأي شيء — أدوية، مستلزمات، طلبات خاصة',
    badge: 'خلال ٢٠ دقيقة',
    emoji: '⚡',
    Icon: Zap,
    gradient: 'from-blue-600 via-blue-500 to-indigo-500',
    shadow: 'shadow-blue-200/70',
    path: '/fast-delivery',
    action: 'navigate',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [district, setDistrict] = useState('الجنادرية');
  const [search, setSearch] = useState('');
  const [activeDeal, setActiveDeal] = useState(0);
  const cart = JSON.parse(localStorage.getItem('wafarCart') || '[]');
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const goShop = (query = '') => {
    if (query) sessionStorage.setItem('wafarGrocerySearch', query);
    navigate('/grocery');
  };

  return (
    <div
      dir="rtl"
      className="page-light min-h-screen pb-24"
      style={{
        fontFamily: "'Cairo', 'Tajawal', sans-serif",
        background: 'linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 35%, #FFFFFF 100%)',
      }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -end-24 -top-24 h-72 w-72 rounded-full opacity-40 no-blur-mobile"
          style={{ background: 'radial-gradient(circle, #86EFAC 0%, transparent 70%)' }}
        />
        <div
          className="absolute -start-16 top-48 h-56 w-56 rounded-full opacity-30 no-blur-mobile"
          style={{ background: 'radial-gradient(circle, #FDE68A 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-lg mx-auto">
        {/* Header */}
        <header
          className="sticky top-0 z-30 animate-fade-in px-4 pb-3 pt-4 supports-[backdrop-filter]:bg-white/80"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(22,163,74,0.08)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #15803D, #22C55E)',
                  boxShadow: '0 6px 20px rgba(34,197,94,0.35)',
                }}
              >
                <span className="text-white font-black text-xl">و</span>
              </div>
              <div>
                <h1 className="font-black text-lg leading-tight text-emerald-900">وفر</h1>
                <p className="text-xs text-emerald-600/80 font-medium">بقالة الحي الذكية</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-emerald-100 shadow-sm"
                aria-label="الإشعارات"
              >
                <Bell size={18} className="text-emerald-700" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-600 shadow-md"
                aria-label="السلة"
              >
                <ShoppingCart size={18} className="text-white" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -end-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-black text-emerald-950">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Location */}
          <button
            type="button"
            className="flex items-center gap-1.5 mb-3 group"
            onClick={() => {}}
          >
            <MapPin size={14} className="text-emerald-600" />
            <span className="text-sm font-bold text-emerald-800">التوصيل إلى</span>
            <span className="text-sm font-black text-emerald-900">{district}</span>
            <span className="text-xs text-gray-400 mr-0.5">· الرياض</span>
            <ChevronLeft size={14} className="text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              goShop(search);
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white border-2 border-emerald-100 shadow-sm focus-within:border-emerald-400 transition-colors"
          >
            <Search size={18} className="text-emerald-500 flex-shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن منتج، ماركة، أو فئة..."
              className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 active:scale-95 transition-transform"
            >
              بحث
            </button>
          </form>
        </header>

        <div className="space-y-6 px-4">
          {/* Hero */}
          <section
            className="relative overflow-hidden rounded-3xl p-5 text-white animate-fade-up"
            style={{
              background: 'linear-gradient(135deg, #14532D 0%, #15803D 45%, #22C55E 100%)',
              boxShadow: '0 12px 40px rgba(22,163,74,0.3)',
            }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              }}
            />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-xs font-bold mb-3">
                <Sparkles size={12} />
                توصيل سريع من حيّك
              </div>
              <h2 className="text-2xl font-black leading-snug mb-1">
                احتياجاتك اليومية
                <br />
                <span className="text-emerald-200">توصل لبابك</span>
              </h2>
              <p className="text-emerald-100/90 text-sm mb-4">خضروات طازجة · ألبان · مخبوزات · منظفات — كل شيء في مكان واحد</p>
              <button
                type="button"
                onClick={() => goShop()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm bg-white text-emerald-800 shadow-lg active:scale-[0.98] transition-transform"
              >
                ابدأ التسوق الآن
                <ChevronLeft size={18} />
              </button>
            </div>
            <div className="absolute left-3 bottom-2 text-7xl opacity-20 select-none pointer-events-none">🛒</div>
          </section>

          {/* District pills */}
          <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
            <div className="scroll-smooth-touch flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {DISTRICTS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDistrict(d)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all active:scale-95"
                  style={
                    d === district
                      ? {
                          background: 'linear-gradient(135deg, #15803D, #22C55E)',
                          color: '#fff',
                          boxShadow: '0 4px 14px rgba(34,197,94,0.35)',
                        }
                      : {
                          background: '#fff',
                          color: '#6B7280',
                          border: '1.5px solid #E5E7EB',
                        }
                  }
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Trust strip */}
          <div className="grid grid-cols-3 gap-2 animate-fade-up" style={{ animationDelay: '120ms' }}>
            {TRUST.map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-emerald-50 shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-1.5">
                  <Icon size={18} className="text-emerald-600" />
                </div>
                <p className="text-[11px] font-bold text-gray-800 leading-tight">{label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Main services — Grocery · Restaurants · Fast Delivery */}
          <section className="animate-fade-up space-y-3" style={{ animationDelay: '150ms' }} aria-label="خدمات وفر">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-gray-900">ماذا تريد اليوم؟</h2>
              <span className="text-[11px] font-semibold text-emerald-600">اختر الخدمة</span>
            </div>
            <div className="flex flex-col gap-3">
              {SERVICE_CARDS.map((service, index) => {
                const ServiceIcon = service.Icon;
                const handleClick = () => {
                  if (service.action === 'grocery') goShop();
                  else navigate(service.path);
                };
                return (
                  <button
                    key={service.key}
                    type="button"
                    onClick={handleClick}
                    className={`tap-scale group relative w-full overflow-hidden rounded-3xl p-4 text-start text-white shadow-lg ${service.shadow} bg-gradient-to-l ${service.gradient} transition-transform active:scale-[0.99] sm:p-5`}
                    style={{ animationDelay: `${180 + index * 50}ms` }}
                  >
                    <div
                      className="pointer-events-none absolute inset-0 opacity-[0.08]"
                      style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '14px 14px',
                      }}
                    />
                    <div className="relative flex items-center gap-3 sm:gap-4">
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 text-4xl backdrop-blur-sm sm:h-[4.5rem] sm:w-[4.5rem] sm:text-5xl">
                        {service.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="mb-1.5 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-sm">
                          {service.badge}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <ServiceIcon size={18} className="flex-shrink-0 opacity-90" aria-hidden />
                          <h3 className="text-lg font-black leading-tight sm:text-xl">{service.title}</h3>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/85 sm:text-sm">
                          {service.subtitle}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-center gap-1 ps-1">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform group-hover:bg-white/30 sm:h-11 sm:w-11">
                          <ChevronLeft size={22} className="text-white" />
                        </span>
                        <span className="text-[10px] font-bold text-white/70">ادخل</span>
                      </div>
                    </div>
                    {index === 0 && (
                      <div className="pointer-events-none absolute -bottom-4 -start-4 text-8xl opacity-10 select-none">
                        🛒
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Deals carousel */}
          <section className="animate-fade-up" style={{ animationDelay: '330ms' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-base text-gray-900">عروض اليوم</h3>
              <button
                type="button"
                onClick={() => goShop()}
                className="text-xs font-bold text-emerald-600 flex items-center gap-0.5"
              >
                عرض الكل
                <ChevronLeft size={14} />
              </button>
            </div>
            <div className="relative">
              <div
                className={`rounded-3xl p-5 text-white bg-gradient-to-l ${DEALS[activeDeal].gradient} shadow-lg transition-all duration-500`}
              >
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/25 mb-2">
                  {DEALS[activeDeal].badge}
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-xl">{DEALS[activeDeal].title}</p>
                    <p className="text-white/85 text-sm mt-0.5">{DEALS[activeDeal].subtitle}</p>
                    <button
                      type="button"
                      onClick={() => goShop()}
                      className="mt-3 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur"
                    >
                      تسوّق العرض
                    </button>
                  </div>
                  <span className="text-5xl">{DEALS[activeDeal].emoji}</span>
                </div>
              </div>
              <div className="flex justify-center gap-1.5 mt-3">
                {DEALS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveDeal(i)}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === activeDeal ? 20 : 6,
                      background: i === activeDeal ? '#16A34A' : '#D1D5DB',
                    }}
                    aria-label={`عرض ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Categories */}
          <section className="animate-fade-up" style={{ animationDelay: '390ms' }}>
            <h3 className="font-black text-base text-gray-900 mb-3">تسوّق حسب الفئة</h3>
            <div className="grid grid-cols-4 gap-2.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => goShop(cat.label.split(' ')[0])}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm active:scale-95 transition-transform"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: cat.color }}
                  >
                    {cat.emoji}
                  </div>
                  <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Popular */}
          <section className="animate-fade-up" style={{ animationDelay: '450ms' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-base text-gray-900">الأكثر طلباً</h3>
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                <Star size={12} fill="currentColor" />
                تقييم عالي
              </span>
            </div>
            <div className="scroll-smooth-touch -mx-1 flex gap-3 overflow-x-auto px-1 pb-2 scrollbar-hide">
              {POPULAR.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => goShop(item.name)}
                  className="flex-shrink-0 w-36 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden text-right active:scale-[0.98] transition-transform"
                >
                  <div className="h-24 flex items-center justify-center text-4xl bg-gradient-to-b from-emerald-50 to-white">
                    {item.emoji}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-2">{item.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{item.unit}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-black text-emerald-700">{item.price} ر</span>
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-semibold">
                        <Star size={10} fill="currentColor" />
                        {item.rating}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Promo banner */}
          <button
            type="button"
            onClick={() => goShop()}
            className="tap-scale flex w-full animate-fade-up items-center gap-4 rounded-3xl border-[1.5px] border-[#FDE68A] p-4 text-right"
            style={{
              animationDelay: '510ms',
              background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
            }}
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-400/30 flex items-center justify-center text-3xl flex-shrink-0">
              <Percent size={28} className="text-amber-700" />
            </div>
            <div className="flex-1">
              <p className="font-black text-amber-900">وفّر مع اشتراك وفر+</p>
              <p className="text-xs text-amber-800/80 mt-0.5">توصيل مجاني غير محدود · عروض حصرية</p>
            </div>
            <ChevronLeft size={20} className="text-amber-600 flex-shrink-0" />
          </button>

          {/* CTA */}
          <div className="animate-fade-up" style={{ animationDelay: '570ms' }}>
            <button
              type="button"
              onClick={() => goShop()}
              className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-transform"
              style={{
                background: 'linear-gradient(135deg, #15803D, #22C55E)',
                boxShadow: '0 10px 32px rgba(34,197,94,0.4)',
              }}
            >
              <ShoppingCart size={20} />
              تصفّح كل المنتجات
            </button>
          </div>

        </div>
      </div>

      <CustomerBottomNav active="home" />
    </div>
  );
}
