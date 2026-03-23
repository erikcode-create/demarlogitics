import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Truck, Clock, Navigation } from 'lucide-react';
import { loadStatusLabels } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import { PageLoader } from '@/components/ui/page-loader';

const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

interface TrackedDriver {
  load_id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  timestamp: string;
  is_active: boolean;
}

const statusColors: Record<string, string> = {
  booked: 'bg-blue-500/20 text-blue-400',
  dispatched: 'bg-cyan-500/20 text-cyan-400',
  rate_con_signed: 'bg-teal-500/20 text-teal-400',
  at_pickup: 'bg-amber-500/20 text-amber-400',
  picked_up: 'bg-orange-500/20 text-orange-400',
  in_transit: 'bg-warning/20 text-warning',
  at_delivery: 'bg-lime-500/20 text-lime-400',
};

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

const LiveTracking = () => {
  const { loads, shippers, carriers, loading: appLoading } = useAppContext();
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Map<string, TrackedDriver>>(new Map());
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Active loads = booked through at_delivery
  const activeStatuses = ['booked', 'dispatched', 'rate_con_signed', 'at_pickup', 'picked_up', 'in_transit', 'at_delivery'];
  const activeLoads = useMemo(
    () => loads.filter(l => activeStatuses.includes(l.status)),
    [loads]
  );

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from('driver_locations')
        .select('load_id, latitude, longitude, speed, heading, accuracy, timestamp, is_active')
        .eq('is_active', true);

      if (data) {
        const map = new Map<string, TrackedDriver>();
        for (const row of data) {
          map.set(row.load_id, row as TrackedDriver);
        }
        setDrivers(map);
      }
      setDataLoading(false);
    };

    fetchAll();

    // Subscribe to all driver location changes
    const channel = supabase
      .channel('all-driver-locations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_locations' },
        (payload) => {
          const row = payload.new as any;
          if (!row) return;
          setDrivers(prev => {
            const next = new Map(prev);
            if (row.is_active) {
              next.set(row.load_id, row as TrackedDriver);
            } else {
              next.delete(row.load_id);
            }
            return next;
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  if (appLoading) return <PageLoader />;

  const shipperMap = new Map(shippers.map(s => [s.id, s]));
  const carrierMap = new Map(carriers.map(c => [c.id, c]));

  const filteredLoads = activeLoads.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    const shipper = shipperMap.get(l.shipperId);
    const carrier = l.carrierId ? carrierMap.get(l.carrierId) : null;
    return (
      l.referenceNumber.toLowerCase().includes(q) ||
      l.loadNumber.toLowerCase().includes(q) ||
      l.origin.toLowerCase().includes(q) ||
      l.destination.toLowerCase().includes(q) ||
      (shipper?.company || '').toLowerCase().includes(q) ||
      (carrier?.company || '').toLowerCase().includes(q) ||
      (l.driverName || '').toLowerCase().includes(q)
    );
  });

  const trackedPositions: [number, number][] = [];
  for (const load of filteredLoads) {
    const d = drivers.get(load.id);
    if (d) trackedPositions.push([d.latitude, d.longitude]);
  }

  const defaultCenter: [number, number] = [39.8283, -98.5795]; // Center of US

  const handleLoadClick = (loadId: string) => {
    setSelectedLoadId(loadId === selectedLoadId ? null : loadId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Live Tracking</h1>
          <Badge variant="secondary" className="gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            {drivers.size} tracking
          </Badge>
        </div>
        <Badge variant="outline">{activeLoads.length} active loads</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: 500, height: 'calc(100vh - 180px)' }}>
        {/* Map */}
        <div className="lg:col-span-2 rounded-lg overflow-hidden border" style={{ minHeight: 400 }}>
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
            {filteredLoads.map(load => {
              const d = drivers.get(load.id);
              if (!d) return null;
              const shipper = shipperMap.get(load.shipperId);
              const carrier = load.carrierId ? carrierMap.get(load.carrierId) : null;
              const speedMph = d.speed ? Math.round(d.speed * 2.237) : null;
              const lastUpdate = new Date(d.timestamp);

              return (
                <Marker
                  key={load.id}
                  position={[d.latitude, d.longitude]}
                  icon={truckIcon}
                  eventHandlers={{ click: () => setSelectedLoadId(load.id) }}
                >
                  <Popup>
                    <div className="text-xs space-y-1 min-w-[180px]">
                      <div className="font-bold text-sm">#{load.referenceNumber}</div>
                      <div>{load.origin} → {load.destination}</div>
                      {shipper && <div>Shipper: {shipper.company}</div>}
                      {carrier && <div>Carrier: {carrier.company}</div>}
                      {load.driverName && <div>Driver: {load.driverName}</div>}
                      {speedMph !== null && <div>Speed: {speedMph} mph</div>}
                      <div>Updated: {lastUpdate.toLocaleTimeString()}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            {trackedPositions.length > 0 && <FitBounds positions={trackedPositions} />}
          </MapContainer>
        </div>

        {/* Load List Sidebar */}
        <div className="flex flex-col gap-3 overflow-hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search loads, drivers, cities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {dataLoading ? (
              <p className="text-sm text-muted-foreground p-4">Loading tracking data...</p>
            ) : filteredLoads.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No active loads found.</p>
            ) : (
              filteredLoads.map(load => {
                const d = drivers.get(load.id);
                const shipper = shipperMap.get(load.shipperId);
                const carrier = load.carrierId ? carrierMap.get(load.carrierId) : null;
                const isSelected = selectedLoadId === load.id;
                const speedMph = d?.speed ? Math.round(d.speed * 2.237) : null;

                return (
                  <Card
                    key={load.id}
                    className={`cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                    onClick={() => handleLoadClick(load.id)}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">#{load.referenceNumber}</span>
                        <Badge className={`text-[10px] ${statusColors[load.status] || ''}`}>
                          {loadStatusLabels[load.status]}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{load.origin} → {load.destination}</span>
                      </div>

                      {shipper && (
                        <div className="text-xs text-muted-foreground truncate">
                          Shipper: {shipper.company}
                        </div>
                      )}

                      {carrier && (
                        <div className="text-xs text-muted-foreground truncate">
                          Carrier: {carrier.company}
                        </div>
                      )}

                      {load.driverName && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Truck className="h-3 w-3 shrink-0" />
                          {load.driverName}
                          {load.driverPhone && ` · ${load.driverPhone}`}
                        </div>
                      )}

                      {d ? (
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-green-400">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                            </span>
                            GPS Active
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            {speedMph !== null && (
                              <>
                                <Navigation className="h-3 w-3" />
                                {speedMph} mph
                              </>
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          No GPS signal
                        </div>
                      )}

                      {isSelected && (
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/loads/${load.id}`); }}
                          className="text-xs text-primary hover:underline mt-1"
                        >
                          View Load Details →
                        </button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
