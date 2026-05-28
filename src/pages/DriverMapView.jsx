import { Navigation } from 'lucide-react';
import { useDriver } from '@/context/DriverContext';
import WafarMap, { driverIcon, storeIcon } from '@/components/WafarMap';
import { Marker, Popup } from 'react-leaflet';
import { getOrderCoords, getCustomerCoords, openGoogleMapsRoute, isPickupPhase, DRIVER_BUTTONS } from '@/lib/driverUtils';
import { NEIGHBORHOOD_COORDS } from '@/lib/neighborhoodZones';

export default function DriverMapView() {
  const { driver, pendingOrders, activeOrder, driverGeoPos, isOnline } = useDriver();

  const group = driver?.neighborhood_group || driver?.district || 'الجنادرية';
  const center = driverGeoPos || NEIGHBORHOOD_COORDS[group] || NEIGHBORHOOD_COORDS['الجنادرية'];

  const focusOrder = activeOrder || pendingOrders[0];
  const navTarget = focusOrder
    ? isPickupPhase(activeOrder?.status)
      ? getOrderCoords(focusOrder)
      : getCustomerCoords(focusOrder)
    : center;

  return (
    <div className="animate-fade-up space-y-3 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-white">خريطة التوصيل</h1>
          <p className="text-[11px] text-gray-500">حي {group} · {isOnline ? 'متصل' : 'غير متصل'}</p>
        </div>
        {focusOrder && (
          <button
            type="button"
            onClick={() => openGoogleMapsRoute(navTarget[0], navTarget[1])}
            className="flex items-center gap-1.5 rounded-xl bg-blue-500/15 px-3 py-2 text-xs font-bold text-blue-300 ring-1 ring-blue-500/25"
          >
            <Navigation size={14} />
            {DRIVER_BUTTONS.openMap}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl ring-1 ring-white/10" style={{ height: 'calc(100vh - 280px)', minHeight: '320px' }}>
        <WafarMap center={center} zoom={14} height="100%" dark>
          {driverGeoPos && (
            <Marker position={driverGeoPos} icon={driverIcon}>
              <Popup><span dir="rtl">🛵 موقعك</span></Popup>
            </Marker>
          )}
          {pendingOrders.map((order) => {
            const coords = getOrderCoords(order);
            return (
              <Marker key={order.id} position={coords} icon={storeIcon}>
                <Popup>
                  <div dir="rtl" style={{ minWidth: 120 }}>
                    <p className="font-bold">#{order.order_number}</p>
                    <p className="text-xs text-emerald-600">{(order.driver_fee ?? 12).toFixed(0)} ر</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          {activeOrder && (
            <Marker position={getCustomerCoords(activeOrder)} icon={storeIcon}>
              <Popup><span dir="rtl">🏠 العميل</span></Popup>
            </Marker>
          )}
        </WafarMap>
      </div>

      {!focusOrder && (
        <p className="text-center text-xs text-gray-600">لا توجد طلبات لعرض المسار — انتظر طلباً جديداً</p>
      )}
    </div>
  );
}
