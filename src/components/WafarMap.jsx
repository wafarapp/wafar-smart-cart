import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon paths (Vite build issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

import { NEIGHBORHOOD_COORDS } from '@/lib/neighborhoodZones';

// Riyadh district approximate coordinates (synced with neighborhood zones)
export const DISTRICT_COORDS = NEIGHBORHOOD_COORDS;

const mkIcon = (emoji, bg, glow) => L.divIcon({
  html: `<div style="width:38px;height:38px;background:${bg};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 14px ${glow};border:2px solid rgba(255,255,255,0.8)">${emoji}</div>`,
  className: '',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -22],
});

export const customerIcon = mkIcon('📍', 'linear-gradient(135deg,#059669,#10B981)', 'rgba(16,185,129,0.6)');
export const storeIcon    = mkIcon('🏪', 'linear-gradient(135deg,#1D4ED8,#3B82F6)', 'rgba(37,99,235,0.6)');
export const driverIcon   = mkIcon('🛵', 'linear-gradient(135deg,#7C3AED,#9F5FF1)', 'rgba(124,58,237,0.6)');

function ClickHandler({ onClick }) {
  useMapEvents({ click: e => onClick(e.latlng) });
  return null;
}

/**
 * WafarMap — lightweight OpenStreetMap wrapper using react-leaflet.
 *
 * Props:
 *   center      [lat, lng]   Map center (required)
 *   zoom        number       Default 13
 *   height      string       CSS height, default '220px'
 *   dark        boolean      Use dark CartoDB tiles instead of OSM
 *   onMapClick  fn(latlng)   Called when user taps/clicks the map
 *   children                 Any react-leaflet components (Marker, Circle…)
 */
export default function WafarMap({ center, zoom = 13, height = '220px', dark = false, onMapClick, children }) {
  const tile = dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url={tile} />
      {onMapClick && <ClickHandler onClick={onMapClick} />}
      {children}
    </MapContainer>
  );
}