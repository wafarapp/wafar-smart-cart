import { createOrderInFirestore } from '@/lib/ordersService';

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
 * Create an order in Firestore (orders collection).
 * Returns { order, isLocalMock: false }.
 */
export async function createOrder(payload) {
  try {
    const order = await createOrderInFirestore(payload);
    return { order, isLocalMock: false };
  } catch (err) {
    console.error('[localOrders] createOrder failed:', {
      code: err?.code,
      message: err?.message,
      order_number: payload?.order_number,
      error: err,
    });
    throw err;
  }
}
