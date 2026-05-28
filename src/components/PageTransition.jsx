import { useLocation } from 'react-router-dom';

const LIGHT_ROUTES = ['/', '/grocery', '/cart'];

export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  const isLight = LIGHT_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  return (
    <div
      key={pathname}
      className={`page-enter min-h-screen min-h-[100dvh] w-full ${isLight ? 'bg-[#f8fafc]' : 'bg-[#0D0D1A]'}`}
    >
      {children}
    </div>
  );
}
