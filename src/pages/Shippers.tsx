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
import { Search, Plus, Trash2 } from 'lucide-react';
import { salesStageLabels } from '@/data/mockData';
import { Shipper, SalesStage } from '@/types';
import { TableLoader } from '@/components/ui/page-loader';
import { toast } from 'sonner';

const stageColors: Record<string, string> = {
  lead: 'bg-muted text-muted-foreground',
  prospect: 'bg-blue-500/20 text-blue-400',
  contacted: 'bg-cyan-500/20 text-cyan-400',
  engaged: 'bg-primary/20 text-primary',
  lane_discussed: 'bg-warning/20 text-warning',
  quoting: 'bg-orange-500/20 text-orange-400',
  contract_sent: 'bg-purple-500/20 text-purple-400',
  quoted: 'bg-warning/20 text-warning',
  active: 'bg-success/20 text-success',
  dormant: 'bg-muted text-muted-foreground',
  closed_lost: 'bg-destructive/20 text-destructive',
  inactive: 'bg-destructive/20 text-destructive',
};

const Shippers = () => {
  const { shippers, setShippers, contacts, setContacts, lanes, setLanes, followUps, setFollowUps, activities, setActivities, outboundCalls, setOutboundCalls, salesTasks, setSalesTasks, stageChangeLogs, setStageChangeLogs, deleteRecord, loading } = useAppContext();

  if (loading) return <TableLoader />;
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newShipper, setNewShipper] = useState({
    companyName: '', city: '', state: '', phone: '', email: '',
    salesStage: 'lead' as SalesStage,
    shippingManagerName: '', directPhone: '', estimatedMonthlyLoads: '',
  });

  const filtered = shippers.filter(s => {
    const matchSearch = s.companyName.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase()) ||
      (s.shippingManagerName || '').toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'all' || s.salesStage === stageFilter;
    return matchSearch && matchStage;
  });

  const handleAdd = () => {
    const shipper: Shipper = {
      id: crypto.randomUUID(),
      companyName: newShipper.companyName,
      city: newShipper.city,
      state: newShipper.state,
      phone: newShipper.phone,
      email: newShipper.email,
      salesStage: newShipper.salesStage,
      address: '',
      zip: '',
      creditLimit: 0,
      paymentTerms: 'Net 30',
      notes: '',
      createdAt: new Date().toISOString().split('T')[0],
      shippingManagerName: newShipper.shippingManagerName,
      directPhone: newShipper.directPhone,
      estimatedMonthlyLoads: Number(newShipper.estimatedMonthlyLoads) || 0,
      lastContactDate: '',
      nextFollowUp: '',
    };
    setShippers(prev => [...prev, shipper]);
    setDialogOpen(false);
    setNewShipper({ companyName: '', city: '', state: '', phone: '', email: '', salesStage: 'lead', shippingManagerName: '', directPhone: '', estimatedMonthlyLoads: '' });
  };

  const handleDelete = (id: string) => {
    deleteRecord('shippers', id);
    // Also delete related records from DB
    contacts.filter(c => c.shipperId === id).forEach(c => deleteRecord('contacts', c.id));
    lanes.filter(l => l.shipperId === id).forEach(l => deleteRecord('lanes', l.id));
    followUps.filter(f => f.shipperId === id).forEach(f => deleteRecord('follow_ups', f.id));
    activities.filter(a => a.entityId === id && a.entityType === 'shipper').forEach(a => deleteRecord('activities', a.id));
    outboundCalls.filter(c => c.shipperId === id).forEach(c => deleteRecord('outbound_calls', c.id));
    salesTasks.filter(t => t.shipperId === id).forEach(t => deleteRecord('sales_tasks', t.id));
    stageChangeLogs.filter(l => l.shipperId === id).forEach(l => deleteRecord('stage_change_logs', l.id));
    setShippers(prev => prev.filter(s => s.id !== id));
    setContacts(prev => prev.filter(c => c.shipperId !== id));
    setLanes(prev => prev.filter(l => l.shipperId !== id));
    setFollowUps(prev => prev.filter(f => f.shipperId !== id));
    setActivities(prev => prev.filter(a => !(a.entityId === id && a.entityType === 'shipper')));
    setOutboundCalls(prev => prev.filter(c => c.shipperId !== id));
    setSalesTasks(prev => prev.filter(t => t.shipperId !== id));
    setStageChangeLogs(prev => prev.filter(l => l.shipperId !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shippers</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" />Add Shipper</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Shipper</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Company Name</Label><Input value={newShipper.companyName} onChange={e => setNewShipper(p => ({ ...p, companyName: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>City</Label><Input value={newShipper.city} onChange={e => setNewShipper(p => ({ ...p, city: e.target.value }))} /></div>
                <div><Label>State</Label><Input value={newShipper.state} onChange={e => setNewShipper(p => ({ ...p, state: e.target.value }))} /></div>
              </div>
              <div><Label>Shipping Manager Name</Label><Input value={newShipper.shippingManagerName} onChange={e => setNewShipper(p => ({ ...p, shippingManagerName: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Direct Phone</Label><Input value={newShipper.directPhone} onChange={e => setNewShipper(p => ({ ...p, directPhone: e.target.value }))} /></div>
                <div><Label>Email</Label><Input value={newShipper.email} onChange={e => setNewShipper(p => ({ ...p, email: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Est. Monthly Loads</Label><Input type="number" value={newShipper.estimatedMonthlyLoads} onChange={e => setNewShipper(p => ({ ...p, estimatedMonthlyLoads: e.target.value }))} /></div>
                <div>
                  <Label>Sales Stage</Label>
                  <Select value={newShipper.salesStage} onValueChange={(v: SalesStage) => setNewShipper(p => ({ ...p, salesStage: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(salesStageLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={!newShipper.companyName}>Create Shipper</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search shippers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {Object.entries(salesStageLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Shipping Manager</TableHead>
                  <TableHead>Direct Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Est. Monthly Loads</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Last Contact</TableHead>
                  <TableHead>Next Follow-Up</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/shippers/${s.id}`)}>
                    <TableCell className="font-medium">{s.companyName}</TableCell>
                    <TableCell>{s.city}, {s.state}</TableCell>
                    <TableCell>{s.shippingManagerName || <span className="text-muted-foreground italic">—</span>}</TableCell>
                    <TableCell>{s.directPhone || <span className="text-muted-foreground italic">—</span>}</TableCell>
                    <TableCell className="text-sm">{s.email || <span className="text-muted-foreground italic">—</span>}</TableCell>
                    <TableCell className="text-center">{s.estimatedMonthlyLoads || <span className="text-muted-foreground italic">—</span>}</TableCell>
                    <TableCell><Badge className={stageColors[s.salesStage]}>{salesStageLabels[s.salesStage]}</Badge></TableCell>
                    <TableCell className="text-sm">{s.lastContactDate ? new Date(s.lastContactDate).toLocaleDateString() : <span className="text-muted-foreground italic">—</span>}</TableCell>
                    <TableCell className="text-sm">{s.nextFollowUp ? new Date(s.nextFollowUp).toLocaleDateString() : <span className="text-muted-foreground italic">—</span>}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={e => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={e => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {s.companyName}?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete this shipper and all related data (contacts, lanes, follow-ups, calls, tasks). This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(s.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No shippers found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Shippers;
