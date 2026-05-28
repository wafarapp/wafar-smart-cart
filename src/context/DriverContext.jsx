import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { isOrderVisibleToDriver, getNeighborhoodGroup } from '@/lib/neighborhoodZones';
import {
  getRejectedOrderIds,
  rejectOrderLocally,
  isActiveDriverStatus,
  isPendingForDriver,
} from '@/lib/driverUtils';
import {
  mergeRemoteAndLocalOrders,
  updateLocalOrder,
  subscribeToLocalOrders,
  getLocalOrdersForPhone,
} from '@/lib/localOrders';

const DriverContext = createContext(null);

const ACCEPT_STATUS = 'accepted_by_driver';

function filterAvailableOrders(allOrders, driver, rejected) {
  return allOrders.filter((order) => {
    const notAssigned = !order.driver_id;
    const notRejected = !rejected.includes(order.id);
    return isPendingForDriver(order.status) && notAssigned && notRejected && isOrderVisibleToDriver(order, driver);
  });
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

  const isFetching = useRef(false);
  const debounceTimer = useRef(null);
  const driverRef = useRef(driver);
  const activeOrderRef = useRef(activeOrder);

  useEffect(() => {
    driverRef.current = driver;
  }, [driver]);

  useEffect(() => {
    activeOrderRef.current = activeOrder;
  }, [activeOrder]);

  const loadData = useCallback(async (force = false) => {
    if (isFetching.current && !force) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      if (force) setIsRefreshing(true);

      try {
        let remote = [];
        try {
          remote = await base44.entities.Order.list('-created_date', 150);
        } catch (err) {
          console.warn('[DriverContext] Base44 list failed, using local orders:', err.message);
        }

        const local = getLocalOrdersForPhone();
        const allOrders = [...remote, ...local].filter(
          (order, index, self) =>
            index === self.findIndex(o => o.id === order.id)
        );
        const d = driverRef.current;
        const rejected = getRejectedOrderIds();

        const availableOrders = allOrders.filter((o) =>
          isPendingForDriver(o.status)
      );
        
        setPendingOrders(availableOrders);
        setLastRefresh(new Date());

        if (d?.id) {
          const myOrders = allOrders.filter((o) => o.driver_id === d.id);
          const active = myOrders.find((o) => isActiveDriverStatus(o.status));
          setActiveOrder(active || null);

          const delivered = myOrders.filter((o) => o.status === 'delivered');
          setCompletedOrders(delivered.slice(0, 30));

          const stats = computeTodayStats(delivered);
          setCompletedToday(stats.count);
          setEarnings(stats.earnings);
        }
      } catch (err) {
        console.warn('[DriverContext] loadData error:', err.message);
      } finally {
        isFetching.current = false;
        setIsRefreshing(false);
      }
    }, force ? 0 : 400);
  }, []);

  useEffect(() => {
    if (!driver?.id) return;

    loadData(true);
const interval = setInterval(() => loadData(true), 2000);
    setIsOnline(driver.is_online ?? driver.online_status ?? false);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const unsub = base44.entities.Order.subscribe((event) => {
      if (event.type === 'delete') return;
      const data = event.data;
      if (!data) {
        loadData();
        return;
      }

      const d = driverRef.current;
      const rejected = getRejectedOrderIds();
      const isAvailable = true;        

      if (event.type === 'create' && isAvailable) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🛵 طلب جديد في حيّك!', {
            body: `${data.order_type === 'restaurant' ? '🍽️' : data.order_type === 'fast_delivery' ? '⚡' : '🛒'} أجر ${(data.driver_fee ?? 12).toFixed(0)} ر`,
          });
        }
        if (!activeOrderRef.current) {
          setPendingOrders((prev) => {
            const exists = prev.find((o) => o.id === data.id);
            if (exists) return prev;
            return [data, ...prev];
          });
        }
        return;
      }

      if (!isPendingForDriver(data.status) || data.driver_id) {
        setPendingOrders((prev) => prev.filter((o) => o.id !== data.id));
      } else if (isAvailable && !activeOrderRef.current) {
        setPendingOrders((prev) => (prev.find((o) => o.id === data.id) ? prev : [data, ...prev]));
      }

      if (d?.id && data.driver_id === d.id) {
        if (isActiveDriverStatus(data.status)) {
          setActiveOrder(data);
        } else if (data.status === 'delivered' || data.status === 'cancelled') {
          setActiveOrder(null);
          loadData(true);
        }
      }
    });

    return () => {
      unsub();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [driver?.id, loadData]);

  useEffect(() => {
    if (!driver?.id) return;

    const notifyNewLocalOrder = (order) => {
      const d = driverRef.current;
      const rejected = getRejectedOrderIds();
      const isAvailable = true;

      if (!isAvailable || activeOrderRef.current) return;

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🛵 طلب جديد في حيّك!', {
          body: `${order.order_type === 'restaurant' ? '🍽️' : order.order_type === 'fast_delivery' ? '⚡' : '🛒'} أجر ${(order.driver_fee ?? 12).toFixed(0)} ر`,
        });
      }
      setPendingOrders((prev) => (prev.find((o) => o.id === order.id) ? prev : [order, ...prev]));
    };

    const unsubLocal = subscribeToLocalOrders((detail) => {
      if (detail?.type === 'create') {
        notifyNewLocalOrder(detail.order);
      }
      loadData(true);
    });

    return unsubLocal;
  }, [driver?.id, loadData]);

  useEffect(() => {
    if (!isOnline || !driver?.id || driver?._localDemo) return;
    const watch = navigator.geolocation?.watchPosition?.(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setDriverGeoPos([lat, lng]);
        try {
          await base44.entities.Driver.update(driver.id, {
            lat,
            lng,
            last_location_update: new Date().toISOString(),
          });
        } catch {
          /* non-blocking */
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000 }
    );
    return () => {
      if (watch != null) navigator.geolocation.clearWatch(watch);
    };
  }, [isOnline, driver?.id, driver?._localDemo]);

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

    try {
      const existing = await base44.entities.Driver.filter({ phone: trimmedPhone });
      let d;

      if (existing.length > 0) {
        d = existing[0];
        const updates = {
          name: trimmedName,
          neighborhood_group: group,
          district: d.district || group,
          is_online: true,
          status: 'available',
        };
        await base44.entities.Driver.update(d.id, updates);
        d = { ...d, ...updates };
      } else {
        d = await base44.entities.Driver.create({
          name: trimmedName,
          phone: trimmedPhone,
          district: group,
          neighborhood_group: group,
          is_online: true,
          is_approved: true,
          daily_earnings: 0,
          total_orders: 0,
          status: 'available',
        });
      }

      return saveDriverSession({
        ...d,
        name: trimmedName,
        phone: trimmedPhone,
        neighborhood_group: group,
      });
    } catch (err) {
      console.warn('[DriverContext] Base44 unavailable, using local demo login:', err.message);

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
    }
  };

  const logout = () => {
    localStorage.removeItem('wafarDriver');
    driverRef.current = null;
    setDriver(null);
    setPendingOrders([]);
    setActiveOrder(null);
    setIsOnline(false);
    setActionError(null);
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
      if (!driver._localDemo) {
        try {
          await base44.entities.Driver.update(driver.id, {
            is_online: next,
            status: next ? 'available' : 'offline',
          });
        } catch (err) {
          console.warn('[DriverContext] toggleOnline backend sync failed:', err.message);
        }
      }
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

    const acceptPatch = {
      status: ACCEPT_STATUS,
      driver_id: d.id,
      driver_name: d.name,
      driver_phone: d.phone,
    };

    try {
      if (order._localMock) {
        const updated = updateLocalOrder(order.id, acceptPatch);
        setActiveOrder(updated || { ...order, ...acceptPatch });
      } else if (!d._localDemo) {
        const fresh = await base44.entities.Order.get(order.id);
        if (fresh.driver_id && fresh.driver_id !== d.id) {
          setActionError('تم قبول الطلب من مندوب آخر');
          loadData(true);
          return false;
        }
        if (!isPendingForDriver(fresh.status)) {
          setActionError('الطلب لم يعد متاحاً');
          loadData(true);
          return false;
        }

        const updated = await base44.entities.Order.update(order.id, acceptPatch);

        await base44.entities.Driver.update(d.id, {
          status: 'busy',
          active_order_id: order.id,
        });

        setActiveOrder({ ...order, ...updated, ...acceptPatch });
      } else {
        setActiveOrder({ ...order, ...acceptPatch });
      }

      const updatedDriver = { ...d, status: 'busy', active_order_id: order.id };
      localStorage.setItem('wafarDriver', JSON.stringify(updatedDriver));
      setDriver(updatedDriver);
      return true;
    } catch (err) {
      console.warn('[DriverContext] acceptOrder failed:', err.message);
      setActionError('تعذّر قبول الطلب — حاول مجدداً');
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
    if (!activeOrder) return;
    const flow = {
      accepted_by_driver: 'picked_up',
      driver_assigned: 'picked_up',
      assigned_to_driver: 'picked_up',
      picked_up: 'delivered',
      on_the_way: 'delivered',
    };
    const next = flow[activeOrder.status];
    if (!next) return;

    setActionError(null);
    const now = new Date().toISOString();
    const patch = { status: next };
    if (next === 'picked_up') patch.picked_up_date = now;
    if (next === 'delivered') patch.delivered_date = now;

    try {
      let updatedOrder;
      if (activeOrder._localMock) {
        updatedOrder = updateLocalOrder(activeOrder.id, patch) || { ...activeOrder, ...patch };
      } else if (!driver?._localDemo) {
        await base44.entities.Order.update(activeOrder.id, patch);
        updatedOrder = { ...activeOrder, ...patch };
      } else {
        updatedOrder = { ...activeOrder, ...patch };
      }

      if (next === 'delivered') {
        const orderEarning = activeOrder.driver_fee ?? 12;
        const updatedDriver = {
          ...driver,
          daily_earnings: (driver.daily_earnings || 0) + orderEarning,
          total_orders: (driver.total_orders || 0) + 1,
          status: 'available',
          active_order_id: null,
        };

        if (!driver?._localDemo) {
          await base44.entities.Driver.update(driver.id, {
            daily_earnings: updatedDriver.daily_earnings,
            total_orders: updatedDriver.total_orders,
            status: 'available',
            active_order_id: null,
          });
        }

        localStorage.setItem('wafarDriver', JSON.stringify(updatedDriver));
        setDriver(updatedDriver);
        setActiveOrder(null);
        loadData(true);
      } else {
        setActiveOrder(updatedOrder);
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
