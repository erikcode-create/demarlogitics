import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Trash2, Pencil, Smartphone, Apple } from 'lucide-react';
import { Driver } from '@/types';
import { TableLoader } from '@/components/ui/page-loader';
import { toast } from 'sonner';

const Drivers = () => {
  const { drivers, setDrivers, carriers, deleteRecord, loading } = useAppContext();
  const [search, setSearch] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', carrierId: '' });
  const [deviceMap, setDeviceMap] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase
      .from('driver_push_tokens')
      .select('driver_phone, platform')
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string> = {};
        for (const row of data) {
          map[row.driver_phone] = row.platform;
        }
        setDeviceMap(map);
      });
  }, [drivers]);

  if (loading) return <TableLoader />;

  const filtered = drivers.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || (d.phone || '').includes(search);
    const matchCarrier = carrierFilter === 'all' || d.carrierId === carrierFilter;
    return matchSearch && matchCarrier;
  });

  const openAdd = () => {
    setEditDriver(null);
    setForm({ name: '', phone: '', carrierId: '' });
    setDialogOpen(true);
  };

  const openEdit = (d: Driver) => {
    setEditDriver(d);
    setForm({ name: d.name, phone: d.phone || '', carrierId: d.carrierId || '' });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.carrierId) return;

    if (editDriver) {
      setDrivers(prev => prev.map(d => d.id === editDriver.id ? {
        ...d,
        name: form.name.trim(),
        phone: form.phone.trim(),
        carrierId: form.carrierId,
      } : d));
      toast.success('Driver updated');
    } else {
      const driver: Driver = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: '',
        carrierId: form.carrierId,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setDrivers(prev => [...prev, driver]);
      toast.success('Driver added');
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const name = drivers.find(d => d.id === id)?.name;
    deleteRecord('drivers', id);
    setDrivers(prev => prev.filter(d => d.id !== id));
    toast.success(`${name || 'Driver'} deleted`);
  };

  const getCarrierName = (carrierId: string | null) =>
    carrierId ? carriers.find(c => c.id === carrierId)?.companyName || '—' : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drivers</h1>
        <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Driver</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editDriver ? 'Edit Driver' : 'New Driver'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div>
              <Label>Carrier *</Label>
              <Select value={form.carrierId || undefined} onValueChange={v => setForm(p => ({ ...p, carrierId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                <SelectContent>
                  {carriers.map(c => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={!form.name.trim() || !form.carrierId}>
              {editDriver ? 'Save Changes' : 'Add Driver'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={carrierFilter} onValueChange={setCarrierFilter}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All Carriers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Carriers</SelectItem>
            {carriers.map(c => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Device</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-sm">{d.phone || '—'}</TableCell>
                  <TableCell className="text-sm">{getCarrierName(d.carrierId)}</TableCell>
                  <TableCell className="text-sm">
                    {d.phone && deviceMap[d.phone] ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                        {deviceMap[d.phone] === 'ios' ? (
                          <><Apple className="h-3 w-3" /> iPhone</>
                        ) : (
                          <><Smartphone className="h-3 w-3" /> Android</>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No app</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(d)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={e => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {d.name}?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete this driver. This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(d.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No drivers found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Drivers;
