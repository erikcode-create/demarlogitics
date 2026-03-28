import { useState, lazy, Suspense } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/context/AppContext';
import { GeofenceType, SavedLocation } from '@/types';
import { toast } from 'sonner';

const LocationGeofenceEditor = lazy(() => import('./LocationGeofenceEditor'));

interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLocation?: SavedLocation | null;
}

export default function LocationFormDialog({ open, onOpenChange, editingLocation }: LocationFormDialogProps) {
  const { setLocations } = useAppContext();

  const [name, setName] = useState(editingLocation?.name || '');
  const [address, setAddress] = useState(editingLocation?.address || '');
  const [city, setCity] = useState(editingLocation?.city || '');
  const [state, setState] = useState(editingLocation?.state || '');
  const [notes, setNotes] = useState(editingLocation?.notes || '');
  const [lat, setLat] = useState<number | null>(editingLocation?.lat ?? null);
  const [lng, setLng] = useState<number | null>(editingLocation?.lng ?? null);
  const [geofenceType, setGeofenceType] = useState<GeofenceType>(editingLocation?.geofenceType || 'circle');
  const [geofenceRadiusM, setGeofenceRadiusM] = useState(editingLocation?.geofenceRadiusM ?? 800);
  const [geofencePolygon, setGeofencePolygon] = useState<[number, number][] | null>(editingLocation?.geofencePolygon ?? null);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (editingLocation) {
      setLocations(prev => prev.map(loc => loc.id === editingLocation.id ? {
        ...loc,
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        notes: notes.trim(),
        lat, lng, geofenceType, geofenceRadiusM, geofencePolygon,
      } : loc));
      toast.success('Location updated');
    } else {
      const loc: SavedLocation = {
        id: crypto.randomUUID(),
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        notes: notes.trim(),
        lat, lng, geofenceType, geofenceRadiusM, geofencePolygon,
        createdAt: new Date().toISOString(),
      };
      setLocations(prev => [...prev, loc]);
      toast.success('Location created');
    }
    onOpenChange(false);
  };

  const handleGeofenceChange = (update: {
    lat?: number; lng?: number; geofenceType?: GeofenceType;
    geofenceRadiusM?: number; geofencePolygon?: [number, number][] | null;
  }) => {
    if (update.lat !== undefined) setLat(update.lat);
    if (update.lng !== undefined) setLng(update.lng);
    if (update.geofenceType !== undefined) setGeofenceType(update.geofenceType);
    if (update.geofenceRadiusM !== undefined) setGeofenceRadiusM(update.geofenceRadiusM);
    if (update.geofencePolygon !== undefined) setGeofencePolygon(update.geofencePolygon);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingLocation ? 'Edit Location' : 'New Location'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Walmart DC #4523" />
          </div>
          <div>
            <Label>Address</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>City</Label><Input value={city} onChange={e => setCity(e.target.value)} /></div>
            <div><Label>State</Label><Input value={state} onChange={e => setState(e.target.value)} placeholder="CA" /></div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Gate codes, dock info, etc." />
          </div>

          <div className="space-y-1">
            <Label>Geofence</Label>
            <Suspense fallback={<div className="h-[350px] rounded-lg bg-muted animate-pulse" />}>
              <LocationGeofenceEditor
                lat={lat}
                lng={lng}
                geofenceType={geofenceType}
                geofenceRadiusM={geofenceRadiusM}
                geofencePolygon={geofencePolygon}
                address={[address, city, state].filter(Boolean).join(', ')}
                onGeofenceChange={handleGeofenceChange}
              />
            </Suspense>
          </div>

          <Button onClick={handleSave} className="w-full" disabled={!name.trim()}>
            {editingLocation ? 'Save Changes' : 'Create Location'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
