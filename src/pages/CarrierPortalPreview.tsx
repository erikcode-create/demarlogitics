import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CarrierPortalLayout } from '@/components/layout/CarrierPortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { FileText, ClipboardList, Eye, CheckCircle, AlertCircle } from 'lucide-react';

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

const REQUIRED_DOCS = [
  { key: 'w9', label: 'W-9' },
  { key: 'workers_comp', label: 'Workers Compensation' },
  { key: 'certificate_of_insurance', label: 'Certificate of Insurance' },
  { key: 'mc_authority_letter', label: 'MC Authority Letter (FMCSA)' },
  { key: 'notice_of_assignment', label: 'Notice of Assignment' },
] as const;

const CarrierPortalPreview = () => {
  const { carrierId } = useParams<{ carrierId: string }>();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<CarrierDocument[]>([]);
  const [carrierName, setCarrierName] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);

  useEffect(() => {
    if (!carrierId) return;

    const fetchData = async () => {
      const { data: carrier } = await supabase
        .from('carriers')
        .select('company_name')
        .eq('id', carrierId)
        .single();

      setCarrierName(carrier?.company_name || 'Unknown Carrier');

      const [docsRes, onboardingRes] = await Promise.all([
        supabase
          .from('carrier_documents')
          .select('*')
          .eq('carrier_id', carrierId)
          .order('created_at', { ascending: false }),
        supabase
          .from('carrier_onboarding_documents')
          .select('document_type')
          .eq('carrier_id', carrierId),
      ]);

      setDocuments((docsRes.data as CarrierDocument[]) || []);
      setUploadedDocs((onboardingRes.data || []).map((d: any) => d.document_type));
      setLoading(false);
    };

    fetchData();
  }, [carrierId]);

  const completedCount = REQUIRED_DOCS.filter(d => uploadedDocs.includes(d.key)).length;
  const isOnboardingComplete = completedCount === REQUIRED_DOCS.length;

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

        {/* Onboarding Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              {isOnboardingComplete ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-500" />
              )}
              Onboarding Status: {completedCount}/{REQUIRED_DOCS.length} Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={(completedCount / REQUIRED_DOCS.length) * 100} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REQUIRED_DOCS.map((doc) => (
                <div key={doc.key} className="flex items-center gap-2 text-sm">
                  {uploadedDocs.includes(doc.key) ? (
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                  )}
                  <span className={uploadedDocs.includes(doc.key) ? 'text-foreground' : 'text-muted-foreground'}>
                    {doc.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-bold text-foreground">Documents</h2>
          <p className="text-sm text-muted-foreground">Rate confirmations and bills of lading</p>
        </div>

        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No documents yet.
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
