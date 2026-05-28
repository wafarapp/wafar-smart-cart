import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Wallet, Star, User } from 'lucide-react';

const TABS = [
  { key: 'home',    label: 'الرئيسية', icon: Home,        path: '/' },
  { key: 'orders',  label: 'طلباتي',   icon: ShoppingBag, path: '/customer-orders' },
  { key: 'wallet',  label: 'محفظتي',   icon: Wallet,      path: '/wallet' },
  { key: 'loyalty', label: 'نقاطي',    icon: Star,        path: '/loyalty' },
  { key: 'account', label: 'حسابي',    icon: User,        path: '/settings' },
];

const TAB_ROOTS = Object.fromEntries(
  TABS.map(t => [t.key, t.path])
);

export default function CustomerBottomNav({ active }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Persist last visited path per tab so navigation returns users to where they left off
  const currentTab = TABS.find(t => pathname.startsWith(t.path));
  const isLightPage = pathname === '/' || pathname === '/grocery';

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className={`gpu-layer fixed bottom-0 inset-x-0 z-50 flex items-center justify-around border-t px-2 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl ${
        isLightPage
          ? 'border-emerald-100/80 bg-white/95'
          : 'border-white/10 bg-[#12121f]/95'
      }`}
    >
      {TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => {
              if (isActive) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                if (currentTab) {
                  sessionStorage.setItem(`tab_memory_${currentTab.key}`, pathname);
                }
                const lastPath = sessionStorage.getItem(`tab_memory_${tab.key}`) || tab.path;
                navigate(lastPath);
              }
            }}
            className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 transition-colors ${
              isActive
                ? isLightPage
                  ? 'bg-emerald-50 ring-1 ring-emerald-200'
                  : 'bg-emerald-500/15 ring-1 ring-emerald-500/30'
                : ''
            }`}
          >
            <Icon
              size={20}
              className={isActive ? 'text-emerald-600' : isLightPage ? 'text-gray-400' : 'text-gray-500'}
            />
            <span
              className={`text-xs font-medium ${
                isActive ? 'text-emerald-600' : isLightPage ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}