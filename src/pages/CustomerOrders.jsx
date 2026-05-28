import { useState, useEffect } from 'react';
import usePullToRefresh from '../hooks/usePullToRefresh.jsx';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Clock, ChevronLeft, Package } from 'lucide-react';
import { getOrdersByCustomerPhone } from '@/lib/ordersService';
import CustomerBottomNav from '../components/CustomerBottomNav';

const STATUS_AR = { pending: 'في الانتظار', accepted_by_driver: 'مندوب في الطريق', accepted: 'مقبول', preparing: 'يُجهّز', picked_up: 'استلمه المندوب', on_the_way: 'في الطريق', delivered: 'تم التسليم', cancelled: 'ملغي' };
const STATUS_COLOR = { pending: '#FCD34D', accepted_by_driver: '#60A5FA', accepted: '#60A5FA', preparing: '#9F5FF1', picked_up: '#A78BFA', on_the_way: '#9F5FF1', delivered: '#10B981', cancelled: '#F87171' };
const STATUS_EMOJI = { pending: '🕐', accepted_by_driver: '🛵', accepted: '✅', preparing: '📦', picked_up: '🛵', on_the_way: '🚀', delivered: '🎉', cancelled: '❌' };

export default function CustomerOrders() {
  const navigate = useNavigate();
  const [customer] = useState(() => JSON.parse(localStorage.getItem('wafarCustomer') || '{"name":"زائر","phone":""}'));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { containerProps, isRefreshing, PullIndicator } = usePullToRefresh(loadOrders);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    if (customer.phone) {
      try {
        const data = await getOrdersByCustomerPhone(customer.phone, 30);
        setOrders(data);
      } catch {
        setOrders([]);
      }
    }
    setLoading(false);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div dir="rtl" className="min-h-screen pb-24 bg-background relative" {...containerProps}>
      <PullIndicator />
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-4" style={{ background: 'rgba(13,13,26,0.96)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
        <h1 className="text-white font-bold text-lg flex items-center gap-2">
          <ShoppingBag size={20} style={{ color: '#9F5FF1' }} />
          طلباتي
        </h1>
        <p className="text-gray-500 text-xs mt-0.5">{customer.name}</p>
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-400 text-base mb-2">لا توجد طلبات بعد</p>
            <p className="text-gray-600 text-sm mb-6">ابدأ بالتسوق من البقالات القريبة منك</p>
            <button onClick={() => navigate('/home')} className="px-8 py-3 rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)' }}>
              تصفح البقالات
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <button
                key={order.id}
                onClick={() => navigate(`/track/${order.id}`)}
                className="w-full p-4 rounded-2xl text-right transition-all active:scale-98"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.2)', backdropFilter: 'blur(20px)' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{STATUS_EMOJI[order.status]}</span>
                    <div>
                      <p className="text-white font-bold text-sm">{order.store_name}</p>
                      <p className="text-gray-500 text-xs">#{order.order_number}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${STATUS_COLOR[order.status]}22`, color: STATUS_COLOR[order.status], border: `1px solid ${STATUS_COLOR[order.status]}44` }}>
                      {STATUS_AR[order.status]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                  <div className="flex items-center gap-1">
                    <Clock size={11} />
                    <span>{formatDate(order.created_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: '#9F5FF1' }}>{order.total_amount?.toFixed(2)} ريال</span>
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <span className="text-purple-400 flex items-center gap-0.5">
                        تتبع <ChevronLeft size={12} />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <CustomerBottomNav active="orders" />
    </div>
  );
}