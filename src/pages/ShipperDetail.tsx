import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Phone, Mail, MapPin, Calendar, User, TruckIcon, History, CheckSquare, Trash2, Send, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { salesStageLabels, equipmentTypeLabels } from '@/data/mockData';
import { callOutcomeLabels, nextStepLabels } from '@/utils/cadenceEngine';
import { Contact, Lane, FollowUp, Activity, SalesStage, EquipmentType, ActivityType } from '@/types';

const ShipperDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserName = user?.email || 'Unknown';
  const { shippers, setShippers, contacts, setContacts, lanes, setLanes, followUps, setFollowUps, activities, setActivities, outboundCalls, setOutboundCalls, stageChangeLogs, setStageChangeLogs, salesTasks, setSalesTasks, logStageChange, triggerCadence, deleteRecord } = useAppContext();

  const [contactDialog, setContactDialog] = useState(false);
  const [newContact, setNewContact] = useState({ firstName: '', lastName: '', title: '', phone: '', email: '' });
  const [laneDialog, setLaneDialog] = useState(false);
  const [newLane, setNewLane] = useState({ origin: '', destination: '', rate: '', equipmentType: 'dry_van' as EquipmentType });
  const [followUpDialog, setFollowUpDialog] = useState(false);
  const [newFollowUp, setNewFollowUp] = useState({ date: '', notes: '' });
  const [activityDialog, setActivityDialog] = useState(false);
  const [newActivity, setNewActivity] = useState({ type: 'call' as ActivityType, description: '' });
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState({ shippingManagerName: '', directPhone: '', email: '', estimatedMonthlyLoads: '', lastContactDate: '', nextFollowUp: '' });

  const shipperCalls = useMemo(() => outboundCalls.filter(c => c.shipperId === id).sort((a, b) => new Date(b.callDate).getTime() - new Date(a.callDate).getTime()), [outboundCalls, id]);
  const shipperStageHistory = useMemo(() => stageChangeLogs.filter(l => l.shipperId === id).sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()), [stageChangeLogs, id]);
  const shipperTasks = useMemo(() => salesTasks.filter(t => t.shipperId === id).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()), [salesTasks, id]);

  const shipper = shippers.find(s => s.id === id);
  if (!shipper) return <div className="p-6">Shipper not found. <Button variant="link" onClick={() => navigate('/shippers')}>Back</Button></div>;

  const shipperContacts = contacts.filter(c => c.shipperId === id);
  const shipperLanes = lanes.filter(l => l.shipperId === id);
  const shipperFollowUps = followUps.filter(f => f.shipperId === id);
  const shipperActivities = activities.filter(a => a.entityId === id && a.entityType === 'shipper')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const addContact = () => {
    setContacts(prev => [...prev, { id: crypto.randomUUID(), shipperId: id!, ...newContact, isPrimary: shipperContacts.length === 0 }]);
    setContactDialog(false);
    setNewContact({ firstName: '', lastName: '', title: '', phone: '', email: '' });
  };

  const addLane = () => {
    setLanes(prev => [...prev, { id: crypto.randomUUID(), shipperId: id!, origin: newLane.origin, destination: newLane.destination, rate: Number(newLane.rate), equipmentType: newLane.equipmentType, notes: '' }]);
    setLaneDialog(false);
    setNewLane({ origin: '', destination: '', rate: '', equipmentType: 'dry_van' });
  };

  const addFollowUp = () => {
    setFollowUps(prev => [...prev, { id: crypto.randomUUID(), shipperId: id!, date: newFollowUp.date, notes: newFollowUp.notes, completed: false }]);
    setFollowUpDialog(false);
    setNewFollowUp({ date: '', notes: '' });
  };

  const addActivity = () => {
    setActivities(prev => [...prev, { id: crypto.randomUUID(), entityId: id!, entityType: 'shipper', type: newActivity.type, description: newActivity.description, timestamp: new Date().toISOString(), user: currentUserName }]);
    setActivityDialog(false);
    setNewActivity({ type: 'call', description: '' });
  };

  const updateStage = (stage: SalesStage) => {
    logStageChange(id!, shipper.salesStage, stage, currentUserName);
    setShippers(prev => prev.map(s => s.id === id ? { ...s, salesStage: stage } : s));
  };

  const startEditing = () => {
    setEditFields({
      shippingManagerName: shipper.shippingManagerName || '',
      directPhone: shipper.directPhone || '',
      email: shipper.email || '',
      estimatedMonthlyLoads: String(shipper.estimatedMonthlyLoads || 0),
      lastContactDate: shipper.lastContactDate || '',
      nextFollowUp: shipper.nextFollowUp || '',
    });
    setEditing(true);
  };

  const saveEditing = () => {
    setShippers(prev => prev.map(s => s.id === id ? {
      ...s,
      shippingManagerName: editFields.shippingManagerName,
      directPhone: editFields.directPhone,
      email: editFields.email,
      estimatedMonthlyLoads: Number(editFields.estimatedMonthlyLoads) || 0,
      lastContactDate: editFields.lastContactDate,
      nextFollowUp: editFields.nextFollowUp,
    } : s));
    setEditing(false);
  };

  const toggleTask = (taskId: string) => {
    setSalesTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : '' } : t));
  };

  const handleDelete = () => {
    deleteRecord('shippers', id!);
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
    navigate('/shippers');
  };

  const hasCadenceTasks = shipperTasks.some(t => t.cadenceDay);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/shippers')}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{shipper.companyName}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{shipper.city}, {shipper.state}</span>
            {shipper.directPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{shipper.directPhone}</span>}
            {shipper.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{shipper.email}</span>}
          </div>
        </div>
        <Select value={shipper.salesStage} onValueChange={(v: SalesStage) => updateStage(v)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(salesStageLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          disabled={!shipper.email}
          onClick={async () => {
            const { data, error } = await supabase.functions.invoke('send-shipper-magic-link', {
              body: { shipper_id: shipper.id },
            });
            if (error) {
              toast.error('Failed to send portal link');
            } else {
              toast.success(`Portal link sent to ${data?.email || shipper.email}`);
            }
          }}
        >
          <Send className="mr-1 h-4 w-4" />Send Portal Link
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/shipper-portal/preview/${shipper.id}`)}
        >
          <Eye className="mr-1 h-4 w-4" />View as Shipper
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm"><Trash2 className="mr-1 h-4 w-4" />Delete</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {shipper.companyName}?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete this shipper and all related data (contacts, lanes, follow-ups, calls, tasks). This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Key Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Shipping Manager</CardTitle></CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{shipper.shippingManagerName || <span className="text-muted-foreground italic">Not set</span>}</p>
            {shipper.directPhone && <p className="text-sm text-muted-foreground">{shipper.directPhone}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Est. Monthly Loads</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{shipper.estimatedMonthlyLoads || <span className="text-muted-foreground italic">—</span>}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Dates</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Last Contact:</span> {shipper.lastContactDate ? new Date(shipper.lastContactDate).toLocaleDateString() : '—'}</p>
              <p><span className="text-muted-foreground">Next Follow-Up:</span> {shipper.nextFollowUp ? new Date(shipper.nextFollowUp).toLocaleDateString() : '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm">Shipper Details</CardTitle>
          <div className="flex gap-2">
            {!hasCadenceTasks && ['prospect', 'lead'].includes(shipper.salesStage) && (
              <Button size="sm" variant="outline" onClick={() => triggerCadence(id!)}>Start 14-Day Cadence</Button>
            )}
            {!editing ? (
              <Button size="sm" variant="outline" onClick={startEditing}>Edit Details</Button>
            ) : (
              <>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                <Button size="sm" onClick={saveEditing}>Save</Button>
              </>
            )}
          </div>
        </CardHeader>
        {editing && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Shipping Manager Name</Label><Input value={editFields.shippingManagerName} onChange={e => setEditFields(p => ({ ...p, shippingManagerName: e.target.value }))} /></div>
              <div><Label>Direct Phone</Label><Input value={editFields.directPhone} onChange={e => setEditFields(p => ({ ...p, directPhone: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={editFields.email} onChange={e => setEditFields(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Est. Monthly Loads</Label><Input type="number" value={editFields.estimatedMonthlyLoads} onChange={e => setEditFields(p => ({ ...p, estimatedMonthlyLoads: e.target.value }))} /></div>
              <div><Label>Last Contact Date</Label><Input type="date" value={editFields.lastContactDate} onChange={e => setEditFields(p => ({ ...p, lastContactDate: e.target.value }))} /></div>
              <div><Label>Next Follow-Up</Label><Input type="date" value={editFields.nextFollowUp} onChange={e => setEditFields(p => ({ ...p, nextFollowUp: e.target.value }))} /></div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Credit Limit</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">${shipper.creditLimit.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Payment Terms</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{shipper.paymentTerms}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Lanes</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{shipperLanes.length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="contacts">
        <TabsList className="flex-wrap">
          <TabsTrigger value="contacts">Contacts ({shipperContacts.length})</TabsTrigger>
          <TabsTrigger value="lanes">Lanes ({shipperLanes.length})</TabsTrigger>
          <TabsTrigger value="calls">Call History ({shipperCalls.length})</TabsTrigger>
          <TabsTrigger value="stages">Stage History ({shipperStageHistory.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({shipperTasks.length})</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups ({shipperFollowUps.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity ({shipperActivities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Contacts</CardTitle>
              <Dialog open={contactDialog} onOpenChange={setContactDialog}>
                <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="mr-1 h-3 w-3" />Add</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Contact</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label>First Name</Label><Input value={newContact.firstName} onChange={e => setNewContact(p => ({ ...p, firstName: e.target.value }))} /></div>
                      <div><Label>Last Name</Label><Input value={newContact.lastName} onChange={e => setNewContact(p => ({ ...p, lastName: e.target.value }))} /></div>
                    </div>
                    <div><Label>Title</Label><Input value={newContact.title} onChange={e => setNewContact(p => ({ ...p, title: e.target.value }))} /></div>
                    <div><Label>Phone</Label><Input value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} /></div>
                    <div><Label>Email</Label><Input value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} /></div>
                    <Button onClick={addContact} className="w-full" disabled={!newContact.firstName}>Add Contact</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Title</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead><TableHead>Primary</TableHead></TableRow></TableHeader>
                <TableBody>
                  {shipperContacts.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.firstName} {c.lastName}</TableCell>
                      <TableCell>{c.title}</TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>{c.isPrimary && <Badge className="bg-primary/20 text-primary">Primary</Badge>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lanes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Lanes</CardTitle>
              <Dialog open={laneDialog} onOpenChange={setLaneDialog}>
                <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="mr-1 h-3 w-3" />Add</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Lane</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Origin</Label><Input value={newLane.origin} onChange={e => setNewLane(p => ({ ...p, origin: e.target.value }))} /></div>
                    <div><Label>Destination</Label><Input value={newLane.destination} onChange={e => setNewLane(p => ({ ...p, destination: e.target.value }))} /></div>
                    <div><Label>Rate ($)</Label><Input type="number" value={newLane.rate} onChange={e => setNewLane(p => ({ ...p, rate: e.target.value }))} /></div>
                    <div>
                      <Label>Equipment</Label>
                      <Select value={newLane.equipmentType} onValueChange={(v: EquipmentType) => setNewLane(p => ({ ...p, equipmentType: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(equipmentTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Button onClick={addLane} className="w-full" disabled={!newLane.origin || !newLane.destination}>Add Lane</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Origin</TableHead><TableHead>Destination</TableHead><TableHead>Rate</TableHead><TableHead>Equipment</TableHead></TableRow></TableHeader>
                <TableBody>
                  {shipperLanes.map(l => (
                    <TableRow key={l.id}>
                      <TableCell>{l.origin}</TableCell>
                      <TableCell>{l.destination}</TableCell>
                      <TableCell className="font-medium">${l.rate.toLocaleString()}</TableCell>
                      <TableCell>{equipmentTypeLabels[l.equipmentType]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Call History Tab */}
        <TabsContent value="calls">
          <Card>
            <CardHeader><CardTitle className="text-sm">Call History</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Pain Point</TableHead>
                    <TableHead>Next Step</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipperCalls.map(call => (
                    <TableRow key={call.id}>
                      <TableCell>{call.callAttemptNumber}</TableCell>
                      <TableCell className="font-medium">{call.contactName}<br /><span className="text-xs text-muted-foreground">{call.contactTitle}</span></TableCell>
                      <TableCell><Badge variant="outline">{callOutcomeLabels[call.callOutcome] || call.callOutcome}</Badge></TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{call.painPoint || '—'}</TableCell>
                      <TableCell><Badge variant="secondary">{nextStepLabels[call.nextStep] || call.nextStep}</Badge></TableCell>
                      <TableCell className="text-sm">{new Date(call.callDate).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {shipperCalls.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-4">No calls recorded</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stage History Tab */}
        <TabsContent value="stages">
          <Card>
            <CardHeader><CardTitle className="text-sm">Stage Change History</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shipperStageHistory.map(log => (
                  <div key={log.id} className="flex items-center gap-3 text-sm">
                    <History className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium">{salesStageLabels[log.fromStage] || log.fromStage}</span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{salesStageLabels[log.toStage] || log.toStage}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{log.changedBy} · {new Date(log.changedAt).toLocaleString()}</span>
                  </div>
                ))}
                {shipperStageHistory.length === 0 && <p className="text-muted-foreground text-sm">No stage changes recorded</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader><CardTitle className="text-sm">Sales Tasks</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {shipperTasks.map(task => (
                  <div key={task.id} className={`flex items-center gap-3 p-2 rounded border ${task.completed ? 'opacity-50' : ''}`}>
                    <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${task.completed ? 'line-through' : ''}`}>{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">{task.type}</Badge>
                      {task.cadenceDay && <p className="text-xs text-muted-foreground mt-1">Day {task.cadenceDay}</p>}
                      <p className="text-xs text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {shipperTasks.length === 0 && <p className="text-muted-foreground text-sm">No tasks</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followups">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Follow-ups</CardTitle>
              <Dialog open={followUpDialog} onOpenChange={setFollowUpDialog}>
                <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="mr-1 h-3 w-3" />Add</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Follow-up</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Date</Label><Input type="date" value={newFollowUp.date} onChange={e => setNewFollowUp(p => ({ ...p, date: e.target.value }))} /></div>
                    <div><Label>Notes</Label><Input value={newFollowUp.notes} onChange={e => setNewFollowUp(p => ({ ...p, notes: e.target.value }))} /></div>
                    <Button onClick={addFollowUp} className="w-full" disabled={!newFollowUp.date}>Add Follow-up</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {shipperFollowUps.map(f => (
                  <div key={f.id} className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={f.completed}
                      onCheckedChange={() => setFollowUps(prev => prev.map(fu => fu.id === f.id ? { ...fu, completed: !fu.completed } : fu))}
                    />
                    <div className="flex-1">
                      <p className={f.completed ? 'line-through text-muted-foreground' : ''}>{f.notes}</p>
                      <p className="text-xs text-muted-foreground">{new Date(f.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {shipperFollowUps.length === 0 && <p className="text-muted-foreground text-sm">No follow-ups</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Activity Log</CardTitle>
              <Dialog open={activityDialog} onOpenChange={setActivityDialog}>
                <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="mr-1 h-3 w-3" />Log Activity</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Type</Label>
                      <Select value={newActivity.type} onValueChange={(v: ActivityType) => setNewActivity(p => ({ ...p, type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="note">Note</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Description</Label><Input value={newActivity.description} onChange={e => setNewActivity(p => ({ ...p, description: e.target.value }))} /></div>
                    <Button onClick={addActivity} className="w-full" disabled={!newActivity.description}>Log Activity</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shipperActivities.map(a => (
                  <div key={a.id} className="flex items-start gap-3 text-sm">
                    <Badge variant="outline" className="capitalize shrink-0">{a.type}</Badge>
                    <div className="flex-1">
                      <p>{a.description}</p>
                      <p className="text-xs text-muted-foreground">{a.user} · {new Date(a.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {shipperActivities.length === 0 && <p className="text-muted-foreground text-sm">No activity recorded</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShipperDetail;
