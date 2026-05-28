import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const ORDERS_COLLECTION = 'orders';

const ACTIVE_DRIVER_STATUSES = ['accepted_by_driver', 'picked_up', 'on_the_way'];

/** Firestore rejects undefined field values — strip them before write. */
function sanitizeFirestoreData(value) {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeFirestoreData(item))
      .filter((item) => item !== undefined);
  }

  const cleaned = {};
  for (const [key, val] of Object.entries(value)) {
    const next = sanitizeFirestoreData(val);
    if (next !== undefined) cleaned[key] = next;
  }
  return cleaned;
}

function docToOrder(snapshot) {
  if (!snapshot?.exists) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

function docsToOrders(snapshot) {
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createOrderInFirestore(payload) {
  const now = new Date().toISOString();
  const orderData = sanitizeFirestoreData({
    ...payload,
    status: 'pending',
    driver_id: null,
    driver_name: null,
    driver_phone: null,
    created_date: now,
    updated_date: now,
  });

  try {
    const ref = await addDoc(collection(db, ORDERS_COLLECTION), orderData);
    return { id: ref.id, ...orderData };
  } catch (err) {
    console.error('[ordersService] createOrderInFirestore failed:', {
      code: err?.code,
      message: err?.message,
      collection: ORDERS_COLLECTION,
      order_number: payload?.order_number,
      payloadKeys: Object.keys(payload || {}),
      error: err,
    });
    throw err;
  }
}

export async function getOrderById(orderId) {
  if (!orderId) return null;
  const snap = await getDoc(doc(db, ORDERS_COLLECTION, String(orderId)));
  return docToOrder(snap);
}

export async function getOrderByIdOrNumber(idOrNumber) {
  if (!idOrNumber) return null;
  const key = String(idOrNumber);

  const byId = await getOrderById(key);
  if (byId) return byId;

  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('order_number', '==', key),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return docsToOrders(snap)[0];
}

export async function getOrdersByCustomerPhone(phone, max = 30) {
  if (!phone) return [];
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('customer_phone', '==', phone),
    orderBy('created_date', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return docsToOrders(snap);
}

export async function getLatestOrderByCustomerPhone(phone) {
  const orders = await getOrdersByCustomerPhone(phone, 1);
  return orders[0] || null;
}

export async function getRecentOrders(max = 50) {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    orderBy('created_date', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return docsToOrders(snap);
}

export async function getOrdersByStoreId(storeId, max = 100) {
  if (!storeId) return [];
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('store_id', '==', storeId),
    orderBy('created_date', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return docsToOrders(snap);
}

export function subscribeToStoreOrders(storeId, callback) {
  if (!storeId) return () => {};

  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('store_id', '==', storeId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const orders = docsToOrders(snapshot);
      orders.sort(
        (a, b) =>
          new Date(b.created_date || 0) - new Date(a.created_date || 0)
      );
      callback(orders);
    },
    (err) => {
      console.warn('[ordersService] store orders subscription error:', err.message);
      callback([]);
    }
  );
}

export async function getDeliveredOrdersByDriver(driverId) {
  if (!driverId) return [];
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('driver_id', '==', driverId),
    where('status', '==', 'delivered')
  );
  const snap = await getDocs(q);
  return docsToOrders(snap);
}

export function subscribeToPendingOrders(callback) {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('status', '==', 'pending'),
    where('driver_id', '==', null)
  );

  return onSnapshot(
    q,
    (snapshot) => callback(docsToOrders(snapshot)),
    (err) => {
      console.warn('[ordersService] pending subscription error:', err.message);
      callback([]);
    }
  );
}

export function subscribeToDriverActiveOrder(driverId, callback) {
  if (!driverId) return () => {};

  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('driver_id', '==', driverId),
    where('status', 'in', ACTIVE_DRIVER_STATUSES)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const orders = docsToOrders(snapshot);
      callback(orders[0] || null);
    },
    (err) => {
      console.warn('[ordersService] active order subscription error:', err.message);
      callback(null);
    }
  );
}

export function subscribeToDriverDeliveredOrders(driverId, callback) {
  if (!driverId) return () => {};

  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('driver_id', '==', driverId),
    where('status', '==', 'delivered')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const orders = docsToOrders(snapshot);
      orders.sort(
        (a, b) =>
          new Date(b.delivered_date || b.updated_date || 0) -
          new Date(a.delivered_date || a.updated_date || 0)
      );
      callback(orders);
    },
    (err) => {
      console.warn('[ordersService] delivered subscription error:', err.message);
      callback([]);
    }
  );
}

export function subscribeToOrder(orderId, callback) {
  if (!orderId) return () => {};

  return onSnapshot(
    doc(db, ORDERS_COLLECTION, String(orderId)),
    (snapshot) => {
      callback(docToOrder(snapshot));
    },
    (err) => {
      console.error('[ordersService] order subscription error:', {
        code: err?.code,
        message: err?.message,
        orderId: String(orderId),
        error: err,
      });
      callback(null);
    }
  );
}

/** Realtime listen by Firestore document id or order_number. */
export function subscribeToOrderByIdOrNumber(idOrNumber, callback) {
  if (!idOrNumber) return () => {};

  const key = String(idOrNumber);
  let queryUnsub = null;

  const stopQuery = () => {
    if (queryUnsub) {
      queryUnsub();
      queryUnsub = null;
    }
  };

  const startQuery = () => {
    if (queryUnsub) return;
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('order_number', '==', key),
      limit(1)
    );
    queryUnsub = onSnapshot(
      q,
      (snapshot) => {
        callback(snapshot.empty ? null : docsToOrders(snapshot)[0]);
      },
      (err) => {
        console.error('[ordersService] order_number subscription error:', {
          code: err?.code,
          message: err?.message,
          order_number: key,
          error: err,
        });
        callback(null);
      }
    );
  };

  const docUnsub = onSnapshot(
    doc(db, ORDERS_COLLECTION, key),
    (snapshot) => {
      if (snapshot.exists()) {
        stopQuery();
        callback(docToOrder(snapshot));
        return;
      }
      startQuery();
    },
    (err) => {
      console.error('[ordersService] order doc subscription error:', {
        code: err?.code,
        message: err?.message,
        orderId: key,
        error: err,
      });
      startQuery();
    }
  );

  return () => {
    docUnsub();
    stopQuery();
  };
}

export async function acceptOrderByDriver(orderId, driver) {
  const orderRef = doc(db, ORDERS_COLLECTION, String(orderId));
  const snap = await getDoc(orderRef);
  if (!snap.exists()) throw new Error('ORDER_NOT_FOUND');

  const data = snap.data();
  if (data.driver_id) throw new Error('ALREADY_ASSIGNED');
  if (data.status !== 'pending') throw new Error('NOT_AVAILABLE');

  const patch = sanitizeFirestoreData({
    status: 'accepted_by_driver',
    driver_id: driver.id,
    driver_name: driver.name,
    driver_phone: driver.phone,
    updated_date: new Date().toISOString(),
  });

  await updateDoc(orderRef, patch);
  return { id: snap.id, ...data, ...patch };
}

export async function markOrderPickedUp(orderId) {
  return updateOrderStatus(orderId, {
    status: 'picked_up',
    picked_up_date: new Date().toISOString(),
  });
}

export async function markOrderDelivered(orderId) {
  return updateOrderStatus(orderId, {
    status: 'delivered',
    delivered_date: new Date().toISOString(),
  });
}

export async function updateOrderStatus(orderId, patch) {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  const fullPatch = sanitizeFirestoreData({
    ...patch,
    updated_date: new Date().toISOString(),
  });

  try {
    await updateDoc(orderRef, fullPatch);
    return fullPatch;
  } catch (err) {
    console.error('[ordersService] updateOrderStatus failed:', {
      code: err?.code,
      message: err?.message,
      orderId,
      patch: fullPatch,
      error: err,
    });
    throw err;
  }
}
