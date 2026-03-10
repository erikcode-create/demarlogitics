import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CarrierPortalLayout } from '@/components/layout/CarrierPortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { FileText, ClipboardList, Eye } from 'lucide-react';

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

const CarrierPortalPreview = () => {
  const { carrierId } = useParams<{ carrierId: string }>();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<CarrierDocument[]>([]);
  const [carrierName, setCarrierName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!carrierId) return;

    const fetchData = async () => {
      const { data: carrier } = await supabase
        .from('carriers')
        .select('company_name')
        .eq('id', carrierId)
        .single();

      setCarrierName(carrier?.company_name || 'Unknown Carrier');

      const { data: docs } = await supabase
        .from('carrier_documents')
        .select('*')
        .eq('carrier_id', carrierId)
        .order('created_at', { ascending: false });

      setDocuments((docs as CarrierDocument[]) || []);
      setLoading(false);
    };

    fetchData();
  }, [carrierId]);

  if (loading) {
    return (
      <CarrierPortalLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading preview...</p>
        </div>
      </CarrierPortalLayout>
    );
  }

  return (
    <CarrierPortalLayout carrierName={carrierName}>
      <div className="space-y-6">
        {/* Preview Mode Banner */}
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <Eye className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-primary">
            Preview Mode — Viewing as {carrierName}
          </span>
        </div>

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

export default CarrierPortalPreview;
