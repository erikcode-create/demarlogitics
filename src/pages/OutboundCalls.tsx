import { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Phone, Search } from 'lucide-react';
import { OutboundCall, CallOutcome, TaskNextStep } from '@/types';
import { callOutcomeLabels, nextStepLabels } from '@/utils/cadenceEngine';
import { salesStageLabels } from '@/data/mockData';

const outcomeColors: Record<string, string> = {
  no_answer: 'bg-muted text-muted-foreground',
  left_voicemail: 'bg-blue-500/20 text-blue-400',
  gatekeeper: 'bg-warning/20 text-warning',
  spoke_not_interested: 'bg-destructive/20 text-destructive',
  spoke_send_info: 'bg-primary/20 text-primary',
  spoke_quote_requested: 'bg-success/20 text-success',
};

const OutboundCalls = () => {
  const { shippers, setShippers, outboundCalls, setOutboundCalls, salesTasks, setSalesTasks, logStageChange } = useAppContext();
  const { user } = useAuth();
  const currentUserName = user?.email || 'Unknown';
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');

  const [form, setForm] = useState({
    shipperId: '',
    contactName: '',
    contactTitle: '',
    directPhone: '',
    email: '',
    callOutcome: 'no_answer' as CallOutcome,
    painPoint: '',
    notes: '',
    nextStep: 'follow_up_call' as TaskNextStep,
    nextFollowUpDate: '',
    assignedSalesRep: '',
  });

  const selectedShipper = shippers.find(s => s.id === form.shipperId);

  const handleShipperChange = (shipperId: string) => {
    const shipper = shippers.find(s => s.id === shipperId);
    setForm(prev => ({
      ...prev,
      shipperId,
      contactName: shipper?.shippingManagerName || '',
      directPhone: shipper?.directPhone || '',
      email: shipper?.email || '',
      callOutcome: 'no_answer',
      assignedSalesRep: currentUserName,
    }));
  };

  const handleLogCall = () => {
    if (!form.shipperId) return;
    const prevCalls = outboundCalls.filter(c => c.shipperId === form.shipperId).length;
    const call: OutboundCall = {
      id: crypto.randomUUID(),
      shipperId: form.shipperId,
      contactName: form.contactName,
      contactTitle: form.contactTitle,
      directPhone: form.directPhone,
      email: form.email,
      callAttemptNumber: prevCalls + 1,
      callDate: new Date().toISOString(),
      callOutcome: form.callOutcome,
      painPoint: form.painPoint,
      notes: form.notes,
      nextStep: form.nextStep,
      nextFollowUpDate: form.nextFollowUpDate,
      assignedSalesRep: form.assignedSalesRep || currentUserName,
      createdAt: new Date().toISOString(),
    };
    setOutboundCalls(prev => [call, ...prev]);

    // Update shipper last contact date
    setShippers(prev => prev.map(s => s.id === form.shipperId ? { ...s, lastContactDate: new Date().toISOString().split('T')[0], nextFollowUp: form.nextFollowUpDate } : s));

    // Rule 1: If quote requested, move to quoting
    if (form.callOutcome === 'spoke_quote_requested') {
      const shipper = shippers.find(s => s.id === form.shipperId);
      if (shipper && shipper.salesStage !== 'quoting') {
        logStageChange(form.shipperId, shipper.salesStage, 'quoting', currentUserName);
        setShippers(prev => prev.map(s => s.id === form.shipperId ? { ...s, salesStage: 'quoting' } : s));
        setSalesTasks(prev => [...prev, {
          id: crypto.randomUUID(),
          shipperId: form.shipperId,
          type: 'call',
          title: '24-Hour Quote Follow-Up',
          description: `Follow up on quote request from ${shipper.companyName}`,
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          completed: false,
          completedAt: '',
          createdAt: new Date().toISOString(),
        }]);
      }
    }

    // Auto-advance from lead/prospect to contacted
    if (['lead', 'prospect'].includes(shippers.find(s => s.id === form.shipperId)?.salesStage || '') && form.callOutcome !== 'spoke_quote_requested') {
      const shipper = shippers.find(s => s.id === form.shipperId)!;
      const newStage = form.callOutcome.startsWith('spoke') ? 'engaged' : 'contacted';
      logStageChange(form.shipperId, shipper.salesStage, newStage, currentUserName);
      setShippers(prev => prev.map(s => s.id === form.shipperId ? { ...s, salesStage: newStage } : s));
    }

    setForm({ shipperId: '', contactName: '', contactTitle: '', directPhone: '', email: '', callOutcome: 'no_answer', painPoint: '', notes: '', nextStep: 'follow_up_call', nextFollowUpDate: '', assignedSalesRep: currentUserName });
  };

  const filtered = useMemo(() => {
    return outboundCalls.filter(c => {
      const shipper = shippers.find(s => s.id === c.shipperId);
      const matchSearch = !search || (shipper?.companyName || '').toLowerCase().includes(search.toLowerCase()) || c.contactName.toLowerCase().includes(search.toLowerCase());
      const matchOutcome = outcomeFilter === 'all' || c.callOutcome === outcomeFilter;
      return matchSearch && matchOutcome;
    });
  }, [outboundCalls, shippers, search, outcomeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Phone className="h-6 w-6 text-primary" />Outbound Calls</h1>
      </div>

      {/* Quick Log Form */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Log Call</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <Label>Company</Label>
              <Select value={form.shipperId} onValueChange={handleShipperChange}>
                <SelectTrigger><SelectValue placeholder="Select shipper" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {shippers.map(s => <SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Contact Name</Label><Input value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} /></div>
            <div><Label>Title</Label><Input value={form.contactTitle} onChange={e => setForm(p => ({ ...p, contactTitle: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={form.directPhone} onChange={e => setForm(p => ({ ...p, directPhone: e.target.value }))} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div>
              <Label>Call Outcome</Label>
              <Select value={form.callOutcome} onValueChange={(v: CallOutcome) => setForm(p => ({ ...p, callOutcome: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(callOutcomeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Next Step</Label>
              <Select value={form.nextStep} onValueChange={(v: TaskNextStep) => setForm(p => ({ ...p, nextStep: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(nextStepLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Next Follow-Up</Label><Input type="date" value={form.nextFollowUpDate} onChange={e => setForm(p => ({ ...p, nextFollowUpDate: e.target.value }))} /></div>
            <div className="md:col-span-2"><Label>Pain Point</Label><Input value={form.painPoint} onChange={e => setForm(p => ({ ...p, painPoint: e.target.value }))} placeholder="What's their freight challenge?" /></div>
            <div className="md:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="h-10" /></div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleLogCall} disabled={!form.shipperId}><Phone className="mr-1 h-4 w-4" />Log Call</Button>
            {selectedShipper && <span className="text-sm text-muted-foreground">{selectedShipper.city}, {selectedShipper.state} · Stage: {salesStageLabels[selectedShipper.salesStage]}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Filters + Table */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search calls..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Outcomes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Outcomes</SelectItem>
            {Object.entries(callOutcomeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
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
                  <TableHead>Contact</TableHead>
                  <TableHead>Attempt #</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Pain Point</TableHead>
                  <TableHead>Next Step</TableHead>
                  <TableHead>Rep</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => {
                  const shipper = shippers.find(s => s.id === c.shipperId);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{shipper?.companyName || '—'}</TableCell>
                      <TableCell>{c.contactName}</TableCell>
                      <TableCell className="text-center">{c.callAttemptNumber}</TableCell>
                      <TableCell><Badge className={outcomeColors[c.callOutcome]}>{callOutcomeLabels[c.callOutcome]}</Badge></TableCell>
                      <TableCell className="max-w-[200px] truncate">{c.painPoint || '—'}</TableCell>
                      <TableCell>{nextStepLabels[c.nextStep]}</TableCell>
                      <TableCell>{c.assignedSalesRep}</TableCell>
                      <TableCell className="text-sm">{new Date(c.callDate).toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No calls logged yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OutboundCalls;
