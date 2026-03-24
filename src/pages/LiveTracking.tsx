import { useEffect, useState, useRef, useMemo, Component, lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Truck, Clock, AlertTriangle } from 'lucide-react';
import { loadStatusLabels } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import { PageLoader } from '@/components/ui/page-loader';

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

// Error boundary to catch Leaflet crashes
class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-muted/20 rounded-lg border p-8">
          <div className="text-center space-y-2">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Map failed to load. Try refreshing the page.</p>
            <p className="text-xs text-muted-foreground/60">{this.state.error}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy-loaded map component to avoid Leaflet crashing at module level
const TrackingMap = lazy(() => import('@/components/tracking/TrackingMap'));

const LiveTracking = () => {
  const { loads, shippers, carriers, loading: appLoading } = useAppContext();
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Map<string, TrackedDriver>>(new Map());
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const activeStatuses = useMemo(() => ['booked', 'dispatched', 'rate_con_signed', 'at_pickup', 'picked_up', 'in_transit', 'at_delivery'], []);
  const activeLoads = useMemo(
    () => loads.filter(l => activeStatuses.includes(l.status)),
    [loads, activeStatuses]
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

  // Build marker data to pass to the lazy map
  const markers = filteredLoads
    .filter(load => drivers.has(load.id))
    .map(load => {
      const d = drivers.get(load.id)!;
      const shipper = shipperMap.get(load.shipperId);
      const carrier = load.carrierId ? carrierMap.get(load.carrierId) : null;
      return {
        loadId: load.id,
        lat: d.latitude,
        lng: d.longitude,
        speed: d.speed,
        timestamp: d.timestamp,
        referenceNumber: load.referenceNumber,
        origin: load.origin,
        destination: load.destination,
        shipperName: shipper?.company || '',
        carrierName: carrier?.company || '',
        driverName: load.driverName || '',
      };
    });

  // Loads with tracking issues
  const noDriverPhone = activeLoads.filter(l => !l.driverPhone);
  const noGps = activeLoads.filter(l => l.driverPhone && !drivers.has(l.id));
  const issueCount = noDriverPhone.length + noGps.length;

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
          {issueCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {issueCount} issue{issueCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <Badge variant="outline">{activeLoads.length} active loads</Badge>
      </div>

      {/* Tracking Issues Banner */}
      {issueCount > 0 && !dataLoading && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Tracking Issues
            </div>
            {noDriverPhone.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">No driver phone assigned:</p>
                <div className="flex flex-wrap gap-1">
                  {noDriverPhone.map(l => (
                    <button
                      key={l.id}
                      onClick={() => navigate(`/loads/${l.id}`)}
                      className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      #{l.referenceNumber} · {loadStatusLabels[l.status]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {noGps.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Driver assigned but no GPS signal:</p>
                <div className="flex flex-wrap gap-1">
                  {noGps.map(l => (
                    <button
                      key={l.id}
                      onClick={() => navigate(`/loads/${l.id}`)}
                      className="text-xs px-2 py-0.5 rounded bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
                    >
                      #{l.referenceNumber} · {l.driverName || l.driverPhone}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: 500, height: 'calc(100vh - 180px)' }}>
        {/* Map */}
        <div className="lg:col-span-2 rounded-lg overflow-hidden border" style={{ minHeight: 400 }}>
          <MapErrorBoundary>
            <Suspense fallback={
              <div className="flex items-center justify-center h-full min-h-[400px] bg-muted/10">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading map...</p>
                </div>
              </div>
            }>
              <TrackingMap
                markers={markers}
                onMarkerClick={(loadId) => setSelectedLoadId(loadId)}
              />
            </Suspense>
          </MapErrorBoundary>
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

                return (
                  <Card
                    key={load.id}
                    className={`cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                    onClick={() => setSelectedLoadId(load.id === selectedLoadId ? null : load.id)}
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
                        <div className="flex items-center text-xs">
                          <span className="flex items-center gap-1 text-green-400">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                            </span>
                            GPS Active
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
