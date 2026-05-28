import { TrendingUp, Package, Star, ChevronLeft } from 'lucide-react';
import { useDriver } from '@/context/DriverContext';
import { getOrderTypeMeta, formatDriverEarning } from '@/lib/driverUtils';

export default function DriverWallet() {
  const { driver, earnings, completedToday, completedOrders } = useDriver();

  const totalAllTime = completedOrders.reduce((s, o) => s + (o.driver_fee ?? 12), 0);
  const weekOrders = completedOrders.filter((o) => {
    const d = new Date(o.updated_date || o.created_date);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return d.getTime() >= weekAgo;
  });

  return (
    <div className="space-y-4 pb-4">
      {/* Hero earnings card */}
      <div className="animate-fade-up overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-5 shadow-xl shadow-emerald-900/40">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-100/70">أرباح اليوم</p>
            <p className="mt-1 text-4xl font-black text-white">
              {earnings.toFixed(2)}
              <span className="ms-1 text-lg font-normal text-emerald-100/80">ر</span>
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 p-2.5 backdrop-blur">
            <TrendingUp size={22} className="text-white" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-white/15 pt-4">
          <div>
            <p className="text-[10px] text-emerald-100/60">طلبات اليوم</p>
            <p className="text-lg font-black text-white">{completedToday}</p>
          </div>
          <div>
            <p className="text-[10px] text-emerald-100/60">هذا الأسبوع</p>
            <p className="text-lg font-black text-white">{weekOrders.length}</p>
          </div>
          <div>
            <p className="text-[10px] text-emerald-100/60">التقييم</p>
            <p className="flex items-center gap-0.5 text-lg font-black text-white">
              {driver?.rating_avg?.toFixed(1) || '5.0'}
              <Star size={14} className="fill-amber-300 text-amber-300" />
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
          <p className="text-[11px] text-gray-500">إجمالي الطلبات</p>
          <p className="text-xl font-black text-white">{driver?.total_orders || completedOrders.length}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
          <p className="text-[11px] text-gray-500">آخر 30 طلب</p>
          <p className="text-xl font-black text-amber-300">{totalAllTime.toFixed(0)} ر</p>
        </div>
      </div>

      {/* History */}
      <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-black text-white">
            <Package size={16} className="text-emerald-400" />
            سجل الطلبات
          </h2>
          <span className="text-[11px] text-gray-600">{completedOrders.length} طلب</span>
        </div>

        {completedOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center">
            <p className="text-sm text-gray-500">لا توجد طلبات مكتملة بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {completedOrders.map((order, i) => {
              const meta = getOrderTypeMeta(order.order_type);
              const date = new Date(order.updated_date || order.created_date);
              return (
                <div
                  key={order.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 animate-fade-up"
                  style={{ animationDelay: `${120 + i * 40}ms` }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{ background: meta.bg }}
                  >
                    {meta.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">#{order.order_number}</p>
                    <p className="truncate text-[11px] text-gray-500">{order.store_name}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-emerald-400">+{formatDriverEarning(order)} ر</p>
                    <p className="text-[10px] text-gray-600">
                      {date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <ChevronLeft size={14} className="shrink-0 text-gray-700" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
