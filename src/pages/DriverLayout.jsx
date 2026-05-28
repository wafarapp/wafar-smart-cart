import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Power,
  ChevronRight,
  Package,
  Wallet,
  Map,
  Phone,
  Navigation,
  Clock,
  ChevronUp,
  User,
} from 'lucide-react';
import { useDriver } from '@/context/DriverContext';
import { getNeighborhoodGroup } from '@/lib/neighborhoodZones';
import {
  DRIVER_STATUS_FLOW,
  DRIVER_BUTTONS,
  getOrderTypeMeta,
  getOrderCoords,
  getCustomerCoords,
  openGoogleMapsRoute,
  callCustomer,
  getOrderCountdown,
  formatDriverEarning,
  formatOrderTotal,
  getOrderNeighborhood,
  isPickupPhase,
} from '@/lib/driverUtils';

const NAV = [
  { key: 'orders', label: 'الطلبات', icon: Package, path: '/driver/orders' },
  { key: 'wallet', label: 'الأرباح', icon: Wallet, path: '/driver/wallet' },
  { key: 'map', label: 'الخريطة', icon: Map, path: '/driver/map' },
];

function OrderTimer({ order }) {
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const cd = getOrderCountdown(order, tick);
  if (!cd) return null;

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1 text-gray-500">
          <Clock size={11} />
          {cd.label}
        </span>
        <span className={`font-mono font-bold ${cd.expired ? 'text-red-400' : 'text-amber-300'}`}>{cd.text}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${cd.expired ? 'bg-red-500' : 'bg-gradient-to-l from-amber-400 to-emerald-400'}`}
          style={{ width: `${cd.percent}%` }}
        />
      </div>
    </div>
  );
}

function FloatingActiveOrder() {
  const { activeOrder, advanceOrderStatus } = useDriver();
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState(true);

  if (!activeOrder) return null;
  if (pathname.startsWith('/driver/orders') || pathname.startsWith('/driver/home')) return null;

  const meta = getOrderTypeMeta(activeOrder.order_type);
  const flow = DRIVER_STATUS_FLOW[activeOrder.status] || DRIVER_STATUS_FLOW.accepted_by_driver;
  const pickup = getOrderCoords(activeOrder);
  const dropoff = getCustomerCoords(activeOrder);
  const navTarget = isPickupPhase(activeOrder.status) ? pickup : dropoff;

  return (
    <div className="animate-sheet-up fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md">
      <div className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-[#0C1210]/95 shadow-2xl shadow-emerald-900/40 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-sm font-bold text-emerald-300">طلب نشط · #{activeOrder.order_number}</span>
          </div>
          {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronUp size={18} className="rotate-180 text-gray-400" />}
        </button>

        {expanded && (
          <div className="border-t border-white/10 px-4 pb-4 pt-3 animate-fade-in">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-lg px-2 py-0.5 text-[11px] font-bold" style={{ background: meta.bg, color: meta.color }}>
                {meta.emoji} {meta.label}
              </span>
              <span className="text-xs text-gray-500">{flow.hint}</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <p className="flex items-center gap-1.5 text-gray-400">
                <User size={12} />
                <span className="text-white">{activeOrder.customer_name || '—'}</span>
                <span className="text-gray-600">·</span>
                <span>{activeOrder.customer_phone || '—'}</span>
              </p>
              <p className="text-gray-400">
                من: <span className="text-white">{activeOrder.store_name}</span>
              </p>
              <p className="text-gray-400">
                إلى: <span className="text-white">{activeOrder.customer_address || activeOrder.district}</span>
              </p>
              <p className="text-gray-400">
                حي: <span className="text-emerald-400">{getOrderNeighborhood(activeOrder)}</span>
                <span className="mx-1">·</span>
                {activeOrder.calculated_distance_km ?? '—'} كم
                <span className="mx-1">·</span>
                {formatOrderTotal(activeOrder)} ر
              </p>
              <p className="text-gray-400">
                أجرك: <span className="font-bold text-emerald-400">{formatDriverEarning(activeOrder)} ر</span>
              </p>
            </div>

            <OrderTimer order={activeOrder} />

            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => openGoogleMapsRoute(navTarget[0], navTarget[1])}
                className="flex flex-col items-center gap-1 rounded-2xl bg-blue-500/15 py-2.5 text-[10px] font-bold text-blue-300 ring-1 ring-blue-500/25"
              >
                <Navigation size={16} />
                {DRIVER_BUTTONS.openMap}
              </button>
              <button
                type="button"
                onClick={() => callCustomer(activeOrder.customer_phone)}
                className="flex flex-col items-center gap-1 rounded-2xl bg-white/[0.06] py-2.5 text-[10px] font-bold text-gray-300 ring-1 ring-white/10"
              >
                <Phone size={16} />
                {DRIVER_BUTTONS.callCustomer}
              </button>
              <button
                type="button"
                onClick={advanceOrderStatus}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-500 py-2.5 text-[10px] font-black text-white shadow-lg shadow-emerald-500/20"
              >
                {flow.label}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DriverLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { driver, isOnline, earnings, completedToday, toggleOnline, logout } = useDriver();

  const group = driver?.neighborhood_group || getNeighborhoodGroup(driver?.district);

  return (
    <div dir="rtl" className="min-h-screen bg-[#07070F] pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#07070F]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={logout}
              className="rounded-xl bg-white/[0.06] p-2 ring-1 ring-white/10"
            >
              <ChevronRight size={18} className="text-gray-400" />
            </button>
            <div>
              <p className="text-sm font-black text-white">{driver?.name}</p>
              <p className="text-[11px] text-gray-500">حي {group}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden text-left sm:block">
              <p className="text-[10px] text-gray-500">اليوم</p>
              <p className="text-xs font-bold text-amber-300">{earnings.toFixed(0)} ر · {completedToday} طلب</p>
            </div>
            <button
              type="button"
              onClick={toggleOnline}
              className={`flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-black transition-all ${
                isOnline
                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  : 'bg-white/[0.06] text-gray-400 ring-1 ring-white/10'
              }`}
            >
              <Power size={14} />
              {isOnline ? 'متصل' : 'غير متصل'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-4">
        <Outlet />
      </main>

      <FloatingActiveOrder />

      <nav
        aria-label="تنقل المندوب"
        className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-white/[0.08] bg-[#0A0A12]/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"
      >
        {NAV.map((tab) => {
          const Icon = tab.icon;
          const active = pathname.startsWith(tab.path);
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 transition-all ${
                active ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-500'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-bold">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
