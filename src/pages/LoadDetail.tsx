import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, Calendar, Truck, Upload, FileCheck, DollarSign, FileText, RefreshCw, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { loadStatusLabels, equipmentTypeLabels, paymentStatusLabels } from '@/data/mockData';
import { LoadStatus, PaymentStatus } from '@/types';
import RateConBuilder from '@/components/documents/RateConBuilder';
import BolBuilder from '@/components/documents/BolBuilder';
import { supabase } from '@/integrations/supabase/client';
const statusColors: Record<string, string> = {
  available: 'bg-muted text-muted-foreground',
  booked: 'bg-blue-500/20 text-blue-400',
  in_transit: 'bg-warning/20 text-warning',
  delivered: 'bg-success/20 text-success',
  invoiced: 'bg-purple-500/20 text-purple-400',
  paid: 'bg-primary/20 text-primary',
};

const LoadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loads, setLoads, shippers, carriers } = useAppContext();

  const [carrierDocs, setCarrierDocs] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const load = loads.find(l => l.id === id);

  const fetchCarrierDocs = async () => {
    if (!id) return;
    setDocsLoading(true);
    const { data } = await supabase
      .from('carrier_documents')
      .select('id, type, status, signed_by_name, signed_at, created_at, carrier_id')
      .eq('load_id', id)
      .order('created_at', { ascending: false });
    setCarrierDocs(data || []);
    setDocsLoading(false);
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

  useEffect(() => { fetchCarrierDocs(); }, [id]);

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

  const togglePod = () => {
    setLoads(prev => prev.map(l => l.id === id ? { ...l, podUploaded: !l.podUploaded } : l));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/loads')}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{load.loadNumber}</h1>
          {load.referenceNumber && <p className="text-sm text-muted-foreground">Ref: {load.referenceNumber}</p>}
          <p className="text-sm text-muted-foreground">{load.origin} → {load.destination}</p>
        </div>
        <Select value={load.status} onValueChange={(v: LoadStatus) => updateStatus(v)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(loadStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Shipper & Carrier */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter carrier rate"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Documents</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <RateConBuilder load={load} shipper={shipper} carrier={carrier} />
          <BolBuilder load={load} shipper={shipper} carrier={carrier} />
        </CardContent>
      </Card>

      {/* Carrier Documents Status */}
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
                          <Badge className="bg-success/20 text-success border-0">Signed</Badge>
                          <p className="text-xs text-muted-foreground mt-1">by {doc.signed_by_name} · {new Date(doc.signed_at).toLocaleDateString()}</p>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-warning border-warning/50">Pending Signature</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      {/* POD & Invoice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Proof of Delivery</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-4">
            {load.podUploaded ? <FileCheck className="h-8 w-8 text-success" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
            <div>
              <Badge variant={load.podUploaded ? 'default' : 'outline'}>{load.podUploaded ? 'Uploaded' : 'Not Uploaded'}</Badge>
            </div>
            <Button size="sm" variant="outline" onClick={togglePod}>
              {load.podUploaded ? 'Remove' : 'Upload POD'}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Invoice & Payment</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice #</span>
              <span className="font-medium">{load.invoiceNumber || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">{load.invoiceAmount ? `$${load.invoiceAmount.toLocaleString()}` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Status</span>
              <Badge variant="outline">{paymentStatusLabels[load.paymentStatus]}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoadDetail;
