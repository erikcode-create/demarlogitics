import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CarrierPortalLayout } from '@/components/layout/CarrierPortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { FileText, ClipboardList, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

const CarrierPortalDashboard = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<CarrierDocument[]>([]);
  const [carrierName, setCarrierName] = useState('');
  const [carrierId, setCarrierId] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { file_name: string }>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/portal'); return; }

      let cId = '';
      const { data: portalUser } = await supabase
        .from('carrier_portal_users')
        .select('carrier_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!portalUser) {
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
          cId = carrier.id;
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
        cId = portalUser.carrier_id;
      }

      setCarrierId(cId);
      await Promise.all([fetchDocuments(cId), fetchOnboardingDocs(cId)]);
      setLoading(false);
    };

    const fetchDocuments = async (cId: string) => {
      const { data } = await supabase
        .from('carrier_documents')
        .select('*')
        .eq('carrier_id', cId)
        .order('created_at', { ascending: false });
      setDocuments((data as CarrierDocument[]) || []);
    };

    fetchData();
  }, [navigate]);

  const fetchOnboardingDocs = async (cId: string) => {
    const { data } = await supabase
      .from('carrier_onboarding_documents')
      .select('document_type, file_name')
      .eq('carrier_id', cId);
    const map: Record<string, { file_name: string }> = {};
    (data || []).forEach((d: any) => { map[d.document_type] = { file_name: d.file_name }; });
    setUploadedDocs(map);
  };

  const handleUpload = async (docType: string, file: File) => {
    if (!carrierId) return;
    setUploading(docType);

    const filePath = `${carrierId}/${docType}/${file.name}`;
    const { error: uploadErr } = await supabase.storage
      .from('carrier-onboarding-docs')
      .upload(filePath, file, { upsert: true });

    if (uploadErr) {
      toast({ title: 'Upload failed', description: uploadErr.message, variant: 'destructive' });
      setUploading(null);
      return;
    }

    const { error: dbErr } = await supabase.from('carrier_onboarding_documents').upsert({
      carrier_id: carrierId,
      document_type: docType,
      file_path: filePath,
      file_name: file.name,
    }, { onConflict: 'carrier_id,document_type' });

    if (dbErr) {
      toast({ title: 'Error', description: dbErr.message, variant: 'destructive' });
    } else {
      toast({ title: 'Uploaded', description: `${file.name} uploaded successfully.` });
      await fetchOnboardingDocs(carrierId);
    }
    setUploading(null);
  };

  const completedCount = REQUIRED_DOCS.filter(d => uploadedDocs[d.key]).length;
  const isOnboardingComplete = completedCount === REQUIRED_DOCS.length;

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
        {/* Onboarding Section */}
        {!isOnboardingComplete && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-primary" />
                Complete Your Onboarding
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload the following documents to access your rate confirmations.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Progress value={(completedCount / REQUIRED_DOCS.length) * 100} className="flex-1" />
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  {completedCount}/{REQUIRED_DOCS.length}
                </span>
              </div>

              <div className="space-y-3">
                {REQUIRED_DOCS.map((doc) => {
                  const uploaded = uploadedDocs[doc.key];
                  const isUploading = uploading === doc.key;

                  return (
                    <div
                      key={doc.key}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      {uploaded ? (
                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{doc.label}</p>
                        {uploaded && (
                          <p className="text-xs text-muted-foreground truncate">{uploaded.file_name}</p>
                        )}
                      </div>
                      <>
                        <input
                          type="file"
                          id={`file-input-${doc.key}`}
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(doc.key, file);
                            e.target.value = '';
                          }}
                        />
                        <Button
                          variant={uploaded ? 'ghost' : 'outline'}
                          size="sm"
                          className="gap-1"
                          disabled={isUploading}
                          onClick={() => document.getElementById(`file-input-${doc.key}`)?.click()}
                        >
                          <Upload className="h-3 w-3" />
                          {isUploading ? 'Uploading...' : uploaded ? 'Replace' : 'Upload'}
                        </Button>
                      </>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Onboarding complete badge */}
        {isOnboardingComplete && (
          <div className="flex items-center gap-2 rounded-lg border border-green-600/30 bg-green-600/5 px-4 py-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              Onboarding complete — all documents uploaded
            </span>
          </div>
        )}

        {/* Documents Section */}
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
                onClick={() => {
                  if (!isOnboardingComplete) {
                    toast({
                      title: 'Onboarding Required',
                      description: 'Please upload all required documents before viewing rate confirmations.',
                      variant: 'destructive',
                    });
                    return;
                  }
                  navigate(`/portal/documents/${doc.id}`);
                }}
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
                  <div className="flex items-center gap-2">
                    {!isOnboardingComplete && (
                      <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                        Locked
                      </Badge>
                    )}
                    <Badge variant={doc.status === 'signed' ? 'default' : 'outline'}>
                      {doc.status === 'signed' ? 'Signed' : 'Pending Signature'}
                    </Badge>
                  </div>
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
