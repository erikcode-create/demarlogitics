import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Phone, Mail, MapPin, FileCheck, FileX, AlertTriangle, CheckCircle, Clock, Upload, Trash2, Eye, Send, Download, Plus, Users } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { packetStatusLabels, equipmentTypeLabels } from '@/data/mockData';
import { CarrierPacketStatus, Driver } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface OnboardingDoc {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
}

interface RateConDoc {
  id: string;
  load_id: string;
  status: string;
  created_at: string;
  signed_at: string | null;
  signed_by_name: string;
  document_data: Record<string, unknown>;
}

const getInsuranceStatus = (expiry: string) => {
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return { color: 'text-destructive bg-destructive/10', label: 'Expired', icon: AlertTriangle, days };
  if (days <= 30) return { color: 'text-warning bg-warning/10', label: `Expiring in ${days} days`, icon: Clock, days };
  return { color: 'text-success bg-success/10', label: `Valid (${days} days)`, icon: CheckCircle, days };
};

const CarrierDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { carriers, setCarriers, drivers, setDrivers, activities, setActivities, loads, setLoads, deleteRecord } = useAppContext();
  const [sendingLink, setSendingLink] = useState(false);
  const [onboardingDocs, setOnboardingDocs] = useState<OnboardingDoc[]>([]);
  const [rateCons, setRateCons] = useState<RateConDoc[]>([]);
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [newDriver, setNewDriver] = useState({ name: '', phone: '', email: '' });

  const carrierDrivers = drivers.filter(d => d.carrierId === id);

  const handleAddDriver = () => {
    if (!newDriver.name.trim()) return;
    const driver: Driver = {
      id: crypto.randomUUID(),
      name: newDriver.name.trim(),
      phone: newDriver.phone.trim(),
      email: newDriver.email.trim(),
      carrierId: id || null,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setDrivers(prev => [...prev, driver]);
    setDriverDialogOpen(false);
    setNewDriver({ name: '', phone: '', email: '' });
  };

  const handleDeleteDriver = (driverId: string) => {
    deleteRecord('drivers', driverId);
    setDrivers(prev => prev.filter(d => d.id !== driverId));
  };

  useEffect(() => {
    if (!id) return;
    const fetchOnboardingDocs = async () => {
      const { data } = await supabase
        .from('carrier_onboarding_documents')
        .select('*')
        .eq('carrier_id', id)
        .order('uploaded_at', { ascending: false });
      setOnboardingDocs((data as OnboardingDoc[]) || []);
    };
    const fetchRateCons = async () => {
      const { data } = await supabase
        .from('carrier_documents')
        .select('*')
        .eq('carrier_id', id)
        .eq('type', 'rate_con')
        .order('created_at', { ascending: false });
      setRateCons((data as RateConDoc[]) || []);
    };
    fetchOnboardingDocs();
    fetchRateCons();
  }, [id]);

  const handleDeleteRateCon = async (docId: string) => {
    const { error } = await supabase
      .from('carrier_documents')
      .delete()
      .eq('id', docId);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      return;
    }
    setRateCons(prev => prev.filter(d => d.id !== docId));
    toast({ title: 'Rate confirmation deleted' });
  };

  const handleDownloadDoc = async (doc: OnboardingDoc) => {
    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('carrier-onboarding-docs')
        .download(doc.file_path);

      if (!downloadError && fileData) {
        const blobUrl = URL.createObjectURL(fileData);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = doc.file_name || 'onboarding-document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        return;
      }

      const { data: signedData, error: signedError } = await supabase.storage
        .from('carrier-onboarding-docs')
        .createSignedUrl(doc.file_path, 3600);

      if (signedError || !signedData?.signedUrl) {
        toast({ title: 'Download failed', description: signedError?.message || 'Could not generate download link', variant: 'destructive' });
        return;
      }

      const signedUrl = signedData.signedUrl.startsWith('http')
        ? signedData.signedUrl
        : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1${signedData.signedUrl}`;

      window.location.assign(signedUrl);
    } catch (err: any) {
      toast({ title: 'Download failed', description: err.message || 'Unexpected error while downloading document', variant: 'destructive' });
    }
  };

  const handleSendPortalLink = async () => {
    if (!id) return;
    setSendingLink(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-carrier-magic-link', {
        body: { carrier_id: id },
      });
      if (error) throw error;
      toast({ title: 'Portal link sent', description: `Magic link sent to ${data?.email || carrier?.email}` });
    } catch (err: any) {
      toast({ title: 'Failed to send link', description: err.message, variant: 'destructive' });
    }
    setSendingLink(false);
  };

  const carrier = carriers.find(c => c.id === id);

  if (!carrier) return <div className="p-6">Carrier not found. <Button variant="link" onClick={() => navigate('/carriers')}>Back</Button></div>;

  const insurance = carrier.insuranceExpiry ? getInsuranceStatus(carrier.insuranceExpiry) : null;
  const carrierActivities = activities.filter(a => a.entityId === id && a.entityType === 'carrier')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const updatePacketStatus = (status: CarrierPacketStatus) => {
    setCarriers(prev => prev.map(c => c.id === id ? { ...c, packetStatus: status } : c));
  };

  const toggleDoc = (doc: 'w9Uploaded' | 'insuranceCertUploaded' | 'carrierPacketUploaded') => {
    setCarriers(prev => prev.map(c => c.id === id ? { ...c, [doc]: !c[doc] } : c));
  };

  const handleDelete = () => {
    deleteRecord('carriers', id!);
    activities.filter(a => a.entityId === id && a.entityType === 'carrier').forEach(a => deleteRecord('activities', a.id));
    setCarriers(prev => prev.filter(c => c.id !== id));
    setActivities(prev => prev.filter(a => !(a.entityId === id && a.entityType === 'carrier')));
    setLoads(prev => prev.map(l => l.carrierId === id ? { ...l, carrierId: null } : l));
    navigate('/carriers');
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/carriers">Carriers</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{carrier.companyName}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{carrier.companyName}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{carrier.mcNumber}</span>
            <span>{carrier.dotNumber}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{carrier.city}, {carrier.state}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleSendPortalLink} disabled={sendingLink || !carrier.email}>
          <Send className="h-4 w-4 mr-1" /> {sendingLink ? 'Sending...' : 'Send Portal Link'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.open(`/portal/preview/${id}`, '_blank')}>
          <Eye className="h-4 w-4 mr-1" /> Preview Portal
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm"><Trash2 className="mr-1 h-4 w-4" />Delete</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {carrier.companyName}?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete this carrier and all related data. This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Equipment</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">{carrier.equipmentTypes.map(e => <Badge key={e} variant="outline">{equipmentTypeLabels[e]}</Badge>)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Insurance</CardTitle></CardHeader>
          <CardContent>
            {insurance ? (
              <div className={`flex items-center gap-2 px-2 py-1 rounded ${insurance.color}`}>
                <insurance.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{insurance.label}</span>
              </div>
            ) : <span className="text-muted-foreground">Not set</span>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Packet Status</CardTitle></CardHeader>
          <CardContent>
            <Select value={carrier.packetStatus} onValueChange={(v: CarrierPacketStatus) => updatePacketStatus(v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(packetStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Contact</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{carrier.phone}</p>
            <p className="flex items-center gap-1"><Mail className="h-3 w-3" />{carrier.email}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="drivers">
        <TabsList>
          <TabsTrigger value="drivers">Drivers ({carrierDrivers.length})</TabsTrigger>
          <TabsTrigger value="ratecons">Rate Cons ({rateCons.length})</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding Docs ({onboardingDocs.length})</TabsTrigger>
          <TabsTrigger value="documents">Compliance</TabsTrigger>
          <TabsTrigger value="factoring">Factoring</TabsTrigger>
          <TabsTrigger value="activity">Activity ({carrierActivities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="drivers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Drivers</CardTitle>
              <Dialog open={driverDialogOpen} onOpenChange={setDriverDialogOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" />Add Driver</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Driver to {carrier.companyName}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Name</Label><Input value={newDriver.name} onChange={e => setNewDriver(p => ({ ...p, name: e.target.value }))} /></div>
                    <div><Label>Phone</Label><Input value={newDriver.phone} onChange={e => setNewDriver(p => ({ ...p, phone: e.target.value }))} placeholder="+15551234567" /></div>
                    <div><Label>Email</Label><Input value={newDriver.email} onChange={e => setNewDriver(p => ({ ...p, email: e.target.value }))} /></div>
                    <Button onClick={handleAddDriver} className="w-full" disabled={!newDriver.name.trim()}>Add Driver</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carrierDrivers.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-sm">{d.phone || '—'}</TableCell>
                      <TableCell className="text-sm">{d.email || '—'}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {d.name}?</AlertDialogTitle>
                              <AlertDialogDescription>This will delete this driver. This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDeleteDriver(d.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {carrierDrivers.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No drivers added yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratecons">
          <Card>
            <CardHeader><CardTitle className="text-sm">Rate Confirmations</CardTitle></CardHeader>
            <CardContent>
              {rateCons.length === 0 ? (
                <p className="text-muted-foreground text-sm">No rate confirmations for this carrier.</p>
              ) : (
                <div className="space-y-3">
                  {rateCons.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <FileCheck className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Load: {doc.load_id.slice(0, 8)}...</p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(doc.created_at).toLocaleDateString()}
                          {doc.signed_at && ` · Signed ${new Date(doc.signed_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Badge variant={doc.status === 'signed' ? 'default' : 'outline'} className="capitalize">{doc.status}</Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm"><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this rate confirmation?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently remove this rate confirmation. This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDeleteRateCon(doc.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding">
          <Card>
            <CardHeader><CardTitle className="text-sm">Carrier Uploaded Documents</CardTitle></CardHeader>
            <CardContent>
              {onboardingDocs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No documents uploaded by this carrier yet.</p>
              ) : (
                <div className="space-y-3">
                  {onboardingDocs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <FileCheck className="h-5 w-5 text-success shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                        <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadDoc(doc)}>
                        <Download className="h-3 w-3 mr-1" /> Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader><CardTitle className="text-sm">Compliance Documents</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'W-9 Form', uploaded: carrier.w9Uploaded, key: 'w9Uploaded' as const },
                  { label: 'Insurance Certificate', uploaded: carrier.insuranceCertUploaded, key: 'insuranceCertUploaded' as const },
                  { label: 'Carrier Packet', uploaded: carrier.carrierPacketUploaded, key: 'carrierPacketUploaded' as const },
                ].map(doc => (
                  <div key={doc.key} className="border border-border rounded-lg p-4 flex flex-col items-center gap-3">
                    {doc.uploaded ? <FileCheck className="h-8 w-8 text-success" /> : <FileX className="h-8 w-8 text-muted-foreground" />}
                    <p className="text-sm font-medium">{doc.label}</p>
                    <Badge variant={doc.uploaded ? 'default' : 'outline'}>{doc.uploaded ? 'Uploaded' : 'Missing'}</Badge>
                    <Button size="sm" variant="outline" onClick={() => toggleDoc(doc.key)}>
                      <Upload className="mr-1 h-3 w-3" />{doc.uploaded ? 'Replace' : 'Upload'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factoring">
          <Card>
            <CardHeader><CardTitle className="text-sm">Factoring Information</CardTitle></CardHeader>
            <CardContent>
              {carrier.factoringCompany ? (
                <div className="space-y-2">
                  <div><span className="text-sm text-muted-foreground">Factoring Company:</span><p className="font-medium">{carrier.factoringCompany}</p></div>
                  <div><span className="text-sm text-muted-foreground">Remit To:</span><p className="font-medium">{carrier.factoringRemitTo}</p></div>
                </div>
              ) : <p className="text-muted-foreground">No factoring company on file. Payments go directly to carrier.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader><CardTitle className="text-sm">Activity Log</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {carrierActivities.map(a => (
                  <div key={a.id} className="flex items-start gap-3 text-sm">
                    <Badge variant="outline" className="capitalize shrink-0">{a.type}</Badge>
                    <div className="flex-1">
                      <p>{a.description}</p>
                      <p className="text-xs text-muted-foreground">{a.user} · {new Date(a.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {carrierActivities.length === 0 && <p className="text-muted-foreground text-sm">No activity recorded</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CarrierDetail;
