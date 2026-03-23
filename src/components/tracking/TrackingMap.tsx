import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
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
        const speedMph = m.speed ? Math.round(m.speed * 2.237) : null;
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
                {speedMph !== null && <div>Speed: {speedMph} mph</div>}
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
