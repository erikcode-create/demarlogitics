import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CarrierPortalLayout } from '@/components/layout/CarrierPortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, MapPin, Calendar, Truck, FileText, ClipboardList, Download, Eye } from 'lucide-react';

const statusColors: Record<string, string> = {
  available: 'bg-blue-100 text-blue-800',
  booked: 'bg-blue-100 text-blue-800',
  dispatched: 'bg-yellow-100 text-yellow-800',
  in_transit: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  invoiced: 'bg-purple-100 text-purple-800',
  paid: 'bg-green-100 text-green-800',
};

const CarrierPortalLoadDetail = () => {
  const { loadId } = useParams<{ loadId: string }>();
  const navigate = useNavigate();
  const [load, setLoad] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadDocs, setLoadDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [carrierName, setCarrierName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/portal'); return; }

      const { data: portalUser } = await supabase
        .from('carrier_portal_users')
        .select('carrier_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!portalUser) { navigate('/portal'); return; }

      const { data: carrier } = await supabase
        .from('carriers')
        .select('company_name')
        .eq('id', portalUser.carrier_id)
        .single();
      setCarrierName(carrier?.company_name || '');

      // Fetch load
      const { data: loadData } = await supabase
        .from('loads')
        .select('*')
        .eq('id', loadId)
        .eq('carrier_id', portalUser.carrier_id)
        .single();
      setLoad(loadData);

      // Fetch carrier documents for this load
      const { data: carrierDocs } = await supabase
        .from('carrier_documents')
        .select('*')
        .eq('load_id', loadId!)
        .eq('carrier_id', portalUser.carrier_id)
        .order('created_at', { ascending: false });
      setDocuments(carrierDocs || []);

      // Fetch uploaded load documents (BOL, POD files)
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
    return <CarrierPortalLayout><div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Loading...</p></div></CarrierPortalLayout>;
  }

  if (!load) {
    return <CarrierPortalLayout><div className="text-center py-20"><p className="text-muted-foreground">Load not found.</p><Button variant="link" onClick={() => navigate('/portal/documents')}>Back</Button></div></CarrierPortalLayout>;
  }

  return (
    <CarrierPortalLayout carrierName={carrierName}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/portal/documents')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">Load #{load.load_number}</h2>
            <p className="text-sm text-muted-foreground">{load.origin} → {load.destination}</p>
          </div>
          <Badge className={statusColors[load.status] || 'bg-muted text-muted-foreground'}>
            {load.status.replace(/_/g, ' ')}
          </Badge>
        </div>

        {/* Load Info */}
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
              <p className="flex items-center gap-1"><Truck className="h-3 w-3" />{load.equipment_type?.replace(/_/g, ' ')}</p>
              {load.weight > 0 && <p>{load.weight.toLocaleString()} lbs</p>}
              {load.carrier_rate > 0 && <p className="font-semibold text-success">${load.carrier_rate.toLocaleString()}</p>}
            </CardContent>
          </Card>
        </div>

        {/* Carrier Documents (Rate Cons, BOLs) */}
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
                      {doc.type === 'rate_con' ? <FileText className="h-5 w-5 text-primary" /> : <ClipboardList className="h-5 w-5 text-primary" />}
                      <div>
                        <p className="text-sm font-medium">{doc.type === 'rate_con' ? 'Rate Confirmation' : 'Bill of Lading'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={doc.status === 'signed' ? 'default' : 'outline'}>
                        {doc.status === 'signed' ? 'Signed' : 'Pending'}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/portal/documents/${doc.id}`)} className="gap-1">
                        <Eye className="h-3.5 w-3.5" />View
                      </Button>
                    </div>
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
    </CarrierPortalLayout>
  );
};

export default CarrierPortalLoadDetail;
