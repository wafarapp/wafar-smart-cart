import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { isOrderVisibleToDriver, getNeighborhoodGroup } from '@/lib/neighborhoodZones';
import {
  getRejectedOrderIds,
  rejectOrderLocally,
  isActiveDriverStatus,
} from '@/lib/driverUtils';
import {
  subscribeToPendingOrders,
  subscribeToDriverActiveOrder,
  subscribeToDriverDeliveredOrders,
  acceptOrderByDriver,
  markOrderPickedUp,
  markOrderDelivered,
} from '@/lib/ordersService';

const DriverContext = createContext(null);

function filterPendingForDriver(orders, driver, rejected) {
  return orders.filter(
    (order) =>
      !order.driver_id &&
      order.status === 'pending' &&
      !rejected.includes(order.id) &&
      isOrderVisibleToDriver(order, driver)
  );
}

function computeTodayStats(deliveredOrders) {
  const today = deliveredOrders.filter((o) => {
    const dateStr = o.delivered_date || o.updated_date || o.created_date;
    return dateStr && new Date(dateStr).toDateString() === new Date().toDateString();
  });
  return {
    count: today.length,
    earnings: today.reduce((s, o) => s + (o.driver_fee ?? 12), 0),
  };
}

export function DriverProvider({ children }) {
  const [driver, setDriver] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wafarDriver') || 'null');
    } catch {
      return null;
    }
  });
  const [isOnline, setIsOnline] = useState(() => driver?.is_online ?? driver?.online_status ?? false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [driverGeoPos, setDriverGeoPos] = useState(null);
  const [actionError, setActionError] = useState(null);

  const driverRef = useRef(driver);
  const activeOrderRef = useRef(activeOrder);
  const pendingIdsRef = useRef(new Set());
  const isFetching = useRef(false);

  useEffect(() => {
    driverRef.current = driver;
  }, [driver]);

  useEffect(() => {
    activeOrderRef.current = activeOrder;
  }, [activeOrder]);

  const applyDeliveredStats = useCallback((delivered) => {
    setCompletedOrders(delivered.slice(0, 30));
    const stats = computeTodayStats(delivered);
    setCompletedToday(stats.count);
    setEarnings(stats.earnings);
    setLastRefresh(new Date());
  }, []);

  const loadData = useCallback(async (force = false) => {
    if (isFetching.current && !force) return;
    isFetching.current = true;
    if (force) setIsRefreshing(true);
    setLastRefresh(new Date());
    isFetching.current = false;
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    if (!driver?.id) return;

    setIsOnline(driver.is_online ?? driver.online_status ?? false);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const unsubPending = subscribeToPendingOrders((orders) => {
      const d = driverRef.current;
      const rejected = getRejectedOrderIds();
      const filtered = filterPendingForDriver(orders, d, rejected);

      if (!activeOrderRef.current) {
        const prevIds = pendingIdsRef.current;
        filtered.forEach((order) => {
          if (!prevIds.has(order.id) && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('🛵 طلب جديد في حيّك!', {
              body: `${order.order_type === 'restaurant' ? '🍽️' : order.order_type === 'fast_delivery' ? '⚡' : '🛒'} أجر ${(order.driver_fee ?? 12).toFixed(0)} ر`,
            });
          }
        });
        pendingIdsRef.current = new Set(filtered.map((o) => o.id));
        setPendingOrders(filtered);
      } else {
        setPendingOrders([]);
      }
      setLastRefresh(new Date());
    });

    const unsubActive = subscribeToDriverActiveOrder(driver.id, (order) => {
      if (order && isActiveDriverStatus(order.status)) {
        setActiveOrder(order);
        setPendingOrders([]);
      } else {
        setActiveOrder(null);
      }
      setLastRefresh(new Date());
    });

    const unsubDelivered = subscribeToDriverDeliveredOrders(driver.id, (delivered) => {
      applyDeliveredStats(delivered);
    });

    return () => {
      unsubPending();
      unsubActive();
      unsubDelivered();
    };
  }, [driver?.id, applyDeliveredStats]);

  useEffect(() => {
    if (!isOnline || !driver?.id) return;
    const watch = navigator.geolocation?.watchPosition?.(
      (pos) => {
        setDriverGeoPos([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000 }
    );
    return () => {
      if (watch != null) navigator.geolocation.clearWatch(watch);
    };
  }, [isOnline, driver?.id]);

  const saveDriverSession = (d) => {
    const session = {
      ...d,
      online_status: true,
      is_online: true,
      status: 'available',
    };
    localStorage.setItem('wafarDriver', JSON.stringify(session));
    driverRef.current = session;
    setDriver(session);
    setIsOnline(true);
    return session;
  };

  const createLocalDemoDriver = ({ name, phone, neighborhood_group, existing }) => {
    const group = neighborhood_group || getNeighborhoodGroup('الجنادرية');
    return {
      id: existing?.id || `demo-${phone.replace(/\D/g, '')}`,
      name,
      phone,
      neighborhood_group: group,
      district: group,
      is_approved: true,
      daily_earnings: existing?.daily_earnings ?? 0,
      total_orders: existing?.total_orders ?? 0,
      _localDemo: true,
    };
  };

  const login = async ({ name, phone, neighborhood_group }) => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const group = neighborhood_group || getNeighborhoodGroup('الجنادرية');

    let localExisting = null;
    try {
      const saved = JSON.parse(localStorage.getItem('wafarDriver') || 'null');
      if (saved?.phone === trimmedPhone) localExisting = saved;
    } catch {
      /* ignore */
    }

    const d = createLocalDemoDriver({
      name: trimmedName,
      phone: trimmedPhone,
      neighborhood_group: group,
      existing: localExisting,
    });

    return saveDriverSession(d);
  };

  const logout = () => {
    localStorage.removeItem('wafarDriver');
    driverRef.current = null;
    setDriver(null);
    setPendingOrders([]);
    setActiveOrder(null);
    setIsOnline(false);
    setActionError(null);
    pendingIdsRef.current = new Set();
  };

  const toggleOnline = async () => {
    const next = !isOnline;
    setIsOnline(next);
    if (driver) {
      const updated = {
        ...driver,
        is_online: next,
        online_status: next,
        status: next ? 'available' : 'offline',
      };
      localStorage.setItem('wafarDriver', JSON.stringify(updated));
      setDriver(updated);
    }
    if (next) loadData(true);
  };

  const acceptOrder = async (order) => {
    const d = driverRef.current;
    setActionError(null);

    if (!d?.id) {
      setActionError('يجب تسجيل الدخول أولاً');
      return false;
    }
    if (activeOrderRef.current) {
      setActionError('لديك طلب نشط — أكمله أولاً');
      return false;
    }

    setPendingOrders((prev) => prev.filter((o) => o.id !== order.id));

    try {
      const updated = await acceptOrderByDriver(order.id, d);

      setActiveOrder(updated);
      activeOrderRef.current = updated;

      const updatedDriver = { ...d, status: 'busy', active_order_id: order.id };
      localStorage.setItem('wafarDriver', JSON.stringify(updatedDriver));
      setDriver(updatedDriver);
      return true;
    } catch (err) {
      console.warn('[DriverContext] acceptOrder failed:', err.message);
      if (err.message === 'ALREADY_ASSIGNED') {
        setActionError('تم قبول الطلب من مندوب آخر');
      } else if (err.message === 'NOT_AVAILABLE') {
        setActionError('الطلب لم يعد متاحاً');
      } else {
        setActionError('تعذّر قبول الطلب — حاول مجدداً');
      }
      loadData(true);
      return false;
    }
  };

  const rejectOrder = (order) => {
    rejectOrderLocally(order.id);
    setPendingOrders((prev) => prev.filter((o) => o.id !== order.id));
    setActionError(null);
  };

  const advanceOrderStatus = async () => {
    const current = activeOrderRef.current;
    if (!current?.id) return;

    const flow = {
      accepted_by_driver: 'picked_up',
      driver_assigned: 'picked_up',
      assigned_to_driver: 'picked_up',
      picked_up: 'delivered',
      on_the_way: 'delivered',
    };
    const next = flow[current.status];
    if (!next) return;

    setActionError(null);

    try {
      if (next === 'picked_up') {
        await markOrderPickedUp(current.id);
        const updatedOrder = {
          ...current,
          status: 'picked_up',
          picked_up_date: new Date().toISOString(),
        };
        setActiveOrder(updatedOrder);
        activeOrderRef.current = updatedOrder;
      } else if (next === 'delivered') {
        await markOrderDelivered(current.id);
        const orderEarning = current.driver_fee ?? 12;
        const updatedDriver = {
          ...driver,
          daily_earnings: (driver.daily_earnings || 0) + orderEarning,
          total_orders: (driver.total_orders || 0) + 1,
          status: 'available',
          active_order_id: null,
        };

        localStorage.setItem('wafarDriver', JSON.stringify(updatedDriver));
        setDriver(updatedDriver);
        setActiveOrder(null);
        activeOrderRef.current = null;
        loadData(true);
      }
    } catch (err) {
      console.warn('[DriverContext] advanceOrderStatus failed:', err.message);
      setActionError('تعذّر تحديث حالة الطلب');
    }
  };

  const value = {
    driver,
    isOnline,
    pendingOrders,
    activeOrder,
    completedOrders,
    earnings,
    completedToday,
    lastRefresh,
    isRefreshing,
    driverGeoPos,
    actionError,
    loadData,
    login,
    logout,
    toggleOnline,
    acceptOrder,
    rejectOrder,
    advanceOrderStatus,
  };

  return <DriverContext.Provider value={value}>{children}</DriverContext.Provider>;
}

export function useDriver() {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error('useDriver must be used within DriverProvider');
  return ctx;
}
