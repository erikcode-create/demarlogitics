import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, FileText, Image, FileSignature, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LoadDocument {
  id: string;
  load_id: string;
  document_type: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  uploaded_by_phone: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  rate_con_signed: 'Signed Rate Confirmation',
  bol_photo: 'Bill of Lading',
  delivery_photo: 'Delivery Photo',
  pod_signature: 'POD Signature',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  rate_con_signed: <FileSignature className="h-4 w-4" />,
  bol_photo: <Image className="h-4 w-4" />,
  delivery_photo: <Image className="h-4 w-4" />,
  pod_signature: <FileSignature className="h-4 w-4" />,
};

const TYPE_ORDER = ['rate_con_signed', 'bol_photo', 'delivery_photo', 'pod_signature'];

interface LoadDocumentHubProps {
  loadId: string;
  loadStatus: string;
}

export default function LoadDocumentHub({ loadId, loadStatus }: LoadDocumentHubProps) {
  const [docs, setDocs] = useState<LoadDocument[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('load_documents')
      .select('*')
      .eq('load_id', loadId)
      .order('created_at', { ascending: false });
    setDocs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, [loadId]);

  const downloadDoc = async (doc: LoadDocument) => {
    const { data } = await supabase.storage
      .from('load-documents')
      .createSignedUrl(doc.file_path, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  // Group by type
  const grouped = docs.reduce<Record<string, LoadDocument[]>>((acc, doc) => {
    if (!acc[doc.document_type]) acc[doc.document_type] = [];
    acc[doc.document_type].push(doc);
    return acc;
  }, {});

  // Determine which doc types are expected based on status progression
  const expectedTypes = getExpectedDocTypes(loadStatus);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Driver Documents</CardTitle>
        <Button variant="ghost" size="icon" onClick={fetchDocs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {docs.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">No documents uploaded by the driver yet.</p>
        )}

        <div className="space-y-4">
          {TYPE_ORDER.map(type => {
            const typeDocs = grouped[type] || [];
            const isExpected = expectedTypes.includes(type);
            const isMissing = isExpected && typeDocs.length === 0;

            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-2">
                  {TYPE_ICONS[type] || <FileText className="h-4 w-4" />}
                  <span className="text-sm font-medium">{TYPE_LABELS[type] || type}</span>
                  {typeDocs.length > 0 && (
                    <Badge className="bg-success/20 text-success border-0 text-xs">{typeDocs.length}</Badge>
                  )}
                  {isMissing && (
                    <Badge variant="outline" className="text-warning border-warning/50 text-xs gap-1">
                      <AlertTriangle className="h-3 w-3" />Missing
                    </Badge>
                  )}
                </div>

                {typeDocs.length > 0 && (
                  <div className="space-y-1 ml-6">
                    {typeDocs.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between rounded border border-border px-3 py-2">
                        <div>
                          <p className="text-xs font-medium truncate max-w-[200px]">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.created_at).toLocaleString()}
                            {doc.uploaded_by_phone && ` · ${doc.uploaded_by_phone}`}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => downloadDoc(doc)}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function getExpectedDocTypes(status: string): string[] {
  const statusIndex = [
    'available', 'booked', 'dispatched', 'rate_con_signed', 'at_pickup',
    'picked_up', 'in_transit', 'at_delivery', 'delivered', 'pod_submitted',
    'invoiced', 'paid',
  ].indexOf(status);

  const expected: string[] = [];
  if (statusIndex >= 3) expected.push('rate_con_signed');  // After rate_con_signed
  if (statusIndex >= 5) expected.push('bol_photo');         // After picked_up
  if (statusIndex >= 8) expected.push('delivery_photo');    // After delivered
  if (statusIndex >= 9) expected.push('pod_signature');     // After pod_submitted
  return expected;
}
