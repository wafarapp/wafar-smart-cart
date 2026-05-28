import { Navigate, Route, Routes } from 'react-router-dom';
import { DriverProvider, useDriver } from '@/context/DriverContext';
import DriverLogin from './DriverLogin';
import DriverLayout from './DriverLayout';
import DriverOrders from './DriverOrders';
import DriverWallet from './DriverWallet';
import DriverMapView from './DriverMapView';

function DriverRoutes() {
  const { driver } = useDriver();

  if (!driver) {
    return <DriverLogin />;
  }

  return (
    <Routes>
      <Route element={<DriverLayout />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<DriverOrders />} />
        <Route path="orders" element={<DriverOrders />} />
        <Route path="wallet" element={<DriverWallet />} />
        <Route path="map" element={<DriverMapView />} />
      </Route>
      <Route path="*" element={<Navigate to="/driver/home" replace />} />
    </Routes>
  );
}

export default function DriverApp() {
  return (
    <DriverProvider>
      <DriverRoutes />
    </DriverProvider>
  );
}
