import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { MapPin, Calendar, Truck, Upload, FileCheck, DollarSign, FileText, RefreshCw, Trash2, Send, CheckCircle, TruckIcon, Package, Eye, Download, Receipt, Smartphone } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { loadStatusLabels, equipmentTypeLabels, paymentStatusLabels } from '@/data/mockData';
import { LoadStatus } from '@/types';
import RateConBuilder from '@/components/documents/RateConBuilder';
import BolBuilder from '@/components/documents/BolBuilder';
import DocumentViewer from '@/components/documents/DocumentViewer';
import InvoiceBuilder from '@/components/invoices/InvoiceBuilder';
import DispatchButton from '@/components/documents/DispatchButton';
import { supabase } from '@/integrations/supabase/client';
import { geocodeBoth } from '@/utils/geocoding';

const GeofenceMap = lazy(() => import('@/components/loads/GeofenceMap'));

const statusColors: Record<string, string> = {
  available: 'bg-muted text-muted-foreground',
  booked: 'bg-blue-500/20 text-blue-400',
  dispatched: 'bg-cyan-500/20 text-cyan-400',
  rate_con_signed: 'bg-teal-500/20 text-teal-400',
  at_pickup: 'bg-amber-500/20 text-amber-400',
  picked_up: 'bg-orange-500/20 text-orange-400',
  in_transit: 'bg-warning/20 text-warning',
  at_delivery: 'bg-lime-500/20 text-lime-400',
  delivered: 'bg-success/20 text-success',
  pod_submitted: 'bg-emerald-500/20 text-emerald-400',
  invoiced: 'bg-purple-500/20 text-purple-400',
  paid: 'bg-primary/20 text-primary',
};

const LoadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loads, setLoads, shippers, carriers, invoices } = useAppContext();
  const [invoiceBuilderOpen, setInvoiceBuilderOpen] = useState(false);

  const [carrierDocs, setCarrierDocs] = useState<any[]>([]);
  const [loadDocs, setLoadDocs] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [podUploading, setPodUploading] = useState(false);
  const [resending, setResending] = useState<string | null>(null);

  const load = loads.find(l => l.id === id);

  const fetchCarrierDocs = async () => {
    if (!id) return;
    setDocsLoading(true);
    const { data } = await supabase
      .from('carrier_documents')
      .select('id, type, status, signed_by_name, signed_at, created_at, carrier_id, document_data, load_id')
      .eq('load_id', id)
      .order('created_at', { ascending: false });
    setCarrierDocs(data || []);
    setDocsLoading(false);
  };

  const fetchLoadDocs = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('load_documents')
      .select('*')
      .eq('load_id', id)
      .order('created_at', { ascending: false });
    setLoadDocs(data || []);
  };

  const handlePodUpload = async (file: File) => {
    if (!id) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, HEIC, and PDF files are accepted');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }

    setPodUploading(true);
    const filePath = `${id}/pod/${file.name}`;

    const { error: uploadErr } = await supabase.storage
      .from('load-documents')
      .upload(filePath, file, { upsert: true });

    if (uploadErr) {
      toast.error(`Upload failed: ${uploadErr.message}`);
      setPodUploading(false);
      return;
    }

    const { error: dbErr } = await supabase.from('load_documents').insert({
      load_id: id,
      document_type: 'pod_signature',
      file_path: filePath,
      file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
    });

    if (dbErr) {
      await supabase.storage.from('load-documents').remove([filePath]);
      toast.error(`Failed to save document: ${dbErr.message}`);
      setPodUploading(false);
      return;
    }

    toast.success('POD uploaded successfully');
    setLoads(prev => prev.map(l => l.id === id ? { ...l, podUploaded: true } : l));
    fetchLoadDocs();
    setPodUploading(false);
  };

  const viewUploadedDoc = async (doc: any) => {
    const { data } = await supabase.storage.from('load-documents').createSignedUrl(doc.file_path, 300);
    if (data?.signedUrl) {
      const resp = await fetch(data.signedUrl);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const deleteLoadDoc = async (docId: string) => {
    const { error } = await supabase.from('load_documents').delete().eq('id', docId);
    if (error) {
      toast.error('Failed to delete document');
      return;
    }
    toast.success('Document deleted');
    setLoadDocs(prev => prev.filter(d => d.id !== docId));
  };

  const deleteCarrierDoc = async (docId: string) => {
    const { error } = await supabase.from('carrier_documents').delete().eq('id', docId);
    if (error) {
      toast.error('Failed to delete document');
      return;
    }
    toast.success('Document deleted');
    setCarrierDocs(prev => prev.filter(d => d.id !== docId));
  };

  const resendToCarrier = async (doc: any) => {
    setResending(doc.id);
    const { error } = await supabase.functions.invoke('send-ratecon-email', {
      body: { carrier_id: doc.carrier_id, document_id: doc.id },
    });
    if (error) {
      toast.error('Failed to resend document');
    } else {
      toast.success('Document resent to carrier');
    }
    setResending(null);
  };

  useEffect(() => {
    fetchCarrierDocs();
    fetchLoadDocs();
  }, [id]);

  if (!load) return <div className="p-6">Load not found. <Button variant="link" onClick={() => navigate('/loads')}>Back</Button></div>;

  const shipper = shippers.find(s => s.id === load.shipperId);
  const carrier = load.carrierId ? carriers.find(c => c.id === load.carrierId) : null;
  const margin = load.carrierRate > 0 ? load.shipperRate - load.carrierRate : null;
  const marginPct = margin !== null && load.shipperRate > 0 ? ((margin / load.shipperRate) * 100).toFixed(1) : null;

  const updateStatus = (status: LoadStatus) => {
    setLoads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const assignCarrier = (carrierId: string) => {
    setLoads(prev => prev.map(l => l.id === id ? { ...l, carrierId } : l));
  };

  const updateCarrierRate = (rate: string) => {
    setLoads(prev => prev.map(l => l.id === id ? { ...l, carrierRate: Number(rate) } : l));
  };

  const quickStatus = (status: LoadStatus, label: string) => {
    updateStatus(status);
    toast.success(`${load.loadNumber} → ${label}`);
  };

  const nextActions: { status: LoadStatus; label: string; icon: React.ReactNode }[] = [];
  if (load.status === 'available') nextActions.push({ status: 'booked', label: 'Mark Booked', icon: <Package className="h-4 w-4" /> });
  // Dispatch is handled by DispatchButton component with driver selection
  if (load.status === 'dispatched') nextActions.push({ status: 'rate_con_signed', label: 'Rate Con Signed', icon: <FileCheck className="h-4 w-4" /> });
  if (load.status === 'rate_con_signed') nextActions.push({ status: 'at_pickup', label: 'At Pickup', icon: <MapPin className="h-4 w-4" /> });
  if (load.status === 'at_pickup') nextActions.push({ status: 'picked_up', label: 'Picked Up', icon: <Package className="h-4 w-4" /> });
  if (load.status === 'picked_up') nextActions.push({ status: 'in_transit', label: 'In Transit', icon: <TruckIcon className="h-4 w-4" /> });
  if (load.status === 'in_transit') nextActions.push({ status: 'at_delivery', label: 'At Delivery', icon: <MapPin className="h-4 w-4" /> });
  if (load.status === 'at_delivery') nextActions.push({ status: 'delivered', label: 'Delivered', icon: <CheckCircle className="h-4 w-4" /> });
  if (load.status === 'delivered') nextActions.push({ status: 'pod_submitted', label: 'POD Submitted', icon: <FileCheck className="h-4 w-4" /> });
  if (load.status === 'pod_submitted') nextActions.push({ status: 'invoiced', label: 'Mark Invoiced', icon: <DollarSign className="h-4 w-4" /> });
  if (load.status === 'invoiced') nextActions.push({ status: 'paid', label: 'Mark Paid', icon: <CheckCircle className="h-4 w-4" /> });

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/loads">Loads</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{load.loadNumber}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{load.loadNumber}</h1>
          {load.referenceNumber && <p className="text-sm text-muted-foreground">Ref: {load.referenceNumber}</p>}
          <p className="text-sm text-muted-foreground">{load.origin} → {load.destination}</p>
        </div>
        <DispatchButton
          loadId={load.id}
          loadNumber={load.loadNumber}
          currentStatus={load.status}
          carrierId={load.carrierId}
          onStatusChange={(status) => { updateStatus(status as LoadStatus); }}
        />
        {nextActions.map(a => (
          <Button key={a.status} variant="outline" size="sm" onClick={() => quickStatus(a.status, a.label)} className="gap-1.5">
            {a.icon}{a.label}
          </Button>
        ))}
        <Select value={load.status} onValueChange={(v: LoadStatus) => { updateStatus(v); toast.success(`Status → ${loadStatusLabels[v]}`); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(loadStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Route</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="flex items-center gap-1"><MapPin className="h-3 w-3 text-success" />{load.origin}</p>
            <p className="flex items-center gap-1"><MapPin className="h-3 w-3 text-destructive" />{load.destination}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Dates</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="flex items-center gap-1"><Calendar className="h-3 w-3" />Pickup: {new Date(load.pickupDate).toLocaleDateString()}</p>
            <p className="flex items-center gap-1"><Calendar className="h-3 w-3" />Delivery: {new Date(load.deliveryDate).toLocaleDateString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Equipment</CardTitle></CardHeader>
          <CardContent>
            <p className="flex items-center gap-1 text-sm"><Truck className="h-3 w-3" />{equipmentTypeLabels[load.equipmentType]}</p>
            <p className="text-sm text-muted-foreground">{load.weight.toLocaleString()} lbs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Margin</CardTitle></CardHeader>
          <CardContent>
            {margin !== null ? (
              <div className={margin >= 0 ? 'text-success' : 'text-destructive'}>
                <p className="text-xl font-bold">${margin.toLocaleString()}</p>
                <p className="text-sm">{marginPct}% margin</p>
              </div>
            ) : <p className="text-muted-foreground">Assign carrier to calculate</p>}
          </CardContent>
        </Card>
      </div>

      {load.driverPhone && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Driver & Tracking</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Driver</span>
              <span className="font-medium">{load.driverName || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{load.driverPhone}</span>
            </div>
            <a
              href={`sms:${load.driverPhone}${/iPhone|iPad|iPod/.test(navigator.userAgent) ? '&' : '?'}body=${encodeURIComponent(`Download the DeMar Logistics driver app to track load ${load.loadNumber}:\nhttps://apps.apple.com/app/id6760852882\n\nAfter installing, open this link:\ndemarlogistics://track?load_id=${load.id}&phone=${encodeURIComponent(load.driverPhone)}`)}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent transition-colors"
            >
              <Smartphone className="h-4 w-4" />
              Text App Link to Driver
            </a>
          </CardContent>
        </Card>
      )}

      {/* Geofence Zones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5"><MapPin className="h-4 w-4" />Geofence Zones</CardTitle>
          {!load.pickupLat && !load.deliveryLat && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={async () => {
                toast.info('Geocoding addresses...');
                const { pickup, delivery } = await geocodeBoth(load.origin, load.destination);
                const updates: Partial<typeof load> = {};
                if (pickup) { updates.pickupLat = pickup.lat; updates.pickupLng = pickup.lng; updates.pickupRadiusM = 800; }
                if (delivery) { updates.deliveryLat = delivery.lat; updates.deliveryLng = delivery.lng; updates.deliveryRadiusM = 800; }
                if (Object.keys(updates).length > 0) {
                  setLoads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
                  toast.success('Geofences created');
                } else {
                  toast.error('Could not geocode addresses');
                }
              }}
            >
              <MapPin className="h-3.5 w-3.5" />Set Geofences
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {(load.pickupLat || load.deliveryLat) ? (
            <Suspense fallback={<div className="h-[300px] rounded-lg bg-muted animate-pulse" />}>
              <GeofenceMap
                pickupLat={load.pickupLat}
                pickupLng={load.pickupLng}
                pickupRadiusM={load.pickupRadiusM ?? 800}
                deliveryLat={load.deliveryLat}
                deliveryLng={load.deliveryLng}
                deliveryRadiusM={load.deliveryRadiusM ?? 800}
                onPickupRadiusChange={(r) => setLoads(prev => prev.map(l => l.id === id ? { ...l, pickupRadiusM: r } : l))}
                onDeliveryRadiusChange={(r) => setLoads(prev => prev.map(l => l.id === id ? { ...l, deliveryRadiusM: r } : l))}
              />
            </Suspense>
          ) : (
            <p className="text-sm text-muted-foreground">No geofence coordinates set. Click "Set Geofences" to geocode the origin and destination addresses.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Shipper</CardTitle></CardHeader>
          <CardContent>
            {shipper ? (
              <div>
                <p className="font-medium">{shipper.companyName}</p>
                <p className="text-sm text-muted-foreground">{shipper.city}, {shipper.state}</p>
                <p className="text-sm mt-2"><DollarSign className="inline h-3 w-3" />Rate: <span className="font-medium">${load.shipperRate.toLocaleString()}</span></p>
              </div>
            ) : <p className="text-muted-foreground">No shipper assigned</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Carrier</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Select value={load.carrierId || ''} onValueChange={assignCarrier}>
                <SelectTrigger><SelectValue placeholder="Assign carrier" /></SelectTrigger>
                <SelectContent>{carriers.map(c => <SelectItem key={c.id} value={c.id}>{c.companyName} ({c.mcNumber})</SelectItem>)}</SelectContent>
              </Select>
              {carrier && (
                <div>
                  <p className="font-medium">{carrier.companyName}</p>
                  <p className="text-sm text-muted-foreground">{carrier.mcNumber}</p>
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground">Carrier Rate ($)</label>
                <input
                  type="number"
                  value={load.carrierRate || ''}
                  onChange={e => updateCarrierRate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter carrier rate"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Documents</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <RateConBuilder load={load} shipper={shipper} carrier={carrier} />
          <BolBuilder load={load} shipper={shipper} carrier={carrier} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Carrier Document Status</CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchCarrierDocs} disabled={docsLoading}>
            <RefreshCw className={`h-4 w-4 ${docsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {carrierDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents sent to carrier yet. Use the builders above to save &amp; send.</p>
          ) : (
            <div className="space-y-3">
              {carrierDocs.map(doc => {
                const carrierName = carriers.find(c => c.id === doc.carrier_id)?.companyName || 'Unknown';
                return (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.type === 'rate_con' ? 'Rate Confirmation' : 'Bill of Lading'}</p>
                        <p className="text-xs text-muted-foreground">Sent to {carrierName} · {new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {doc.status === 'signed' ? (
                        <div>
                          <Badge className="border-0 bg-success/20 text-success">Signed</Badge>
                          <p className="mt-1 text-xs text-muted-foreground">by {doc.signed_by_name} · {new Date(doc.signed_at).toLocaleDateString()}</p>
                        </div>
                      ) : (
                        <Badge variant="outline" className="border-warning/50 text-warning">Pending Signature</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <DocumentViewer
                        doc={doc}
                        carrierName={carrierName}
                        editable={true}
                        onUpdated={fetchCarrierDocs}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={resending === doc.id}
                        onClick={() => resendToCarrier(doc)}
                        title="Resend to carrier"
                      >
                        <Send className={`h-4 w-4 text-primary ${resending === doc.id ? 'animate-pulse' : ''}`} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Document</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this {doc.type === 'rate_con' ? 'Rate Confirmation' : 'Bill of Lading'}. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteCarrierDoc(doc.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Uploaded Documents</CardTitle>
          <div>
            <input
              type="file"
              id="pod-upload"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.heic"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePodUpload(file);
                e.target.value = '';
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={podUploading}
              onClick={() => document.getElementById('pod-upload')?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              {podUploading ? 'Uploading...' : 'Upload POD'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No uploaded documents yet. Upload POD or other files above.</p>
          ) : (
            <div className="space-y-3">
              {loadDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {doc.document_type === 'pod_signature'
                          ? 'Proof of Delivery'
                          : doc.document_type === 'bol_photo'
                            ? 'Bill of Lading'
                            : doc.document_type === 'delivery_photo'
                              ? 'Delivery Photo'
                              : doc.document_type}
                      </p>
                      <p className="text-xs text-muted-foreground">{doc.file_name} • {new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => viewUploadedDoc(doc)} className="gap-1">
                      <Eye className="h-3.5 w-3.5" />View
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Document</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete this uploaded document.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteLoadDoc(doc.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Invoice & Payment</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(() => {
            const existingInvoice = invoices.find(i => i.loadIds.includes(load.id));
            if (existingInvoice) {
              return (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice #</span>
                    <Link to={`/invoices/${existingInvoice.id}`} className="font-medium text-primary hover:underline">{existingInvoice.invoiceNumber}</Link>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">${existingInvoice.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Status</span>
                    <Badge variant="outline">{paymentStatusLabels[load.paymentStatus]}</Badge>
                  </div>
                </>
              );
            }
            const canInvoice = ['delivered', 'pod_submitted'].includes(load.status);
            return (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice #</span>
                  <span className="font-medium">{load.invoiceNumber || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status</span>
                  <Badge variant="outline">{paymentStatusLabels[load.paymentStatus]}</Badge>
                </div>
                {canInvoice && (
                  <Button size="sm" className="w-full mt-2 gap-1" onClick={() => setInvoiceBuilderOpen(true)}>
                    <Receipt className="h-4 w-4" />Create Invoice
                  </Button>
                )}
              </>
            );
          })()}
        </CardContent>
      </Card>

      <InvoiceBuilder
        open={invoiceBuilderOpen}
        onOpenChange={setInvoiceBuilderOpen}
        preSelectedShipperId={load.shipperId}
        preSelectedLoadIds={[load.id]}
      />
    </div>
  );
};

export default LoadDetail;
