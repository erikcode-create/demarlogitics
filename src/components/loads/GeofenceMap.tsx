import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import 'leaflet/dist/leaflet.css';

interface GeofenceMapProps {
  pickupLat?: number;
  pickupLng?: number;
  pickupRadiusM: number;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryRadiusM: number;
  onPickupRadiusChange: (radius: number) => void;
  onDeliveryRadiusChange: (radius: number) => void;
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [positions, map]);
  return null;
}

const metersToMiles = (m: number) => (m / 1609.34).toFixed(2);

export default function GeofenceMap({
  pickupLat, pickupLng, pickupRadiusM,
  deliveryLat, deliveryLng, deliveryRadiusM,
  onPickupRadiusChange, onDeliveryRadiusChange,
}: GeofenceMapProps) {
  const positions: [number, number][] = [];
  if (pickupLat != null && pickupLng != null) positions.push([pickupLat, pickupLng]);
  if (deliveryLat != null && deliveryLng != null) positions.push([deliveryLat, deliveryLng]);

  if (positions.length === 0) return null;

  const center = positions.length === 2
    ? [(positions[0][0] + positions[1][0]) / 2, (positions[0][1] + positions[1][1]) / 2] as [number, number]
    : positions[0];

  return (
    <div className="space-y-4">
      <div className="rounded-lg overflow-hidden border border-border relative z-0" style={{ height: 300 }}>
        <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds positions={positions} />

          {pickupLat != null && pickupLng != null && (
            <>
              <Circle
                center={[pickupLat, pickupLng]}
                radius={pickupRadiusM}
                pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.15, weight: 2 }}
              />
              <Marker position={[pickupLat, pickupLng]}>
                <Popup>Pickup Geofence ({metersToMiles(pickupRadiusM)} mi)</Popup>
              </Marker>
            </>
          )}

          {deliveryLat != null && deliveryLng != null && (
            <>
              <Circle
                center={[deliveryLat, deliveryLng]}
                radius={deliveryRadiusM}
                pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.15, weight: 2 }}
              />
              <Marker position={[deliveryLat, deliveryLng]}>
                <Popup>Delivery Geofence ({metersToMiles(deliveryRadiusM)} mi)</Popup>
              </Marker>
            </>
          )}
        </MapContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {pickupLat != null && pickupLng != null && (
          <div className="space-y-2">
            <Label className="text-amber-400">Pickup Radius: {metersToMiles(pickupRadiusM)} mi</Label>
            <Slider
              value={[pickupRadiusM]}
              min={200}
              max={3200}
              step={100}
              onValueChange={([v]) => onPickupRadiusChange(v)}
            />
          </div>
        )}
        {deliveryLat != null && deliveryLng != null && (
          <div className="space-y-2">
            <Label className="text-green-400">Delivery Radius: {metersToMiles(deliveryRadiusM)} mi</Label>
            <Slider
              value={[deliveryRadiusM]}
              min={200}
              max={3200}
              step={100}
              onValueChange={([v]) => onDeliveryRadiusChange(v)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
