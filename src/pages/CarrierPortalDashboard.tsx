import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CarrierPortalLayout } from '@/components/layout/CarrierPortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { FileText, ClipboardList } from 'lucide-react';

interface CarrierDocument {
  id: string;
  type: string;
  status: string;
  signed_by_name: string;
  signed_at: string | null;
  created_at: string;
  document_data: Record<string, any>;
  load_id: string;
}

const CarrierPortalDashboard = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<CarrierDocument[]>([]);
  const [carrierName, setCarrierName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Get current user's carrier link
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/portal'); return; }

      const { data: portalUser } = await supabase
        .from('carrier_portal_users')
        .select('carrier_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!portalUser) {
        // Try to auto-link by email
        const { data: carrier } = await supabase
          .from('carriers')
          .select('id, company_name')
          .eq('email', user.email || '')
          .maybeSingle();

        if (carrier) {
          await supabase.from('carrier_portal_users').insert({
            user_id: user.id,
            carrier_id: carrier.id,
          });
          setCarrierName(carrier.company_name);
          await fetchDocuments(carrier.id);
        } else {
          setLoading(false);
          return;
        }
      } else {
        const { data: carrier } = await supabase
          .from('carriers')
          .select('company_name')
          .eq('id', portalUser.carrier_id)
          .single();

        setCarrierName(carrier?.company_name || '');
        await fetchDocuments(portalUser.carrier_id);
      }
      setLoading(false);
    };

    const fetchDocuments = async (carrierId: string) => {
      const { data } = await supabase
        .from('carrier_documents')
        .select('*')
        .eq('carrier_id', carrierId)
        .order('created_at', { ascending: false });

      setDocuments((data as CarrierDocument[]) || []);
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <CarrierPortalLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </CarrierPortalLayout>
    );
  }

  return (
    <CarrierPortalLayout carrierName={carrierName}>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Your Documents</h2>
          <p className="text-sm text-muted-foreground">View and sign your rate confirmations and bills of lading</p>
        </div>

        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No documents yet. Documents will appear here when your broker sends them.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/portal/documents/${doc.id}`)}
              >
                <CardContent className="py-4 flex items-center gap-4">
                  {doc.type === 'rate_con' ? (
                    <FileText className="h-8 w-8 text-primary shrink-0" />
                  ) : (
                    <ClipboardList className="h-8 w-8 text-primary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {doc.type === 'rate_con' ? 'Rate Confirmation' : 'Bill of Lading'}
                      {doc.document_data?.loadNumber && ` — ${doc.document_data.loadNumber}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {doc.document_data?.origin} → {doc.document_data?.destination}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={doc.status === 'signed' ? 'default' : 'outline'}>
                    {doc.status === 'signed' ? 'Signed' : 'Pending Signature'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CarrierPortalLayout>
  );
};

export default CarrierPortalDashboard;
