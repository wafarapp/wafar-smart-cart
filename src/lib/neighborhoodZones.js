/**
 * Neighborhood Zones — Wafar (موصل الحي)
 * Distance bands, pricing, and order field helpers.
 */

export const OUT_OF_SERVICE_MESSAGE = 'الخدمة غير متوفرة حالياً في موقعك';

export const ZONE_TYPES = {
  inside: 'inside',
  near: 'near',
  far: 'far',
  out_of_service: 'out_of_service',
};

export const ZONE_LABELS_AR = {
  inside: 'داخل الحي',
  near: 'قريب',
  far: 'بعيد',
  out_of_service: 'خارج النطاق',
};

/** Sub-zones map to parent group for driver matching */
export const NEIGHBORHOOD_GROUPS = {
  الجنادرية: 'الجنادرية',
  غصون: 'الجنادرية',
  المعالي: 'الجنادرية',
  الشروق: 'الشروق',
  النظيم: 'النظيم',
  الندوة: 'الندوة',
};

export const DRIVER_GROUP_OPTIONS = ['الجنادرية', 'الشروق', 'النظيم', 'الندوة'];

const DEFAULT_ZONE_RADII = {
  inside_max_km: 3,
  near_max_km: 5,
  far_max_km: 8,
};

const DEFAULT_ZONE_PRICING = {
  inside: { customer_delivery_fee: 10, driver_fee: 8 },
  near: { customer_delivery_fee: 13, driver_fee: 10 },
  far: { customer_delivery_fee: 16, driver_fee: 12 },
  out_of_service: { customer_delivery_fee: 0, driver_fee: 0 },
};

export const NEIGHBORHOOD_NAMES = [
  'الجنادرية',
  'الشروق',
  'النظيم',
  'المعالي',
  'غصون',
  'الندوة',
];

/** Approximate Riyadh-area centers [lat, lng] */
export const NEIGHBORHOOD_COORDS = {
  الجنادرية: [24.78, 46.88],
  الشروق: [24.82, 46.82],
  النظيم: [24.79, 46.85],
  المعالي: [24.76, 46.78],
  غصون: [24.81, 46.79],
  الندوة: [24.775, 46.865],
};

const CONFIG_STORAGE_KEY = 'wafarNeighborhoodZoneConfig';

function cloneDefaults() {
  return {
    zone_radii: { ...DEFAULT_ZONE_RADII },
    zone_pricing: JSON.parse(JSON.stringify(DEFAULT_ZONE_PRICING)),
    neighborhoods: NEIGHBORHOOD_NAMES.map((name) => ({
      name,
      group: NEIGHBORHOOD_GROUPS[name],
      coords: NEIGHBORHOOD_COORDS[name],
    })),
  };
}

/** Haversine distance in km between two [lat, lng] points */
export function distanceKm(from, to) {
  if (!from?.length || !to?.length) return null;
  const [lat1, lon1] = from;
  const [lat2, lon2] = to;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNeighborhoodGroup(neighborhoodName) {
  if (!neighborhoodName) return null;
  return NEIGHBORHOOD_GROUPS[neighborhoodName] || neighborhoodName;
}

export function isKnownNeighborhood(name) {
  return NEIGHBORHOOD_NAMES.includes(name);
}

export function getZoneConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...cloneDefaults(),
        ...parsed,
        zone_radii: { ...DEFAULT_ZONE_RADII, ...parsed.zone_radii },
        zone_pricing: {
          ...DEFAULT_ZONE_PRICING,
          ...parsed.zone_pricing,
          inside: { ...DEFAULT_ZONE_PRICING.inside, ...parsed.zone_pricing?.inside },
          near: { ...DEFAULT_ZONE_PRICING.near, ...parsed.zone_pricing?.near },
          far: { ...DEFAULT_ZONE_PRICING.far, ...parsed.zone_pricing?.far },
        },
      };
    }
  } catch {
    /* ignore */
  }
  return cloneDefaults();
}

export function saveZoneConfig(config) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function getZoneType(distanceKm, config = getZoneConfig()) {
  const { inside_max_km, near_max_km, far_max_km } = config.zone_radii;
  if (distanceKm == null || distanceKm > far_max_km) return ZONE_TYPES.out_of_service;
  if (distanceKm <= inside_max_km) return ZONE_TYPES.inside;
  if (distanceKm <= near_max_km) return ZONE_TYPES.near;
  if (distanceKm <= far_max_km) return ZONE_TYPES.far;
  return ZONE_TYPES.out_of_service;
}

export function getZoneFees(zoneType, config = getZoneConfig()) {
  const pricing = config.zone_pricing[zoneType] || config.zone_pricing.out_of_service;
  return {
    customer_delivery_fee: pricing.customer_delivery_fee ?? 0,
    driver_fee: pricing.driver_fee ?? 0,
  };
}

/**
 * Resolve zone from customer neighborhood and optional coordinates.
 * @param {object} opts
 * @param {string} opts.neighborhoodName - Customer district / neighborhood
 * @param {number} [opts.customerLat]
 * @param {number} [opts.customerLng]
 * @param {number} [opts.destinationLat] - Store or pickup point
 * @param {number} [opts.destinationLng]
 * @param {number} [opts.fallbackDistanceKm] - e.g. store.distance_km when no GPS
 */
export function resolveNeighborhoodZone(opts = {}) {
  const config = opts.config || getZoneConfig();
  const name = opts.neighborhoodName || 'الجنادرية';
  const center = NEIGHBORHOOD_COORDS[name] || NEIGHBORHOOD_COORDS.الجنادرية;

  const customerPoint =
    opts.customerLat != null && opts.customerLng != null
      ? [opts.customerLat, opts.customerLng]
      : center;

  const destPoint =
    opts.destinationLat != null && opts.destinationLng != null
      ? [opts.destinationLat, opts.destinationLng]
      : center;

  let calculatedDistanceKm = distanceKm(customerPoint, destPoint);

  if (
    (opts.customerLat == null || opts.customerLng == null) &&
    (opts.destinationLat == null || opts.destinationLng == null) &&
    opts.fallbackDistanceKm != null
  ) {
    calculatedDistanceKm = Number(opts.fallbackDistanceKm);
  } else if (calculatedDistanceKm == null) {
    calculatedDistanceKm = 1.5;
  }

  calculatedDistanceKm = Math.round(calculatedDistanceKm * 100) / 100;

  const zone_type = getZoneType(calculatedDistanceKm, config);
  const fees = getZoneFees(zone_type, config);

  return {
    neighborhood_name: name,
    neighborhood_group: getNeighborhoodGroup(name),
    zone_type,
    calculated_distance_km: calculatedDistanceKm,
    customer_delivery_fee: fees.customer_delivery_fee,
    driver_fee: fees.driver_fee,
    is_service_available: zone_type !== ZONE_TYPES.out_of_service,
  };
}

/** Fields to spread into Order.create */
export function orderZoneFields(zoneResult) {
  return {
    neighborhood_name: zoneResult.neighborhood_name,
    neighborhood_group: zoneResult.neighborhood_group,
    zone_type: zoneResult.zone_type,
    calculated_distance_km: zoneResult.calculated_distance_km,
    customer_delivery_fee: zoneResult.customer_delivery_fee,
    driver_fee: zoneResult.driver_fee,
  };
}

/** Driver only sees orders in their group; never out_of_service */
export function isOrderVisibleToDriver(order, driver) {
  if (!order || !driver) return false;
  if (order.zone_type === ZONE_TYPES.out_of_service) return false;
  if (order.status === 'cancelled') return false;

  const driverGroup =
    driver.neighborhood_group || getNeighborhoodGroup(driver.district) || DRIVER_GROUP_OPTIONS[0];
  const orderGroup =
    order.neighborhood_group ||
    getNeighborhoodGroup(order.neighborhood_name || order.district);

  if (!orderGroup) return true;
  return driverGroup === orderGroup;
}

export function countOrdersByNeighborhood(orders) {
  const counts = Object.fromEntries(NEIGHBORHOOD_NAMES.map((n) => [n, 0]));
  orders.forEach((o) => {
    const n = o.neighborhood_name || o.district;
    if (n && counts[n] !== undefined) counts[n]++;
    else if (n) counts[n] = 1;
  });
  return counts;
}
