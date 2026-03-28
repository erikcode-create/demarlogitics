import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Circle, Polygon, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { GeofenceType } from '@/types';
import { geocodeAddress } from '@/utils/geocoding';
import { MapPin, Trash2 } from 'lucide-react';

interface LocationGeofenceEditorProps {
  lat: number | null;
  lng: number | null;
  geofenceType: GeofenceType;
  geofenceRadiusM: number;
  geofencePolygon: [number, number][] | null;
  address?: string;
  onGeofenceChange: (update: {
    lat?: number;
    lng?: number;
    geofenceType?: GeofenceType;
    geofenceRadiusM?: number;
    geofencePolygon?: [number, number][] | null;
  }) => void;
}

const metersToMiles = (m: number) => (m / 1609.34).toFixed(2);

function DrawControl({
  onCreated,
  onClear,
}: {
  onCreated: (type: 'circle' | 'polygon', layer: L.Layer) => void;
  onClear: () => void;
}) {
  const map = useMap();
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());

  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: { allowIntersection: false, shapeOptions: { color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2 } },
        circle: { shapeOptions: { color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2 } },
        polyline: false,
        rectangle: false,
        marker: false,
        circlemarker: false,
      },
      edit: { featureGroup: drawnItems, remove: true },
    });
    drawControlRef.current = drawControl;
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e: any) => {
      drawnItems.clearLayers();
      const layer = e.layer;
      drawnItems.addLayer(layer);
      const layerType = e.layerType === 'circle' ? 'circle' : 'polygon';
      onCreated(layerType, layer);
    });

    map.on(L.Draw.Event.DELETED, () => {
      onClear();
    });

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
      map.off(L.Draw.Event.CREATED);
      map.off(L.Draw.Event.DELETED);
    };
  }, [map, onCreated, onClear]);

  return null;
}

function FitToCenter({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], 14);
    }
  }, [lat, lng, map]);
  return null;
}

export default function LocationGeofenceEditor({
  lat, lng, geofenceType, geofenceRadiusM, geofencePolygon, address, onGeofenceChange,
}: LocationGeofenceEditorProps) {
  const [geocoding, setGeocoding] = useState(false);
  const center: [number, number] = lat != null && lng != null ? [lat, lng] : [39.8283, -98.5795];
  const zoom = lat != null ? 14 : 4;

  const handleGeocode = async () => {
    if (!address) return;
    setGeocoding(true);
    const result = await geocodeAddress(address);
    setGeocoding(false);
    if (result) {
      onGeofenceChange({ lat: result.lat, lng: result.lng });
    }
  };

  const handleCreated = (type: 'circle' | 'polygon', layer: L.Layer) => {
    if (type === 'circle') {
      const circle = layer as L.Circle;
      const center = circle.getLatLng();
      onGeofenceChange({
        lat: center.lat,
        lng: center.lng,
        geofenceType: 'circle',
        geofenceRadiusM: Math.round(circle.getRadius()),
        geofencePolygon: null,
      });
    } else {
      const polygon = layer as L.Polygon;
      const latlngs = polygon.getLatLngs()[0] as L.LatLng[];
      const coords: [number, number][] = latlngs.map(ll => [ll.lat, ll.lng]);
      // Use centroid as lat/lng reference
      const avgLat = coords.reduce((s, c) => s + c[0], 0) / coords.length;
      const avgLng = coords.reduce((s, c) => s + c[1], 0) / coords.length;
      onGeofenceChange({
        lat: avgLat,
        lng: avgLng,
        geofenceType: 'polygon',
        geofencePolygon: coords,
      });
    }
  };

  const handleClear = () => {
    onGeofenceChange({ geofenceType: 'circle', geofencePolygon: null, geofenceRadiusM: 800 });
  };

  return (
    <div className="space-y-3">
      {address && (
        <Button variant="outline" size="sm" onClick={handleGeocode} disabled={geocoding}>
          <MapPin className="mr-1 h-3.5 w-3.5" />
          {geocoding ? 'Geocoding...' : 'Geocode Address'}
        </Button>
      )}

      <div className="rounded-lg overflow-hidden border border-border relative z-0" style={{ height: 350 }}>
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitToCenter lat={lat} lng={lng} />
          <DrawControl onCreated={handleCreated} onClear={handleClear} />

          {/* Show existing geofence */}
          {geofenceType === 'circle' && lat != null && lng != null && (
            <>
              <Circle
                center={[lat, lng]}
                radius={geofenceRadiusM}
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2, dashArray: '5,5' }}
              />
              <Marker position={[lat, lng]} />
            </>
          )}
          {geofenceType === 'polygon' && geofencePolygon && geofencePolygon.length >= 3 && (
            <Polygon
              positions={geofencePolygon}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2, dashArray: '5,5' }}
            />
          )}
        </MapContainer>
      </div>

      <p className="text-xs text-muted-foreground">
        Use the draw tools (top-right) to draw a circle or polygon geofence. Drawing a new shape replaces the existing one.
      </p>

      {geofenceType === 'circle' && lat != null && (
        <div className="space-y-2">
          <Label>Radius: {metersToMiles(geofenceRadiusM)} mi ({geofenceRadiusM}m)</Label>
          <Slider
            value={[geofenceRadiusM]}
            min={200}
            max={3200}
            step={100}
            onValueChange={([v]) => onGeofenceChange({ geofenceRadiusM: v })}
          />
        </div>
      )}

      {geofenceType === 'polygon' && geofencePolygon && (
        <div className="flex items-center gap-2">
          <Label className="text-sm">Polygon with {geofencePolygon.length} points</Label>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={handleClear}>
            <Trash2 className="mr-1 h-3.5 w-3.5" />Clear
          </Button>
        </div>
      )}
    </div>
  );
}
