import { NEIGHBORHOOD_COORDS } from '@/lib/neighborhoodZones';

const DISTRICT_COORDS = NEIGHBORHOOD_COORDS;

export const ORDER_TYPE_META = {
  grocery: { label: 'بقالة', emoji: '🛒', color: '#9F5FF1', bg: 'rgba(159,95,241,0.15)' },
  restaurant: { label: 'مطعم', emoji: '🍽️', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  fast_delivery: { label: 'توصيل سريع', emoji: '⚡', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
};

/** Orders waiting for a driver in the driver's neighborhood group */
export const DRIVER_PENDING_STATUSES = [
  'available_for_driver',
  'pending',
  'ready_for_pickup',
  'searching_driver',
  'waiting_driver',
];

/** Driver accepted but not yet picked up */
export const DRIVER_ACCEPTED_STATUSES = [
  'accepted_by_driver',
  'driver_assigned',
  'assigned_to_driver',
];

/** Status progression: pending → accepted → picked_up → delivered */
export const DRIVER_STATUS_FLOW = {
  accepted_by_driver: { next: 'picked_up', label: 'استلمت الطلب', hint: 'توجّه لاستلام الطلب من المتجر' },
  driver_assigned: { next: 'picked_up', label: 'استلمت الطلب', hint: 'توجّه لاستلام الطلب من المتجر' },
  assigned_to_driver: { next: 'picked_up', label: 'استلمت الطلب', hint: 'توجّه لاستلام الطلب من المتجر' },
  picked_up: { next: 'delivered', label: 'تم التوصيل', hint: 'سلّم الطلب للعميل' },
  on_the_way: { next: 'delivered', label: 'تم التوصيل', hint: 'سلّم الطلب للعميل' },
};

export const DRIVER_BUTTONS = {
  accept: 'قبول الطلب',
  reject: 'رفض الطلب',
  pickedUp: 'استلمت الطلب',
  delivered: 'تم التوصيل',
  callCustomer: 'اتصال بالعميل',
  openMap: 'فتح الخريطة',
};

export function getOrderTypeMeta(orderType) {
  return ORDER_TYPE_META[orderType] || ORDER_TYPE_META.grocery;
}

export function getOrderCoords(order) {
  if (order.store_lat && order.store_lng) return [order.store_lat, order.store_lng];
  return DISTRICT_COORDS[order.district || order.neighborhood_name] || DISTRICT_COORDS['الجنادرية'];
}

export function getCustomerCoords(order) {
  if (order.customer_lat && order.customer_lng) return [order.customer_lat, order.customer_lng];
  return DISTRICT_COORDS[order.district || order.neighborhood_name] || DISTRICT_COORDS['الجنادرية'];
}

export function openGoogleMapsRoute(destLat, destLng, label = '') {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving${label ? `&destination_place_id=${encodeURIComponent(label)}` : ''}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function callCustomer(phone) {
  if (!phone) return;
  window.location.href = `tel:${phone.replace(/\s/g, '')}`;
}

/** Countdown to estimated delivery deadline */
export function getOrderCountdown(order, now = Date.now()) {
  if (!order?.created_date) return null;
  const created = new Date(order.created_date).getTime();
  const minutes = order.estimated_minutes || 30;
  const deadline = created + minutes * 60 * 1000;
  const remainingMs = deadline - now;
  const expired = remainingMs <= 0;
  const abs = Math.abs(remainingMs);
  const mins = Math.floor(abs / 60000);
  const secs = Math.floor((abs % 60000) / 1000);
  return {
    expired,
    label: expired ? 'متأخر' : 'متبقي',
    text: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
    percent: Math.min(100, Math.max(0, ((minutes * 60 * 1000 - remainingMs) / (minutes * 60 * 1000)) * 100)),
  };
}

export function formatDriverEarning(order) {
  return (order?.driver_fee ?? 12).toFixed(0);
}

export function formatOrderTotal(order) {
  return (order?.total_amount ?? 0).toFixed(2);
}

export function getOrderNeighborhood(order) {
  return order?.neighborhood_name || order?.district || '—';
}

export function isPendingForDriver(status) {
  return DRIVER_PENDING_STATUSES.includes(status);
}

export function isAcceptedByDriver(status) {
  return DRIVER_ACCEPTED_STATUSES.includes(status);
}

export function isActiveDriverStatus(status) {
  return [...DRIVER_ACCEPTED_STATUSES, 'picked_up', 'on_the_way'].includes(status);
}

export function isPickupPhase(status) {
  return isAcceptedByDriver(status);
}

export function getRejectedOrderIds() {
  try {
    return JSON.parse(sessionStorage.getItem('wafarDriverRejected') || '[]');
  } catch {
    return [];
  }
}

export function rejectOrderLocally(orderId) {
  const ids = getRejectedOrderIds();
  if (!ids.includes(orderId)) {
    sessionStorage.setItem('wafarDriverRejected', JSON.stringify([...ids, orderId]));
  }
}
