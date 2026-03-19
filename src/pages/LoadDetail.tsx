import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { MapPin, Calendar, Truck, Upload, FileCheck, DollarSign, FileText, RefreshCw, Trash2, Send, CheckCircle, TruckIcon, Package, Eye, Download } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { loadStatusLabels, equipmentTypeLabels, paymentStatusLabels } from '@/data/mockData';
import { LoadStatus, PaymentStatus } from '@/types';
import RateConBuilder from '@/components/documents/RateConBuilder';
import BolBuilder from '@/components/documents/BolBuilder';
import DocumentViewer from '@/components/documents/DocumentViewer';
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
  const [loadDocs, setLoadDocs] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [podUploading, setPodUploading] = useState(false);

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
...
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

      {/* Invoice */}
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
  );
};

export default LoadDetail;
