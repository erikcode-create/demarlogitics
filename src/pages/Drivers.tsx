import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Trash2 } from 'lucide-react';
import { Driver } from '@/types';
import { TableLoader } from '@/components/ui/page-loader';
import { toast } from 'sonner';

const Drivers = () => {
  const { drivers, setDrivers, carriers, deleteRecord, loading } = useAppContext();
  const [search, setSearch] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDriver, setNewDriver] = useState({ name: '', phone: '', email: '', carrierId: '' });

  if (loading) return <TableLoader />;

  const filtered = drivers.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || (d.phone || '').includes(search);
    const matchCarrier = carrierFilter === 'all' || d.carrierId === carrierFilter;
    return matchSearch && matchCarrier;
  });

  const handleAdd = () => {
    if (!newDriver.name.trim()) return;
    const driver: Driver = {
      id: crypto.randomUUID(),
      name: newDriver.name.trim(),
      phone: newDriver.phone.trim(),
      email: newDriver.email.trim(),
      carrierId: newDriver.carrierId || null,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setDrivers(prev => [...prev, driver]);
    setDialogOpen(false);
    setNewDriver({ name: '', phone: '', email: '', carrierId: '' });
    toast.success('Driver added');
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" />Add Driver</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Driver</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={newDriver.name} onChange={e => setNewDriver(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={newDriver.phone} onChange={e => setNewDriver(p => ({ ...p, phone: e.target.value }))} /></div>
              <div>
                <Label>Carrier</Label>
                <Select value={newDriver.carrierId || 'none'} onValueChange={v => setNewDriver(p => ({ ...p, carrierId: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Carrier</SelectItem>
                    {carriers.map(c => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={!newDriver.name.trim()}>Add Driver</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-sm">{d.phone || '—'}</TableCell>
                  <TableCell className="text-sm">{getCarrierName(d.carrierId)}</TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No drivers found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Drivers;
