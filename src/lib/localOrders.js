import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';

export const LOCAL_ORDERS_KEY = 'wafarLocalOrders';
export const LOCAL_ORDERS_UPDATED_EVENT = 'wafar-local-orders-updated';

function isBase44Configured() {
  return Boolean(appParams.appId && appParams.appBaseUrl);
}

export function generateLocalOrderId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getLocalOrders() {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function notifyLocalOrdersUpdated(detail = {}) {
  window.dispatchEvent(new CustomEvent(LOCAL_ORDERS_UPDATED_EVENT, { detail }));
}

function saveLocalOrders(orders, eventDetail) {
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
  notifyLocalOrdersUpdated(eventDetail);
}

/** Merge remote Base44 orders with local mock orders (local wins on id collision). */
export function mergeRemoteAndLocalOrders(remoteOrders = []) {
  const local = getLocalOrders().filter((o) => o._localMock);
  const remoteIds = new Set((remoteOrders || []).map((o) => o.id));
  const uniqueLocal = local.filter((o) => !remoteIds.has(o.id));
  const merged = [...uniqueLocal, ...(remoteOrders || [])];
  merged.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
  return merged;
}

export function updateLocalOrder(idOrOrderNumber, patch) {
  if (!idOrOrderNumber) return null;
  const key = String(idOrOrderNumber);
  const orders = getLocalOrders();
  const idx = orders.findIndex((o) => o.id === key || o.order_number === key);
  if (idx === -1) return null;

  const updated = {
    ...orders[idx],
    ...patch,
    updated_date: new Date().toISOString(),
  };
  orders[idx] = updated;
  saveLocalOrders(orders, { type: 'update', order: updated });
  return updated;
}

export function subscribeToLocalOrders(callback) {
  const onCustom = (e) => callback(e.detail || {});
  const onStorage = (e) => {
    if (e.key === LOCAL_ORDERS_KEY) callback({});
  };
  window.addEventListener(LOCAL_ORDERS_UPDATED_EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(LOCAL_ORDERS_UPDATED_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}

export function getLocalOrder(idOrOrderNumber) {
  if (!idOrOrderNumber) return null;
  const key = String(idOrOrderNumber);
  return getLocalOrders().find(
    (o) => o.id === key || o.order_number === key
  ) || null;
}

export function createLocalOrder(payload) {
  const order = {
    ...payload,
    id: generateLocalOrderId(),
    order_number: payload.order_number || `WFR${Date.now().toString().slice(-6)}`,
    status: payload.status || 'available_for_driver',
    created_date: new Date().toISOString(),
    _localMock: true,
  };

  const orders = getLocalOrders();
  orders.unshift(order);
  saveLocalOrders(orders, { type: 'create', order });

  return order;
}

export function persistOrderReferences(order, phone) {
  localStorage.setItem('currentOrderId', order.id);
  sessionStorage.setItem('currentOrderId', order.id);
  localStorage.setItem(
    'lastOrder',
    JSON.stringify({ order_number: order.order_number, phone: phone || order.customer_phone })
  );
}

export function finalizeCheckout(order, { phone, clearCartKey } = {}) {
  if (clearCartKey) {
    localStorage.removeItem(clearCartKey);
  }
  persistOrderReferences(order, phone);
  return order;
}

/**
 * Create an order via Base44 when available; fall back to a local mock order.
 * Returns { order, isLocalMock }.
 */
export async function createOrder(payload) {
  if (isBase44Configured()) {
    try {
      const order = await base44.entities.Order.create(payload);
      return { order, isLocalMock: false };
    } catch (err) {
      console.warn('[localOrders] Base44 Order.create failed, using local mock:', err.message);
    }
  } else {
    console.warn('[localOrders] Base44 not configured, using local mock order');
  }

  const order = createLocalOrder(payload);
  return { order, isLocalMock: true };
}

export function getLocalOrdersForPhone(phone) {
  if (!phone) return [];
  return getLocalOrders().filter((o) => o.customer_phone === phone);
}
