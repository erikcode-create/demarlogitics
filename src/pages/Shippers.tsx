import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Building2 } from 'lucide-react';
import { salesStageLabels } from '@/data/mockData';
import { Shipper, SalesStage } from '@/types';

const stageColors: Record<string, string> = {
  lead: 'bg-muted text-muted-foreground',
  prospect: 'bg-blue-500/20 text-blue-400',
  quoted: 'bg-warning/20 text-warning',
  active: 'bg-success/20 text-success',
  inactive: 'bg-destructive/20 text-destructive',
};

const Shippers = () => {
  const { shippers, setShippers } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newShipper, setNewShipper] = useState({ companyName: '', city: '', state: '', phone: '', email: '', salesStage: 'lead' as SalesStage });

  const filtered = shippers.filter(s => {
    const matchSearch = s.companyName.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'all' || s.salesStage === stageFilter;
    return matchSearch && matchStage;
  });

  const handleAdd = () => {
    const shipper: Shipper = {
      id: `s${Date.now()}`,
      ...newShipper,
      address: '',
      zip: '',
      creditLimit: 0,
      paymentTerms: 'Net 30',
      notes: '',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setShippers(prev => [...prev, shipper]);
    setDialogOpen(false);
    setNewShipper({ companyName: '', city: '', state: '', phone: '', email: '', salesStage: 'lead' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shippers</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" />Add Shipper</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Shipper</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Company Name</Label><Input value={newShipper.companyName} onChange={e => setNewShipper(p => ({ ...p, companyName: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>City</Label><Input value={newShipper.city} onChange={e => setNewShipper(p => ({ ...p, city: e.target.value }))} /></div>
                <div><Label>State</Label><Input value={newShipper.state} onChange={e => setNewShipper(p => ({ ...p, state: e.target.value }))} /></div>
              </div>
              <div><Label>Phone</Label><Input value={newShipper.phone} onChange={e => setNewShipper(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={newShipper.email} onChange={e => setNewShipper(p => ({ ...p, email: e.target.value }))} /></div>
              <div>
                <Label>Sales Stage</Label>
                <Select value={newShipper.salesStage} onValueChange={(v: SalesStage) => setNewShipper(p => ({ ...p, salesStage: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(salesStageLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Credit Limit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/shippers/${s.id}`)}>
                  <TableCell className="font-medium">{s.companyName}</TableCell>
                  <TableCell>{s.city}, {s.state}</TableCell>
                  <TableCell><Badge className={stageColors[s.salesStage]}>{salesStageLabels[s.salesStage]}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                  <TableCell>${s.creditLimit.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No shippers found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Shippers;
