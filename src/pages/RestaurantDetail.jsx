import { useState, useEffect } from 'react';
import MobileHeader from '../components/MobileHeader';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Minus, Star, Clock, Bike, ShoppingCart, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SAMPLE_PRODUCTS = [
  { id: 'p1', name: 'برجر كلاسيك', category: 'برجر', price: 25, description: 'برجر لحم طازج مع الخضروات والصوص', image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80', is_available: true, is_popular: true },
  { id: 'p2', name: 'دبل تشيز برجر', category: 'برجر', price: 35, description: 'شريحتان لحم مع جبنة مزدوجة', image_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&q=80', is_available: true, is_popular: false },
  { id: 'p3', name: 'بطاطس كبير', category: 'إضافات', price: 12, description: 'بطاطس مقلية مقرمشة', image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&q=80', is_available: true, is_popular: false },
  { id: 'p4', name: 'كول سلو', category: 'إضافات', price: 8, description: 'سلطة كرنب طازجة', image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80', is_available: true, is_popular: false },
  { id: 'p5', name: 'عصير برتقال', category: 'مشروبات', price: 10, description: 'عصير برتقال طازج', image_url: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&q=80', is_available: true, is_popular: false },
  { id: 'p6', name: 'كولا', category: 'مشروبات', price: 7, description: 'مشروب غازي بارد', image_url: 'https://images.unsplash.com/photo-1629203432180-71e9b18d855c?w=300&q=80', is_available: true, is_popular: false },
];

const SAMPLE_RESTAURANT = {
  id: 's1', name: 'برجر هاوس', category: 'برجر', rating_avg: 4.8, rating_count: 230,
  delivery_time_min: 20, delivery_fee: 5, is_open: true, min_order: 20,
  description: 'أشهى البرجر الطازج — مكونات طازجة يومياً',
  image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
};

export default function RestaurantDetail() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [notes, setNotes] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    loadData();
  }, [restaurantId]);

  const loadData = async () => {
    setLoading(true);
    // Try to load from DB
    if (!restaurantId.startsWith('s')) {
      const r = await base44.entities.Restaurant.get(restaurantId).catch(() => null);
      const prods = await base44.entities.RestaurantProduct.filter({ restaurant_id: restaurantId, is_available: true });
      setRestaurant(r || SAMPLE_RESTAURANT);
      setProducts(prods.length > 0 ? prods : SAMPLE_PRODUCTS);
    } else {
      setRestaurant(SAMPLE_RESTAURANT);
      setProducts(SAMPLE_PRODUCTS);
    }
    setLoading(false);
  };

  const categories = [...new Set(products.map(p => p.category))];
  useEffect(() => { if (categories.length > 0 && !activeCategory) setActiveCategory(categories[0]); }, [products]);

  const addToCart = (product) => {
    const c = JSON.parse(localStorage.getItem('wafarCustomer') || '{}');
    if (!c.phone) { navigate(`/login?returnUrl=/restaurant/${restaurantId}`); return; }
    setCart(prev => ({ ...prev, [product.id]: { ...product, qty: (prev[product.id]?.qty || 0) + 1 } }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[productId].qty <= 1) delete updated[productId];
      else updated[productId] = { ...updated[productId], qty: updated[productId].qty - 1 };
      return updated;
    });
  };

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  const goToCheckout = () => {
    localStorage.setItem('restaurantCart', JSON.stringify({ items: cartItems, restaurant, notes, total: cartTotal }));
    navigate('/restaurant-checkout');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D1A' }}>
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const filteredProducts = products.filter(p => p.category === activeCategory);
  const popularProducts = products.filter(p => p.is_popular);

  return (
    <div dir="rtl" className="min-h-screen pb-32" style={{ background: '#0D0D1A' }}>
      {/* Banner */}
      <div className="relative" style={{ height: '220px' }}>
        <img src={restaurant?.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'}
          alt={restaurant?.name}
          className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(15,15,26,0.95) 100%)' }} />
        <div className="absolute top-0 right-0 left-0 px-3 pt-4" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)' }}>
          <MobileHeader onBack={() => navigate('/restaurants')} />
        </div>

        {/* Restaurant info overlay */}
        <div className="absolute bottom-4 right-4 left-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-white font-black text-xl mb-1">{restaurant?.name}</h1>
              <p className="text-gray-300 text-sm mb-2">{restaurant?.description}</p>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1" style={{ color: '#FCD34D' }}>
                  <Star size={12} fill="#FCD34D" />
                  {restaurant?.rating_avg?.toFixed(1)} ({restaurant?.rating_count})
                </span>
                <span className="flex items-center gap-1 text-gray-300">
                  <Clock size={12} />
                  {restaurant?.delivery_time_min} دقيقة
                </span>
                <span className="flex items-center gap-1 text-gray-300">
                  <Bike size={12} />
                  {restaurant?.delivery_fee} ريال
                </span>
              </div>
            </div>
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${restaurant?.is_open ? 'text-emerald-400' : 'text-red-400'}`}
              style={{ background: restaurant?.is_open ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', border: `1px solid ${restaurant?.is_open ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
              {restaurant?.is_open ? 'مفتوح' : 'مغلق'}
            </span>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="sticky top-0 z-30 flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
        style={{ background: 'rgba(13,13,26,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {popularProducts.length > 0 && (
          <button onClick={() => setActiveCategory('popular')}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={activeCategory === 'popular'
              ? { background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#fff' }
              : { background: 'rgba(255,255,255,0.06)', color: '#9CA3AF' }}>
            ⭐ الأكثر طلباً
          </button>
        )}
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={activeCategory === cat
              ? { background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#fff' }
              : { background: 'rgba(255,255,255,0.06)', color: '#9CA3AF' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="px-4 pt-4 space-y-3">
        {(activeCategory === 'popular' ? popularProducts : filteredProducts).map(product => {
          const qty = cart[product.id]?.qty || 0;
          return (
            <div key={product.id} className="flex gap-3 p-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {/* Product image */}
              <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                <img src={product.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80'}
                  alt={product.name}
                  className="w-full h-full object-cover" />
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-white font-bold text-sm">{product.name}</h3>
                    {product.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{product.description}</p>}
                  </div>
                  {product.is_popular && (
                    <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded-lg font-semibold" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>شائع</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-black text-base" style={{ color: '#F59E0B' }}>{product.price} ر</span>
                  {qty === 0 ? (
                    <button onClick={() => addToCart(product)}
                      disabled={!restaurant?.is_open}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-sm font-bold disabled:opacity-40 transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                      <Plus size={14} />
                      أضف
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromCart(product.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.25)' }}>
                        <Minus size={13} style={{ color: '#F87171' }} />
                      </button>
                      <span className="text-white font-bold text-sm w-5 text-center">{qty}</span>
                      <button onClick={() => addToCart(product)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
                        <Plus size={13} style={{ color: '#F59E0B' }} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      {cartItems.length > 0 && (
        <div className="mx-4 mt-4">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="ملاحظات خاصة بالطلب (اختياري)..."
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
          />
        </div>
      )}

      {/* Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4" style={{ background: 'rgba(13,13,26,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(245,158,11,0.2)' }}>
          <button onClick={goToCheckout}
            className="w-full flex items-center justify-between py-4 px-5 rounded-2xl text-white font-bold transition-all active:scale-98"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 8px 28px rgba(245,158,11,0.45)' }}>
            <span className="w-7 h-7 rounded-xl flex items-center justify-center text-sm font-black" style={{ background: 'rgba(0,0,0,0.2)' }}>
              {cartCount}
            </span>
            <span className="font-black text-base">إتمام الطلب</span>
            <span className="font-black">{cartTotal.toFixed(2)} ر</span>
          </button>
        </div>
      )}
    </div>
  );
}