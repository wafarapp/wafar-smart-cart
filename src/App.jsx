import { Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ErrorBoundary from './components/ErrorBoundary';
import PageTransition from './components/PageTransition';
import PageLoader from './components/PageLoader';

/* Customer-critical path — eager load for fast first paint */
import Landing from './pages/Landing';
import Grocery from './pages/Grocery';
import CustomerCart from './pages/CustomerCart';
import CustomerLogin from './pages/CustomerLogin';

import {
  OrderTracking,
  DriverApp,
  StoreDashboard,
  AppLogin,
  AdminDashboard,
  Wallet,
  LoyaltyPage,
  DriverAnalytics,
  CustomerOrders,
  StoreAnalytics,
  StoreRegistration,
  Catalog,
  Settings,
  PrivacyPolicy,
  DeleteAccount,
  Terms,
  RestaurantsHome,
  RestaurantDetail,
  RestaurantCheckout,
  FastDelivery,
  NeighborhoodZones,
} from '@/lib/lazyRoutes';

const LIGHT_PATHS = ['/', '/grocery', '/cart'];

function RouteFallback() {
  const { pathname } = useLocation();
  return <PageLoader light={LIGHT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))} />;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0D0D1A]">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-purple-900/30" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-purple-500" />
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <PageTransition>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<CustomerLogin />} />
          <Route path="/customer" element={<CustomerLogin />} />
          <Route path="/grocery" element={<Grocery />} />
          <Route path="/cart" element={<CustomerCart />} />
          <Route path="/app-login" element={<AppLogin />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/home/store/:storeId" element={<Navigate to="/" replace />} />
          <Route path="/track/:orderId" element={<OrderTracking />} />
          <Route path="/driver/*" element={<DriverApp />} />
          <Route path="/store" element={<StoreDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/neighborhood-zones" element={<NeighborhoodZones />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/loyalty" element={<LoyaltyPage />} />
          <Route path="/driver-analytics" element={<DriverAnalytics />} />
          <Route path="/customer-orders" element={<CustomerOrders />} />
          <Route path="/store-analytics" element={<StoreAnalytics />} />
          <Route path="/store-register" element={<StoreRegistration />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/restaurants" element={<RestaurantsHome />} />
          <Route path="/restaurant/:restaurantId" element={<RestaurantDetail />} />
          <Route path="/restaurant-checkout" element={<RestaurantCheckout />} />
          <Route path="/fast-delivery" element={<FastDelivery />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Suspense>
    </PageTransition>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ErrorBoundary>
            <AuthenticatedApp />
          </ErrorBoundary>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
