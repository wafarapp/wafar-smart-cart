import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Star, Clock, ChevronRight, Bike, ShoppingBag } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CATEGORIES = ['الكل', 'برجر', 'شاورما', 'بيتزا', 'بروست', 'قهوة', 'حلويات'];

const CAT_EMOJI = {
  'الكل': '🍽️', 'برجر': '🍔', 'شاورما': '🌯', 'بيتزا': '🍕',
  'بروست': '🍗', 'قهوة': '☕', 'حلويات': '🍰', 'مشاوي': '🥩',
};

// Sample restaurants shown when DB is empty
const SAMPLE_RESTAURANTS = [
  { id: 's1', name: 'برجر هاوس', category: 'برجر', district: 'الجنادرية', rating_avg: 4.8, rating_count: 230, delivery_time_min: 20, delivery_fee: 5, is_open: true, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', description: 'أشهى البرجر الطازج' },
  { id: 's2', name: 'شاورما الأصيل', category: 'شاورما', district: 'الشروق', rating_avg: 4.6, rating_count: 180, delivery_time_min: 15, delivery_fee: 4, is_open: true, image_url: 'https://images.unsplash.com/photo-1621852004158-f3bc188ace2d?w=400&q=80', description: 'شاورما عربية أصيلة' },
  { id: 's3', name: 'بيتزا ستار', category: 'بيتزا', district: 'المعالي', rating_avg: 4.5, rating_count: 150, delivery_time_min: 30, delivery_fee: 6, is_open: true, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80', description: 'بيتزا إيطالية بلمسة سعودية' },
  { id: 's4', name: 'بروست الذهبي', category: 'بروست', district: 'الجنادرية', rating_avg: 4.7, rating_count: 310, delivery_time_min: 25, delivery_fee: 5, is_open: false, image_url: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&q=80', description: 'دجاج مقلي على أصوله' },
  { id: 's5', name: 'قهوة حي', category: 'قهوة', district: 'النظيم', rating_avg: 4.9, rating_count: 95, delivery_time_min: 15, delivery_fee: 4, is_open: true, image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80', description: 'مشروبات ساخنة وباردة' },
  { id: 's6', name: 'حلويات الخليج', category: 'حلويات', district: 'غصون', rating_avg: 4.4, rating_count: 78, delivery_time_min: 35, delivery_fee: 7, is_open: true, image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80', description: 'حلويات شرقية وغربية' },
];

export default function RestaurantsHome() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    setLoading(true);
    const data = await base44.entities.Restaurant.filter({ is_active: true });
    setRestaurants(data.length > 0 ? data : SAMPLE_RESTAURANTS);
    setLoading(false);
  };

  const filtered = restaurants.filter(r => {
    const matchCat = activeCategory === 'الكل' || r.category === activeCategory;
    const matchSearch = !search || r.name.includes(search) || r.category.includes(search);
    return matchCat && matchSearch;
  });

  return (
    <div dir="rtl" className="min-h-screen pb-24" style={{ background: '#0D0D1A' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 pt-4 pb-3" style={{ background: 'rgba(13,13,26,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <ChevronRight size={18} className="text-gray-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-black text-base">مطاعم قريبة</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={11} style={{ color: '#F59E0B' }} />
              <span className="text-xs" style={{ color: '#F59E0B' }}>توصيل سريع لحيّك</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.2)' }}>🍽️</div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث عن مطعم أو صنف..."
            className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
            style={activeCategory === cat
              ? { background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#fff', boxShadow: '0 4px 14px rgba(245,158,11,0.4)' }
              : { background: 'rgba(255,255,255,0.06)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span>{CAT_EMOJI[cat] || '🍽️'}</span>
            <span>{cat}</span>
          </button>
        ))}
      </div>

      {/* Hero Banner */}
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden relative" style={{ height: '140px', background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
        <div className="absolute inset-0 flex flex-col justify-center px-5">
          <p className="text-white font-black text-xl mb-1">توصيل سريع 🚀</p>
          <p className="text-amber-100 text-sm">من أفضل مطاعم حيّك</p>
          <div className="flex items-center gap-1.5 mt-2">
            <Bike size={14} className="text-white" />
            <span className="text-white text-xs font-semibold">أقل من 30 دقيقة</span>
          </div>
        </div>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-7xl opacity-30">🍔</div>
      </div>

      {/* Section title */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <h2 className="text-white font-bold text-sm">{activeCategory === 'الكل' ? 'جميع المطاعم' : `مطاعم ${activeCategory}`}</h2>
        <span className="text-gray-600 text-xs">{filtered.length} مطعم</span>
      </div>

      {/* Restaurants Grid */}
      <div className="px-4 space-y-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
          ))
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-400 font-bold">لا توجد نتائج</p>
            <p className="text-gray-600 text-sm mt-1">جرّب فئة أخرى</p>
          </div>
        ) : (
          filtered.map(r => (
            <button key={r.id} onClick={() => navigate(`/restaurant/${r.id}`)}
              className="w-full text-right rounded-2xl overflow-hidden transition-all active:scale-98"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex gap-3 p-3">
                {/* Image */}
                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 relative">
                  <img src={r.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80'}
                    alt={r.name}
                    className="w-full h-full object-cover" />
                  {!r.is_open && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ background: 'rgba(0,0,0,0.65)' }}>
                      <span className="text-white text-xs font-bold">مغلق</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-white font-bold text-sm truncate">{r.name}</h3>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${r.is_open ? 'text-emerald-400' : 'text-gray-500'}`}
                      style={{ background: r.is_open ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.06)' }}>
                      {r.is_open ? 'مفتوح' : 'مغلق'}
                    </span>
                  </div>

                  <p className="text-gray-500 text-xs mb-2 truncate">{r.description || r.category}</p>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1" style={{ color: '#FCD34D' }}>
                      <Star size={11} fill="#FCD34D" />
                      {r.rating_avg?.toFixed(1)} ({r.rating_count || 0})
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock size={11} />
                      {r.delivery_time_min} د
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Bike size={11} />
                      {r.delivery_fee} ر
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}