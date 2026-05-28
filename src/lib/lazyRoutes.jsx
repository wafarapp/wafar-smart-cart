import { lazy } from 'react';

/** Admin / driver / store — loaded on demand */
export const OrderTracking = lazy(() => import('@/pages/OrderTracking'));
export const DriverApp = lazy(() => import('@/pages/DriverApp'));
export const StoreDashboard = lazy(() => import('@/pages/StoreDashboard'));
export const AppLogin = lazy(() => import('@/pages/AppLogin'));
export const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
export const Wallet = lazy(() => import('@/pages/Wallet'));
export const LoyaltyPage = lazy(() => import('@/pages/Loyalty'));
export const DriverAnalytics = lazy(() => import('@/pages/DriverAnalytics'));
export const CustomerOrders = lazy(() => import('@/pages/CustomerOrders'));
export const StoreAnalytics = lazy(() => import('@/pages/StoreAnalytics'));
export const StoreRegistration = lazy(() => import('@/pages/StoreRegistration'));
export const Catalog = lazy(() => import('@/pages/Catalog'));
export const Settings = lazy(() => import('@/pages/Settings'));
export const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
export const DeleteAccount = lazy(() => import('@/pages/DeleteAccount'));
export const Terms = lazy(() => import('@/pages/Terms'));
export const RestaurantsHome = lazy(() => import('@/pages/RestaurantsHome'));
export const RestaurantDetail = lazy(() => import('@/pages/RestaurantDetail'));
export const RestaurantCheckout = lazy(() => import('@/pages/RestaurantCheckout'));
export const FastDelivery = lazy(() => import('@/pages/FastDelivery'));
export const NeighborhoodZones = lazy(() => import('@/pages/NeighborhoodZones'));
