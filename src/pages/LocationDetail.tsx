import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, lazy, Suspense } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MapPin, Trash2, Package, Circle, Hexagon } from 'lucide-react';
import { GeofenceType } from '@/types';
import { toast } from 'sonner';

const LocationGeofenceEditor = lazy(() => import('@/components/locations/LocationGeofenceEditor'));

const LocationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { locations, setLocations, loads, deleteRecord } = useAppContext();

  const location = locations.find(l => l.id === id);
  if (!location) {
    return (
      <div className="p-6">
        Location not found. <Button variant="link" onClick={() => navigate('/locations')}>Back</Button>
      </div>
    );
  }

  const linkedLoads = loads.filter(l => l.pickupLocationId === id || l.deliveryLocationId === id);

  const update = (fields: Partial<typeof location>) => {
    setLocations(prev => prev.map(l => l.id === id ? { ...l, ...fields } : l));
  };

  const handleDelete = () => {
    deleteRecord('locations', id!);
    setLocations(prev => prev.filter(l => l.id !== id));
    toast.success('Location deleted');
    navigate('/locations');
  };

  const handleGeofenceChange = (geo: {
    lat?: number; lng?: number; geofenceType?: GeofenceType;
    geofenceRadiusM?: number; geofencePolygon?: [number, number][] | null;
  }) => {
    update(geo);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/locations">Locations</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{location.name}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5" />{location.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {[location.address, location.city, location.state].filter(Boolean).join(', ') || 'No address'}
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          {location.geofenceType === 'polygon' ? <><Hexagon className="h-3 w-3" />Polygon</> : <><Circle className="h-3 w-3" />Circle</>}
        </Badge>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
              <Trash2 className="mr-1 h-4 w-4" />Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {location.name}?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete this saved location. Loads using it will keep their geofence data.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Editable Details */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={location.name} onChange={e => update({ name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Address</Label>
              <Input value={location.address} onChange={e => update({ address: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">City</Label>
              <Input value={location.city} onChange={e => update({ city: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">State</Label>
              <Input value={location.state} onChange={e => update({ state: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={location.notes} onChange={e => update({ notes: e.target.value })} rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Geofence Editor */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-1"><MapPin className="h-4 w-4" />Geofence</CardTitle></CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-[350px] rounded-lg bg-muted animate-pulse" />}>
            <LocationGeofenceEditor
              lat={location.lat}
              lng={location.lng}
              geofenceType={location.geofenceType}
              geofenceRadiusM={location.geofenceRadiusM}
              geofencePolygon={location.geofencePolygon}
              address={[location.address, location.city, location.state].filter(Boolean).join(', ')}
              onGeofenceChange={handleGeofenceChange}
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Linked Loads */}
      {linkedLoads.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-1"><Package className="h-4 w-4" />Loads Using This Location</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {linkedLoads.map(l => (
                <Link key={l.id} to={`/loads/${l.id}`} className="flex items-center justify-between p-3 hover:bg-accent/50">
                  <div>
                    <span className="font-medium text-sm">{l.loadNumber}</span>
                    <span className="text-sm text-muted-foreground ml-3">{l.origin} → {l.destination}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {l.pickupLocationId === id ? 'Pickup' : 'Delivery'}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LocationDetail;
