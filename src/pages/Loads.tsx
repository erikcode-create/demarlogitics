import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus } from 'lucide-react';
import { loadStatusLabels, equipmentTypeLabels, paymentStatusLabels } from '@/data/mockData';
import { Load, LoadStatus, EquipmentType } from '@/types';

const statusColors: Record<string, string> = {
  available: 'bg-muted text-muted-foreground',
  booked: 'bg-blue-500/20 text-blue-400',
  in_transit: 'bg-warning/20 text-warning',
  delivered: 'bg-success/20 text-success',
  invoiced: 'bg-purple-500/20 text-purple-400',
  paid: 'bg-primary/20 text-primary',
};

const Loads = () => {
  const { loads, setLoads, shippers, carriers } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLoad, setNewLoad] = useState({
    shipperId: '', origin: '', destination: '', pickupDate: '', deliveryDate: '',
    shipperRate: '', weight: '', equipmentType: 'dry_van' as EquipmentType, referenceNumber: '',
  });

  const filtered = loads.filter(l => {
    const shipper = shippers.find(s => s.id === l.shipperId);
    const matchSearch = l.loadNumber.toLowerCase().includes(search.toLowerCase()) ||
      l.origin.toLowerCase().includes(search.toLowerCase()) ||
      l.destination.toLowerCase().includes(search.toLowerCase()) ||
      (shipper?.companyName.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAdd = () => {
    const loadNum = `DT-2026-${String(loads.length + 1).padStart(3, '0')}`;
    const load: Load = {
      id: crypto.randomUUID(), loadNumber: loadNum, shipperId: newLoad.shipperId, carrierId: null,
      origin: newLoad.origin, destination: newLoad.destination,
      pickupDate: newLoad.pickupDate, deliveryDate: newLoad.deliveryDate,
      shipperRate: Number(newLoad.shipperRate), carrierRate: 0, weight: Number(newLoad.weight),
      equipmentType: newLoad.equipmentType, status: 'available', podUploaded: false,
      referenceNumber: newLoad.referenceNumber, invoiceNumber: '', invoiceDate: '', invoiceAmount: 0, paymentStatus: 'pending',
      notes: '', createdAt: new Date().toISOString().split('T')[0],
    };
    setLoads(prev => [...prev, load]);
    setDialogOpen(false);
    setNewLoad({ shipperId: '', origin: '', destination: '', pickupDate: '', deliveryDate: '', shipperRate: '', weight: '', equipmentType: 'dry_van', referenceNumber: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Load Board</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" />New Load</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Load</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Shipper</Label>
                <Select value={newLoad.shipperId} onValueChange={v => setNewLoad(p => ({ ...p, shipperId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select shipper" /></SelectTrigger>
                  <SelectContent>{shippers.map(s => <SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Origin</Label><Input value={newLoad.origin} onChange={e => setNewLoad(p => ({ ...p, origin: e.target.value }))} /></div>
                <div><Label>Destination</Label><Input value={newLoad.destination} onChange={e => setNewLoad(p => ({ ...p, destination: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Pickup Date</Label><Input type="date" value={newLoad.pickupDate} onChange={e => setNewLoad(p => ({ ...p, pickupDate: e.target.value }))} /></div>
                <div><Label>Delivery Date</Label><Input type="date" value={newLoad.deliveryDate} onChange={e => setNewLoad(p => ({ ...p, deliveryDate: e.target.value }))} /></div>
              </div>
              <div><Label>Reference # (PO/BOL)</Label><Input value={newLoad.referenceNumber} onChange={e => setNewLoad(p => ({ ...p, referenceNumber: e.target.value }))} placeholder="e.g. PO-12345" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Shipper Rate ($)</Label><Input type="number" value={newLoad.shipperRate} onChange={e => setNewLoad(p => ({ ...p, shipperRate: e.target.value }))} /></div>
                <div><Label>Weight (lbs)</Label><Input type="number" value={newLoad.weight} onChange={e => setNewLoad(p => ({ ...p, weight: e.target.value }))} /></div>
              </div>
              <div>
                <Label>Equipment</Label>
                <Select value={newLoad.equipmentType} onValueChange={(v: EquipmentType) => setNewLoad(p => ({ ...p, equipmentType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(equipmentTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={!newLoad.shipperId || !newLoad.origin}>Create Load</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search loads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(loadStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Load #</TableHead>
                <TableHead>Ref #</TableHead>
                <TableHead>Shipper</TableHead>
                <TableHead>Origin → Dest</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(l => {
                const shipper = shippers.find(s => s.id === l.shipperId);
                const margin = l.carrierRate > 0 ? l.shipperRate - l.carrierRate : null;
                const marginPct = margin !== null && l.shipperRate > 0 ? ((margin / l.shipperRate) * 100).toFixed(1) : null;
                return (
                  <TableRow key={l.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/loads/${l.id}`)}>
                    <TableCell className="font-medium">{l.loadNumber}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.referenceNumber || '—'}</TableCell>
                    <TableCell className="text-sm">{shipper?.companyName || '—'}</TableCell>
                    <TableCell className="text-sm">{l.origin} → {l.destination}</TableCell>
                    <TableCell className="text-sm">{new Date(l.pickupDate).toLocaleDateString()}</TableCell>
                    <TableCell><Badge className={statusColors[l.status]}>{loadStatusLabels[l.status]}</Badge></TableCell>
                    <TableCell className="text-right font-medium">${l.shipperRate.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {margin !== null ? (
                        <span className={margin >= 0 ? 'text-success' : 'text-destructive'}>
                          ${margin.toLocaleString()} ({marginPct}%)
                        </span>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No loads found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Loads;
