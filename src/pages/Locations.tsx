import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, Plus, Trash2, MapPin, Circle, Hexagon } from 'lucide-react';
import { SavedLocation } from '@/types';
import { toast } from 'sonner';
import { TableLoader } from '@/components/ui/page-loader';
import { lazy, Suspense } from 'react';

const LocationFormDialog = lazy(() => import('@/components/locations/LocationFormDialog'));

const Locations = () => {
  const { locations, setLocations, deleteRecord, loading } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SavedLocation | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return locations;
    const q = search.toLowerCase();
    return locations.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.address.toLowerCase().includes(q) ||
      l.city.toLowerCase().includes(q) ||
      l.state.toLowerCase().includes(q)
    );
  }, [locations, search]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteRecord('locations', deleteTarget.id);
    setLocations(prev => prev.filter(l => l.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success('Location deleted');
  };

  if (loading) return <TableLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Locations</h1>
          <p className="text-sm text-muted-foreground">{locations.length} saved location{locations.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />New Location
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search locations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>City / State</TableHead>
                <TableHead>Geofence</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(loc => (
                <TableRow
                  key={loc.id}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => navigate(`/locations/${loc.id}`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {loc.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{loc.address || '—'}</TableCell>
                  <TableCell className="text-sm">{[loc.city, loc.state].filter(Boolean).join(', ') || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1 text-xs">
                      {loc.geofenceType === 'polygon' ? (
                        <><Hexagon className="h-3 w-3" />Polygon</>
                      ) : (
                        <><Circle className="h-3 w-3" />Circle</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{new Date(loc.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={e => { e.stopPropagation(); setDeleteTarget(loc); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {locations.length === 0 ? 'No locations yet. Create one to get started.' : 'No matching locations'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this saved location. Loads using it will keep their geofence data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {dialogOpen && (
        <Suspense fallback={null}>
          <LocationFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </Suspense>
      )}
    </div>
  );
};

export default Locations;
