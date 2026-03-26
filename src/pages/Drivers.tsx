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
import { Search, Plus, Trash2, Pencil, Smartphone, Apple, Wifi, WifiOff, Users } from 'lucide-react';
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
  const [deviceMap, setDeviceMap] = useState<Record<string, { platform: string; updatedAt: string; isActive: boolean; lastValidated: string | null }>>({});
  const [unlinkedDevices, setUnlinkedDevices] = useState<{ phone: string; platform: string; updatedAt: string; isActive: boolean }[]>([]);

  useEffect(() => {
    supabase
      .from('driver_push_tokens')
      .select('driver_phone, platform, updated_at, is_active, last_validated')
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, { platform: string; updatedAt: string; isActive: boolean; lastValidated: string | null }> = {};
        const normalize = (p: string) => (p || '').replace(/\D/g, '');
        const knownPhones = new Set(drivers.map(d => normalize(d.phone)).filter(Boolean));
        const unlinked: { phone: string; platform: string; updatedAt: string; isActive: boolean }[] = [];
        for (const row of data) {
          const digits = normalize(row.driver_phone);
          map[digits] = { platform: row.platform, updatedAt: row.updated_at, isActive: row.is_active !== false, lastValidated: row.last_validated };
          if (!knownPhones.has(digits)) {
            unlinked.push({ phone: row.driver_phone, platform: row.platform, updatedAt: row.updated_at, isActive: row.is_active !== false });
          }
        }
        setDeviceMap(map);
        setUnlinkedDevices(unlinked);
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

  const activeCount = Object.values(deviceMap).filter(d => d.isActive).length;
  const totalDrivers = drivers.length;

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drivers</h1>
        <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Driver</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{totalDrivers}</p>
              <p className="text-xs text-muted-foreground">Total Drivers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Wifi className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-green-500">{activeCount}</p>
              <p className="text-xs text-muted-foreground">App Installed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <WifiOff className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{totalDrivers - activeCount + unlinkedDevices.length > 0 ? unlinkedDevices.length : 0}</p>
              <p className="text-xs text-muted-foreground">Unlinked Devices</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {unlinkedDevices.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-amber-500 mb-2">Unlinked Devices — app installed but not matched to a driver</p>
            <div className="space-y-1">
              {unlinkedDevices.map(d => (
                <div key={d.phone} className="flex items-center gap-3 text-sm">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${d.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {d.platform === 'ios' ? <><Apple className="h-3 w-3" /> iPhone</> : <><Smartphone className="h-3 w-3" /> Android</>}
                  </span>
                  <span className="font-mono">{d.phone}</span>
                  <span className="text-muted-foreground">{d.isActive ? `Active ${timeAgo(d.updatedAt)}` : `Inactive — last seen ${timeAgo(d.updatedAt)}`}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                    {d.phone && deviceMap[(d.phone || '').replace(/\D/g, '')] ? (() => {
                      const dev = deviceMap[(d.phone || '').replace(/\D/g, '')];
                      const colorClass = dev.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500';
                      return (
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${colorClass} w-fit`}>
                            {dev.platform === 'ios' ? (
                              <><Apple className="h-3 w-3" /> iPhone</>
                            ) : (
                              <><Smartphone className="h-3 w-3" /> Android</>
                            )}
                          </span>
                          <span className="text-[10px] text-muted-foreground pl-2">
                            {dev.isActive ? `Active ${timeAgo(dev.updatedAt)}` : `Inactive — last seen ${timeAgo(dev.updatedAt)}`}
                          </span>
                        </div>
                      );
                    })() : (
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
