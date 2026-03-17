import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useDraft } from '@/hooks/useDraft';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Pencil, Trash2, Copy, FileEdit, X } from 'lucide-react';
import { loadStatusLabels, equipmentTypeLabels } from '@/data/mockData';
import { Load, LoadStatus, EquipmentType } from '@/types';
import { toast } from 'sonner';
import { TableLoader } from '@/components/ui/page-loader';

const statusColors: Record<string, string> = {
  available: 'bg-muted text-muted-foreground',
  booked: 'bg-blue-500/20 text-blue-400',
  in_transit: 'bg-warning/20 text-warning',
  delivered: 'bg-success/20 text-success',
  invoiced: 'bg-purple-500/20 text-purple-400',
  paid: 'bg-primary/20 text-primary',
};

const emptyForm = {
  shipperId: '', origin: '', destination: '', pickupDate: '', deliveryDate: '',
  shipperRate: '', weight: '', equipmentType: 'dry_van' as EquipmentType,
};

const Loads = () => {
  const { loads, setLoads, shippers, carriers, deleteRecord, loading } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Load | null>(null);
  const { data: formData, setData: setFormData, hasDraft, clearDraft, draftRestoredRef } = useDraft({
    key: 'load:new',
    defaultValue: emptyForm,
  });
  const [bulkCount, setBulkCount] = useState('4');

  if (loading) return <TableLoader />;

  const generateRefNumber = (): string => {
    const existing = new Set(loads.map(l => l.referenceNumber));
    let ref: string;
    do {
      ref = String(Math.floor(10000000 + Math.random() * 90000000));
    } while (existing.has(ref));
    return ref;
  };

  const filtered = loads.filter(l => {
    const shipper = shippers.find(s => s.id === l.shipperId);
    const matchSearch = l.loadNumber.toLowerCase().includes(search.toLowerCase()) ||
      (l.referenceNumber && l.referenceNumber.toLowerCase().includes(search.toLowerCase())) ||
      l.origin.toLowerCase().includes(search.toLowerCase()) ||
      l.destination.toLowerCase().includes(search.toLowerCase()) ||
      (shipper?.companyName.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => {
    setEditingLoad(null);
    // If there's a draft, it's already loaded; otherwise reset
    if (!hasDraft) setFormData(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (e: React.MouseEvent, load: Load) => {
    e.stopPropagation();
    setEditingLoad(load);
    setFormData({
      shipperId: load.shipperId,
      origin: load.origin,
      destination: load.destination,
      pickupDate: load.pickupDate,
      deliveryDate: load.deliveryDate,
      shipperRate: String(load.shipperRate),
      weight: String(load.weight),
      equipmentType: load.equipmentType,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingLoad) {
      setLoads(prev => prev.map(l => l.id === editingLoad.id ? {
        ...l,
        shipperId: formData.shipperId,
        origin: formData.origin,
        destination: formData.destination,
        pickupDate: formData.pickupDate,
        deliveryDate: formData.deliveryDate,
        shipperRate: Number(formData.shipperRate),
        weight: Number(formData.weight),
        equipmentType: formData.equipmentType,
      } : l));
    } else {
      const loadNum = `DT-2026-${String(loads.length + 1).padStart(3, '0')}`;
      const load: Load = {
        id: crypto.randomUUID(), loadNumber: loadNum, shipperId: formData.shipperId, carrierId: null,
        origin: formData.origin, destination: formData.destination,
        pickupDate: formData.pickupDate, deliveryDate: formData.deliveryDate,
        shipperRate: Number(formData.shipperRate), carrierRate: 0, weight: Number(formData.weight),
        equipmentType: formData.equipmentType, status: 'available', podUploaded: false,
        referenceNumber: generateRefNumber(), invoiceNumber: '', invoiceDate: '', invoiceAmount: 0, paymentStatus: 'pending',
        notes: '', createdAt: new Date().toISOString().split('T')[0],
      };
      setLoads(prev => [...prev, load]);
    }
    setDialogOpen(false);
    setEditingLoad(null);
    clearDraft();
    toast.success(editingLoad ? 'Load updated' : 'Load created');
  };

  const handleBulkCreate = () => {
    const count = Number(bulkCount);
    if (!formData.shipperId || !formData.origin || count < 1) return;
    const existingRefs = new Set(loads.map(l => l.referenceNumber));
    const newLoads: Load[] = [];
    for (let i = 0; i < count; i++) {
      let ref: string;
      do { ref = String(Math.floor(10000000 + Math.random() * 90000000)); } while (existingRefs.has(ref));
      existingRefs.add(ref);
      const loadNum = `DT-2026-${String(loads.length + newLoads.length + 1).padStart(3, '0')}`;
      newLoads.push({
        id: crypto.randomUUID(), loadNumber: loadNum, shipperId: formData.shipperId, carrierId: null,
        origin: formData.origin, destination: formData.destination,
        pickupDate: formData.pickupDate, deliveryDate: formData.deliveryDate,
        shipperRate: Number(formData.shipperRate), carrierRate: 0, weight: Number(formData.weight),
        equipmentType: formData.equipmentType, status: 'available', podUploaded: false,
        referenceNumber: ref, invoiceNumber: '', invoiceDate: '', invoiceAmount: 0, paymentStatus: 'pending',
        notes: '', createdAt: new Date().toISOString().split('T')[0],
      });
    }
    setLoads(prev => [...prev, ...newLoads]);
    setBulkDialogOpen(false);
    setFormData(emptyForm);
    setBulkCount('4');
    toast.success(`${count} loads created successfully`);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteRecord('loads', deleteTarget.id);
    setLoads(prev => prev.filter(l => l.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success('Load deleted');
  };

  const confirmDelete = (e: React.MouseEvent, load: Load) => {
    e.stopPropagation();
    setDeleteTarget(load);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Load Board</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setFormData(emptyForm); setBulkDialogOpen(true); }}>
            <Copy className="mr-1 h-4 w-4" />Bulk Create
          </Button>
          <Button size="sm" onClick={openCreate}><Plus className="mr-1 h-4 w-4" />New Load</Button>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingLoad(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingLoad ? 'Edit Load' : 'Create Load'}
              {!editingLoad && hasDraft && (
                <span className="inline-flex items-center gap-1">
                  <Badge variant="outline" className="text-xs gap-1 border-warning text-warning">
                    <FileEdit className="h-3 w-3" />Draft
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={clearDraft} title="Discard draft">
                    <X className="h-3 w-3" />
                  </Button>
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Shipper</Label>
              <Select value={formData.shipperId} onValueChange={v => setFormData(p => ({ ...p, shipperId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select shipper" /></SelectTrigger>
                <SelectContent>{shippers.map(s => <SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Origin</Label><Input value={formData.origin} onChange={e => setFormData(p => ({ ...p, origin: e.target.value }))} /></div>
              <div><Label>Destination</Label><Input value={formData.destination} onChange={e => setFormData(p => ({ ...p, destination: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Pickup Date</Label><Input type="date" value={formData.pickupDate} onChange={e => setFormData(p => ({ ...p, pickupDate: e.target.value }))} /></div>
              <div><Label>Delivery Date</Label><Input type="date" value={formData.deliveryDate} onChange={e => setFormData(p => ({ ...p, deliveryDate: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Shipper Rate ($)</Label><Input type="number" value={formData.shipperRate} onChange={e => setFormData(p => ({ ...p, shipperRate: e.target.value }))} /></div>
              <div><Label>Weight (lbs)</Label><Input type="number" value={formData.weight} onChange={e => setFormData(p => ({ ...p, weight: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Equipment</Label>
              <Select value={formData.equipmentType} onValueChange={(v: EquipmentType) => setFormData(p => ({ ...p, equipmentType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(equipmentTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={!formData.shipperId || !formData.origin}>
              {editingLoad ? 'Save Changes' : 'Create Load'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={(open) => { setBulkDialogOpen(open); if (!open) setFormData(emptyForm); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bulk Create Loads</DialogTitle>
            <DialogDescription>Create multiple loads with the same details. Each will get a unique load number and reference number.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Number of Loads</Label>
              <Select value={bulkCount} onValueChange={setBulkCount}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['2','3','4','5','6','7','8','9','10'].map(n => <SelectItem key={n} value={n}>{n} Loads</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Shipper</Label>
              <Select value={formData.shipperId} onValueChange={v => setFormData(p => ({ ...p, shipperId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select shipper" /></SelectTrigger>
                <SelectContent>{shippers.map(s => <SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Origin</Label><Input value={formData.origin} onChange={e => setFormData(p => ({ ...p, origin: e.target.value }))} /></div>
              <div><Label>Destination</Label><Input value={formData.destination} onChange={e => setFormData(p => ({ ...p, destination: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Pickup Date</Label><Input type="date" value={formData.pickupDate} onChange={e => setFormData(p => ({ ...p, pickupDate: e.target.value }))} /></div>
              <div><Label>Delivery Date</Label><Input type="date" value={formData.deliveryDate} onChange={e => setFormData(p => ({ ...p, deliveryDate: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Shipper Rate ($)</Label><Input type="number" value={formData.shipperRate} onChange={e => setFormData(p => ({ ...p, shipperRate: e.target.value }))} /></div>
              <div><Label>Weight (lbs)</Label><Input type="number" value={formData.weight} onChange={e => setFormData(p => ({ ...p, weight: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Equipment</Label>
              <Select value={formData.equipmentType} onValueChange={(v: EquipmentType) => setFormData(p => ({ ...p, equipmentType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(equipmentTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleBulkCreate} className="w-full" disabled={!formData.shipperId || !formData.origin}>
              Create {bulkCount} Loads
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Load</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{deleteTarget?.loadNumber}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <TableHead className="w-20"></TableHead>
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
                    <TableCell className="text-sm">{l.pickupDate ? new Date(l.pickupDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select value={l.status} onValueChange={(v: LoadStatus) => {
                        setLoads(prev => prev.map(ld => ld.id === l.id ? { ...ld, status: v as LoadStatus } : ld));
                        toast.success(`${l.loadNumber} → ${loadStatusLabels[v as LoadStatus]}`);
                      }}>
                        <SelectTrigger className="h-7 w-[120px] text-xs border-0 bg-transparent hover:bg-accent">
                          <Badge className={statusColors[l.status]}>{loadStatusLabels[l.status]}</Badge>
                        </SelectTrigger>
                        <SelectContent>{Object.entries(loadStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right font-medium">${l.shipperRate.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {margin !== null ? (
                        <span className={margin >= 0 ? 'text-success' : 'text-destructive'}>
                          ${margin.toLocaleString()} ({marginPct}%)
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => openEdit(e, l)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => confirmDelete(e, l)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No loads found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Loads;
