import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const truckSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="40" height="40">
  <rect x="2" y="18" width="40" height="24" rx="3" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
  <rect x="42" y="24" width="18" height="18" rx="2" fill="#334155" stroke="#f59e0b" stroke-width="2"/>
  <rect x="44" y="26" width="10" height="8" rx="1" fill="#60a5fa"/>
  <circle cx="16" cy="46" r="6" fill="#334155" stroke="#f59e0b" stroke-width="2"/>
  <circle cx="16" cy="46" r="3" fill="#f59e0b"/>
  <circle cx="50" cy="46" r="6" fill="#334155" stroke="#f59e0b" stroke-width="2"/>
  <circle cx="50" cy="46" r="3" fill="#f59e0b"/>
</svg>`;

const truckIcon = new L.DivIcon({
  html: truckSvg,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  className: '',
});

export interface MapMarker {
  loadId: string;
  lat: number;
  lng: number;
  speed: number | null;
  timestamp: string;
  referenceNumber: string;
  origin: string;
  destination: string;
  shipperName: string;
  carrierName: string;
  driverName: string;
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 10);
    } else {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [positions, map]);
  return null;
}

interface TrackingMapProps {
  markers: MapMarker[];
  onMarkerClick: (loadId: string) => void;
}

export default function TrackingMap({ markers, onMarkerClick }: TrackingMapProps) {
  const defaultCenter: [number, number] = [39.8283, -98.5795];
  const positions: [number, number][] = markers.map(m => [m.lat, m.lng]);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={4}
      style={{ height: '100%', width: '100%', minHeight: 400 }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map(m => {
        const lastUpdate = new Date(m.timestamp);
        return (
          <Marker
            key={m.loadId}
            position={[m.lat, m.lng]}
            icon={truckIcon}
            eventHandlers={{ click: () => onMarkerClick(m.loadId) }}
          >
            <Popup>
              <div className="text-xs space-y-1 min-w-[180px]">
                <div className="font-bold text-sm">#{m.referenceNumber}</div>
                <div>{m.origin} → {m.destination}</div>
                {m.shipperName && <div>Shipper: {m.shipperName}</div>}
                {m.carrierName && <div>Carrier: {m.carrierName}</div>}
                {m.driverName && <div>Driver: {m.driverName}</div>}
                <div>Updated: {lastUpdate.toLocaleTimeString()}</div>
              </div>
            </Popup>
          </Marker>
        );
      })}
      {positions.length > 0 && <FitBounds positions={positions} />}
    </MapContainer>
  );
}
