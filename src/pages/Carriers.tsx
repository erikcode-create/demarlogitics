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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, AlertTriangle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { packetStatusLabels, equipmentTypeLabels } from '@/data/mockData';
import { Carrier, CarrierPacketStatus, EquipmentType } from '@/types';

const getInsuranceStatus = (expiry: string) => {
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return { color: 'text-destructive', label: 'Expired', icon: AlertTriangle };
  if (days <= 30) return { color: 'text-warning', label: `${days}d left`, icon: Clock };
  return { color: 'text-success', label: 'Valid', icon: CheckCircle };
};

const Carriers = () => {
  const { carriers, setCarriers, activities, setActivities, loads, setLoads } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCarrier, setNewCarrier] = useState({ companyName: '', mcNumber: '', dotNumber: '', city: '', state: '', phone: '', email: '' });

  const filtered = carriers.filter(c => {
    const matchSearch = c.companyName.toLowerCase().includes(search.toLowerCase()) || c.mcNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.packetStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAdd = () => {
    const carrier: Carrier = {
      id: crypto.randomUUID(), ...newCarrier, address: '', zip: '',
      equipmentTypes: [], insuranceExpiry: '', insuranceProvider: '',
      packetStatus: 'not_started', factoringCompany: '', factoringRemitTo: '',
      w9Uploaded: false, insuranceCertUploaded: false, carrierPacketUploaded: false,
      notes: '', createdAt: new Date().toISOString().split('T')[0],
    };
    setCarriers(prev => [...prev, carrier]);
    setDialogOpen(false);
    setNewCarrier({ companyName: '', mcNumber: '', dotNumber: '', city: '', state: '', phone: '', email: '' });
  };

  const handleDelete = (id: string) => {
    setCarriers(prev => prev.filter(c => c.id !== id));
    setActivities(prev => prev.filter(a => !(a.entityId === id && a.entityType === 'carrier')));
    setLoads(prev => prev.map(l => l.carrierId === id ? { ...l, carrierId: null } : l));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Carriers</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" />Add Carrier</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Carrier</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Company Name</Label><Input value={newCarrier.companyName} onChange={e => setNewCarrier(p => ({ ...p, companyName: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>MC#</Label><Input value={newCarrier.mcNumber} onChange={e => setNewCarrier(p => ({ ...p, mcNumber: e.target.value }))} /></div>
                <div><Label>DOT#</Label><Input value={newCarrier.dotNumber} onChange={e => setNewCarrier(p => ({ ...p, dotNumber: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>City</Label><Input value={newCarrier.city} onChange={e => setNewCarrier(p => ({ ...p, city: e.target.value }))} /></div>
                <div><Label>State</Label><Input value={newCarrier.state} onChange={e => setNewCarrier(p => ({ ...p, state: e.target.value }))} /></div>
              </div>
              <div><Label>Phone</Label><Input value={newCarrier.phone} onChange={e => setNewCarrier(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={newCarrier.email} onChange={e => setNewCarrier(p => ({ ...p, email: e.target.value }))} /></div>
              <Button onClick={handleAdd} className="w-full" disabled={!newCarrier.companyName}>Create Carrier</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search carriers or MC#..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(packetStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>MC#</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>Packet</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => {
                const ins = c.insuranceExpiry ? getInsuranceStatus(c.insuranceExpiry) : null;
                return (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/carriers/${c.id}`)}>
                    <TableCell className="font-medium">{c.companyName}</TableCell>
                    <TableCell className="text-sm">{c.mcNumber}</TableCell>
                    <TableCell className="text-sm">{c.equipmentTypes.map(e => equipmentTypeLabels[e]).join(', ') || '—'}</TableCell>
                    <TableCell>{ins ? <span className={`flex items-center gap-1 text-sm ${ins.color}`}><ins.icon className="h-3 w-3" />{ins.label}</span> : '—'}</TableCell>
                    <TableCell><Badge variant="outline">{packetStatusLabels[c.packetStatus]}</Badge></TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={e => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={e => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {c.companyName}?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete this carrier and all related data. This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(c.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No carriers found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Carriers;
