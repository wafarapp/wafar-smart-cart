import { useState, useEffect } from 'react';
import {
  RefreshCw,
  MapPin,
  Phone,
  Navigation,
  X,
  Zap,
  Clock,
  User,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { useDriver } from '@/context/DriverContext';
import {
  getOrderTypeMeta,
  getOrderCoords,
  getCustomerCoords,
  openGoogleMapsRoute,
  callCustomer,
  getOrderCountdown,
  formatDriverEarning,
  formatOrderTotal,
  getOrderNeighborhood,
  DRIVER_BUTTONS,
  isPickupPhase,
} from '@/lib/driverUtils';

function CustomerInfoBlock({ order }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <User size={14} className="shrink-0 text-violet-400" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-gray-500">العميل</p>
          <p className="truncate text-sm font-bold text-white">{order.customer_name || '—'}</p>
        </div>
        <button
          type="button"
          onClick={() => callCustomer(order.customer_phone)}
          className="shrink-0 rounded-xl bg-white/[0.06] px-2.5 py-1.5 text-[10px] font-bold text-gray-300 ring-1 ring-white/10"
        >
          {order.customer_phone || '—'}
        </button>
      </div>

      <div className="flex gap-2">
        <MapPin size={14} className="mt-0.5 shrink-0 text-red-400" />
        <div className="min-w-0">
          <p className="text-[10px] text-gray-500">العنوان</p>
          <p className="text-sm font-semibold text-white">{order.customer_address || order.district || '—'}</p>
          <p className="mt-0.5 text-[11px] text-emerald-400/80">حي {getOrderNeighborhood(order)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-2.5">
        <div>
          <p className="text-[10px] text-gray-500">المسافة</p>
          <p className="text-sm font-bold text-gray-200">{order.calculated_distance_km ?? '—'} كم</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500">إجمالي الطلب</p>
          <p className="text-sm font-bold text-white">{formatOrderTotal(order)} ر</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500">أجرك</p>
          <p className="text-sm font-black text-emerald-400">{formatDriverEarning(order)} ر</p>
        </div>
      </div>
    </div>
  );
}

function ActiveOrderCard({ order, onAdvance }) {
  const meta = getOrderTypeMeta(order.order_type);
  const pickup = getOrderCoords(order);
  const dropoff = getCustomerCoords(order);
  const navTarget = isPickupPhase(order.status) ? pickup : dropoff;
  const advanceLabel =
    order.status === 'picked_up' || order.status === 'on_the_way'
      ? DRIVER_BUTTONS.delivered
      : DRIVER_BUTTONS.pickedUp;

  return (
    <article className="animate-fade-up overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-white/[0.04] to-transparent shadow-xl shadow-emerald-900/20">
      <div className="border-b border-emerald-500/20 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <div>
              <p className="text-base font-black text-white">طلب نشط · #{order.order_number}</p>
              <p className="text-[11px] text-emerald-300/80">{meta.emoji} {meta.label}</p>
            </div>
          </div>
          <span className="rounded-xl bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
            {formatDriverEarning(order)} ر
          </span>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <CustomerInfoBlock order={order} />

        <div className="space-y-1.5 text-xs">
          <p className="text-gray-400">
            من: <span className="font-semibold text-white">{order.store_name}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => openGoogleMapsRoute(navTarget[0], navTarget[1])}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-blue-500/15 py-3 text-xs font-bold text-blue-300 ring-1 ring-blue-500/25"
          >
            <Navigation size={15} />
            {DRIVER_BUTTONS.openMap}
          </button>
          <button
            type="button"
            onClick={() => callCustomer(order.customer_phone)}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-white/[0.06] py-3 text-xs font-bold text-gray-300 ring-1 ring-white/10"
          >
            <Phone size={15} />
            {DRIVER_BUTTONS.callCustomer}
          </button>
        </div>

        <button
          type="button"
          onClick={onAdvance}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-500 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-500/25 transition active:scale-[0.98]"
        >
          {advanceLabel}
        </button>
      </div>
    </article>
  );
}

function LiveOrderCard({ order, index, onAccept, onReject, busy }) {
  const [tick, setTick] = useState(Date.now());
  const meta = getOrderTypeMeta(order.order_type);
  const cd = getOrderCountdown(order, tick);
  const coords = getOrderCoords(order);

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <article
      className="animate-fade-up overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-xl"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-black text-white">#{order.order_number}</p>
            <p className="mt-0.5 text-xs text-gray-500">حي {getOrderNeighborhood(order)}</p>
          </div>
          <span
            className="rounded-xl px-2.5 py-1 text-[11px] font-bold"
            style={{ background: meta.bg, color: meta.color }}
          >
            {meta.emoji} {meta.label}
          </span>
        </div>

        {cd && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2">
            <Clock size={14} className="text-amber-400" />
            <span className="text-xs text-amber-200/80">{cd.expired ? 'تأخّر التوصيل' : 'الوقت المتبقي'}</span>
            <span className={`ms-auto font-mono text-sm font-black ${cd.expired ? 'text-red-400' : 'text-amber-300'}`}>
              {cd.text}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="flex gap-2 text-sm">
          <MapPin size={15} className="mt-0.5 shrink-0 text-emerald-400" />
          <div>
            <p className="text-[11px] text-gray-500">من</p>
            <p className="font-semibold text-white">{order.store_name}</p>
          </div>
        </div>

        <CustomerInfoBlock order={order} />
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-white/[0.06] p-3">
        <button
          type="button"
          onClick={() => onReject(order)}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-white/[0.06] py-3 text-sm font-bold text-gray-400 ring-1 ring-white/10 transition active:scale-[0.98] disabled:opacity-50"
        >
          <X size={16} />
          {DRIVER_BUTTONS.reject}
        </button>
        <button
          type="button"
          onClick={() => onAccept(order)}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-500 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/25 transition active:scale-[0.98] disabled:opacity-50"
        >
          <Zap size={16} />
          {DRIVER_BUTTONS.accept}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-white/[0.06] p-3 pt-0">
        <button
          type="button"
          onClick={() => openGoogleMapsRoute(coords[0], coords[1])}
          className="flex items-center justify-center gap-1 rounded-xl py-2.5 text-[11px] font-bold text-blue-300"
        >
          <Navigation size={14} />
          {DRIVER_BUTTONS.openMap}
        </button>
        <button
          type="button"
          onClick={() => callCustomer(order.customer_phone)}
          className="flex items-center justify-center gap-1 rounded-xl py-2.5 text-[11px] font-bold text-gray-400"
        >
          <Phone size={14} />
          {DRIVER_BUTTONS.callCustomer}
        </button>
      </div>
    </article>
  );
}

export default function DriverOrders() {
  const {
    isOnline,
    pendingOrders,
    activeOrder,
    lastRefresh,
    isRefreshing,
    loadData,
    toggleOnline,
    acceptOrder,
    rejectOrder,
    advanceOrderStatus,
    earnings,
    completedToday,
    actionError,
  } = useDriver();

  const [accepting, setAccepting] = useState(false);

  const handleAccept = async (order) => {
    setAccepting(true);
    await acceptOrder(order);
    setAccepting(false);
  };

  if (!isOnline) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center animate-fade-in">
        <div className="mb-4 text-6xl">😴</div>
        <h2 className="mb-1 text-lg font-black text-white">أنت غير متصل</h2>
        <p className="mb-6 text-sm text-gray-500">فعّل الاتصال لاستقبال طلبات حيّك</p>
        <button
          type="button"
          onClick={toggleOnline}
          className="rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-500 px-10 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-500/25"
        >
          <Zap size={16} className="mb-1 inline" /> اتصل الآن
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="grid grid-cols-2 gap-3 animate-fade-up">
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-4">
          <div className="mb-1 flex items-center gap-1.5">
            <Wallet size={13} className="text-amber-400" />
            <p className="text-[11px] text-amber-200/60">أرباح اليوم</p>
          </div>
          <p className="text-2xl font-black text-amber-300">
            {earnings.toFixed(0)} <span className="text-sm">ر</span>
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-4">
          <p className="text-[11px] text-emerald-200/60">طلبات مكتملة اليوم</p>
          <p className="text-2xl font-black text-emerald-300">{completedToday}</p>
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300 animate-fade-in">
          <AlertCircle size={15} className="shrink-0" />
          {actionError}
        </div>
      )}

      <div className="flex items-center justify-between animate-fade-up" style={{ animationDelay: '50ms' }}>
        <div>
          <h1 className="text-lg font-black text-white">طلبات مباشرة</h1>
          <p className="text-[11px] text-gray-500">
            {activeOrder ? 'لديك طلب نشط — أكمله أولاً' : `${pendingOrders.length} طلب متاح في حيّك`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-1 rounded-xl bg-white/[0.06] px-3 py-2 text-xs font-bold text-gray-400 ring-1 ring-white/10"
        >
          <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          {lastRefresh?.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
        </button>
      </div>

      {activeOrder && <ActiveOrderCard order={activeOrder} onAdvance={advanceOrderStatus} />}

      {!activeOrder && pendingOrders.length === 0 && (
        <div className="flex min-h-[32vh] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 py-16 animate-fade-in">
          <div className="mb-3 text-5xl">🛵</div>
          <p className="font-bold text-gray-400">بانتظار طلبات جديدة</p>
          <p className="mt-1 text-xs text-gray-600">ستصلك فوراً في حيّك</p>
        </div>
      )}

      {!activeOrder && (
        <div className="space-y-4">
          {pendingOrders.map((order, i) => (
            <LiveOrderCard
              key={order.id}
              order={order}
              index={i}
              onAccept={handleAccept}
              onReject={rejectOrder}
              busy={accepting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
