import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Phone, Mail, MapPin, FileCheck, FileX, AlertTriangle, CheckCircle, Clock, Upload, Trash2, Eye } from 'lucide-react';
import { packetStatusLabels, equipmentTypeLabels } from '@/data/mockData';
import { CarrierPacketStatus } from '@/types';

const getInsuranceStatus = (expiry: string) => {
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return { color: 'text-destructive bg-destructive/10', label: 'Expired', icon: AlertTriangle, days };
  if (days <= 30) return { color: 'text-warning bg-warning/10', label: `Expiring in ${days} days`, icon: Clock, days };
  return { color: 'text-success bg-success/10', label: `Valid (${days} days)`, icon: CheckCircle, days };
};

const CarrierDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { carriers, setCarriers, activities, setActivities, loads, setLoads } = useAppContext();

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
    setCarriers(prev => prev.filter(c => c.id !== id));
    setActivities(prev => prev.filter(a => !(a.entityId === id && a.entityType === 'carrier')));
    setLoads(prev => prev.map(l => l.carrierId === id ? { ...l, carrierId: null } : l));
    navigate('/carriers');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/carriers')}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{carrier.companyName}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{carrier.mcNumber}</span>
            <span>{carrier.dotNumber}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{carrier.city}, {carrier.state}</span>
          </div>
        </div>
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

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="factoring">Factoring</TabsTrigger>
          <TabsTrigger value="activity">Activity ({carrierActivities.length})</TabsTrigger>
        </TabsList>

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
