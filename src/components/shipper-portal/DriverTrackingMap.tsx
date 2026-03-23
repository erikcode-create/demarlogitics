import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

// Custom truck icon
const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

interface DriverLocation {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  timestamp: string;
  is_active: boolean;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface DriverTrackingMapProps {
  loadId: string;
}

export default function DriverTrackingMap({ loadId }: DriverTrackingMapProps) {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Initial fetch
    const fetchLocation = async () => {
      const { data } = await supabase
        .from('driver_locations')
        .select('latitude, longitude, speed, heading, accuracy, timestamp, is_active')
        .eq('load_id', loadId)
        .eq('is_active', true)
        .maybeSingle();

      if (data) setLocation(data as DriverLocation);
      setLoading(false);
    };

    fetchLocation();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`driver-location-${loadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations',
          filter: `load_id=eq.${loadId}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row && row.is_active) {
            setLocation({
              latitude: row.latitude,
              longitude: row.longitude,
              speed: row.speed,
              heading: row.heading,
              accuracy: row.accuracy,
              timestamp: row.timestamp,
              is_active: row.is_active,
            });
          } else if (row && !row.is_active) {
            setLocation(null);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [loadId]);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">Live Tracking</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">Loading tracking data...</p></CardContent>
      </Card>
    );
  }

  if (!location) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">Live Tracking</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">No active tracking data available. Tracking begins once the driver opens the load in the DeMar Driver app.</p></CardContent>
      </Card>
    );
  }

  const center: [number, number] = [location.latitude, location.longitude];
  const lastUpdate = new Date(location.timestamp);
  const speedMph = location.speed ? Math.round(location.speed * 2.237) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          Live Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="rounded-lg overflow-hidden border" style={{ height: 350 }}>
          <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={center} icon={truckIcon}>
              <Popup>
                Driver Location<br />
                {speedMph !== null && `Speed: ${speedMph} mph`}
              </Popup>
            </Marker>
            <MapUpdater center={center} />
          </MapContainer>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
          {speedMph !== null && <span>{speedMph} mph</span>}
        </div>
      </CardContent>
    </Card>
  );
}
