import { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShipperPortalLayout } from '@/components/layout/ShipperPortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, MapPin, Calendar, Truck, FileText, ClipboardList, Download, Eye } from 'lucide-react';

const DriverTrackingMap = lazy(() => import('@/components/shipper-portal/DriverTrackingMap'));
import { EQUIPMENT_LABEL } from '@/constants/locations';

const statusColors: Record<string, string> = {
  available: 'bg-muted text-muted-foreground',
  booked: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-yellow-100 text-yellow-800',
  delivered: 'bg-green-100 text-green-800',
  invoiced: 'bg-purple-100 text-purple-800',
  paid: 'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
  available: 'Available',
  booked: 'Booked',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  invoiced: 'Invoiced',
  paid: 'Paid',
};

const ShipperPortalLoadDetail = () => {
  const { loadId } = useParams<{ loadId: string }>();
  const navigate = useNavigate();
  const [load, setLoad] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadDocs, setLoadDocs] = useState<any[]>([]);
  const [carrierName, setCarrierName] = useState('');
  const [shipperName, setShipperName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/shipper-portal'); return; }

      const { data: portalUser } = await supabase
        .from('shipper_portal_users')
        .select('shipper_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!portalUser) { navigate('/shipper-portal'); return; }

      const { data: shipper } = await supabase
        .from('shippers')
        .select('company_name')
        .eq('id', portalUser.shipper_id)
        .single();
      setShipperName(shipper?.company_name || '');

      // Fetch load (shipper can only see their own)
      const { data: loadData } = await supabase
        .from('loads')
        .select('*')
        .eq('id', loadId)
        .eq('shipper_id', portalUser.shipper_id)
        .single();
      setLoad(loadData);

      if (loadData?.carrier_id) {
        const { data: carrier } = await supabase
          .from('carriers')
          .select('company_name')
          .eq('id', loadData.carrier_id)
          .single();
        setCarrierName(carrier?.company_name || '');
      }

      // Fetch carrier documents for this load (BOLs only - no rate cons for shippers)
      const { data: carrierDocs } = await supabase
        .from('carrier_documents')
        .select('id, type, status, signed_by_name, signed_at, created_at, document_data')
        .eq('load_id', loadId!)
        .eq('type', 'bol')
        .order('created_at', { ascending: false });
      setDocuments(carrierDocs || []);

      // Fetch uploaded load documents (POD files)
      const { data: uploadedDocs } = await supabase
        .from('load_documents')
        .select('*')
        .eq('load_id', loadId!)
        .order('created_at', { ascending: false });
      setLoadDocs(uploadedDocs || []);

      setLoading(false);
    };
    fetchData();
  }, [loadId, navigate]);

  const viewUploadedDoc = async (doc: any) => {
    const { data } = await supabase.storage.from('load-documents').createSignedUrl(doc.file_path, 300);
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  if (loading) {
    return <ShipperPortalLayout><div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Loading...</p></div></ShipperPortalLayout>;
  }

  if (!load) {
    return <ShipperPortalLayout><div className="text-center py-20"><p className="text-muted-foreground">Load not found.</p><Button variant="link" onClick={() => navigate('/shipper-portal/dashboard')}>Back</Button></div></ShipperPortalLayout>;
  }

  const trackableStatuses = ['dispatched', 'rate_con_signed', 'at_pickup', 'picked_up', 'in_transit', 'at_delivery'];
  const showTracking = load.carrier_id && trackableStatuses.includes(load.status);

  return (
    <ShipperPortalLayout shipperName={shipperName}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/shipper-portal/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">Load #{load.load_number}</h2>
            <p className="text-sm text-muted-foreground">{load.reference_number && `Ref: ${load.reference_number} • `}{load.origin} → {load.destination}</p>
          </div>
          <Badge className={statusColors[load.status] || 'bg-muted text-muted-foreground'}>
            {statusLabels[load.status] || load.status}
          </Badge>
        </div>

        {/* Load Info - no carrier rates shown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Route</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="flex items-center gap-1"><MapPin className="h-3 w-3 text-green-600" />{load.origin}</p>
              <p className="flex items-center gap-1"><MapPin className="h-3 w-3 text-red-600" />{load.destination}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Dates</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="flex items-center gap-1"><Calendar className="h-3 w-3" />Pickup: {load.pickup_date || '—'}</p>
              <p className="flex items-center gap-1"><Calendar className="h-3 w-3" />Delivery: {load.delivery_date || '—'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Details</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="flex items-center gap-1"><Truck className="h-3 w-3" />{EQUIPMENT_LABEL[load.equipment_type] || load.equipment_type}</p>
              {load.weight > 0 && <p>{load.weight.toLocaleString()} lbs</p>}
              {carrierName && <p>Carrier: {carrierName}</p>}
              {load.pod_uploaded && <Badge variant="outline" className="text-green-600 border-green-300">POD Uploaded</Badge>}
            </CardContent>
          </Card>
        </div>

        {/* Live Tracking Map */}
        {showTracking && (
          <Suspense fallback={<Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Loading map...</p></CardContent></Card>}>
            <DriverTrackingMap loadId={load.id} />
          </Suspense>
        )}

        {/* Documents */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Documents</CardTitle></CardHeader>
          <CardContent>
            {documents.length === 0 && loadDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents for this load yet.</p>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Bill of Lading</p>
                        <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge variant={doc.status === 'signed' ? 'default' : 'outline'}>
                      {doc.status === 'signed' ? 'Signed' : 'Pending'}
                    </Badge>
                  </div>
                ))}
                {loadDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.document_type === 'pod' ? 'Proof of Delivery' : doc.document_type === 'bol' ? 'Bill of Lading (Uploaded)' : doc.document_type}</p>
                        <p className="text-xs text-muted-foreground">{doc.file_name} • {new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => viewUploadedDoc(doc)} className="gap-1">
                      <Download className="h-3.5 w-3.5" />Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ShipperPortalLayout>
  );
};

export default ShipperPortalLoadDetail;
