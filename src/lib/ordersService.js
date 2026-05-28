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
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const ORDERS_COLLECTION = 'orders';

const ACTIVE_DRIVER_STATUSES = ['accepted_by_driver', 'picked_up', 'on_the_way'];

function docToOrder(snapshot) {
  if (!snapshot?.exists) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

function docsToOrders(snapshot) {
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createOrderInFirestore(payload) {
  const now = new Date().toISOString();
  const orderData = {
    ...payload,
    status: 'pending',
    driver_id: null,
    driver_name: null,
    driver_phone: null,
    created_date: now,
    updated_date: now,
  };

  const ref = await addDoc(collection(db, ORDERS_COLLECTION), orderData);
  return { id: ref.id, ...orderData };
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
    (snapshot) => callback(docToOrder(snapshot)),
    (err) => {
      console.warn('[ordersService] order subscription error:', err.message);
      callback(null);
    }
  );
}

export async function acceptOrderByDriver(orderId, driver) {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(orderRef);
    if (!snap.exists()) throw new Error('ORDER_NOT_FOUND');

    const data = snap.data();
    if (data.driver_id) throw new Error('ALREADY_ASSIGNED');
    if (data.status !== 'pending') throw new Error('NOT_AVAILABLE');

    const patch = {
      status: 'accepted_by_driver',
      driver_id: driver.id,
      driver_name: driver.name,
      driver_phone: driver.phone,
      updated_date: new Date().toISOString(),
    };

    transaction.update(orderRef, patch);
    return { id: orderId, ...data, ...patch };
  });
}

export async function updateOrderStatus(orderId, patch) {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  const fullPatch = {
    ...patch,
    updated_date: new Date().toISOString(),
  };
  await updateDoc(orderRef, fullPatch);
  return fullPatch;
}
