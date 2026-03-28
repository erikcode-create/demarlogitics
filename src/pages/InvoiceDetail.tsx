import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DollarSign, Download, CheckCircle, Send, Calendar, Building2, Package, Trash2 } from 'lucide-react';
import { invoiceStatusLabels } from '@/data/mockData';
import { InvoiceStatus } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateInvoicePdf } from '@/components/invoices/InvoicePdfGenerator';

const statusColors: Record<InvoiceStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-500/20 text-blue-400',
  paid: 'bg-success/20 text-success',
  overdue: 'bg-destructive/20 text-destructive',
};

const InvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoices, setInvoices, shippers, loads, setLoads, deleteRecord } = useAppContext();
  const [downloading, setDownloading] = useState(false);

  const invoice = invoices.find(i => i.id === id);
  if (!invoice) {
    return (
      <div className="p-6">
        Invoice not found. <Button variant="link" onClick={() => navigate('/invoices')}>Back</Button>
      </div>
    );
  }

  const shipper = shippers.find(s => s.id === invoice.shipperId);
  const invoiceLoads = loads.filter(l => invoice.loadIds.includes(l.id));

  const updateStatus = (status: InvoiceStatus) => {
    const updates: Partial<typeof invoice> = { status };
    if (status === 'paid') {
      updates.paidAt = new Date().toISOString();
      // Also mark loads as paid
      setLoads(prev => prev.map(l =>
        invoice.loadIds.includes(l.id)
          ? { ...l, status: 'paid' as const, paymentStatus: 'paid' as const }
          : l
      ));
    }
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    toast.success(`Invoice marked as ${invoiceStatusLabels[status]}`);
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      if (invoice.pdfPath) {
        // Try downloading from storage first
        const { data } = await supabase.storage
          .from('load-documents')
          .createSignedUrl(invoice.pdfPath, 300);
        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
          setDownloading(false);
          return;
        }
      }
      // Regenerate PDF if no stored version
      if (!shipper) throw new Error('Shipper not found');

      // Fetch POD images
      const podImages: string[] = [];
      for (const loadId of invoice.loadIds) {
        const { data: docs } = await supabase
          .from('load_documents')
          .select('file_path, document_type')
          .eq('load_id', loadId)
          .in('document_type', ['bol_photo', 'pod_signature', 'delivery_photo']);
        if (!docs) continue;
        for (const doc of docs) {
          const { data: signedData } = await supabase.storage
            .from('load-documents')
            .createSignedUrl(doc.file_path, 300);
          if (!signedData?.signedUrl) continue;
          try {
            const resp = await fetch(signedData.signedUrl);
            const blob = await resp.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            podImages.push(base64);
          } catch { /* skip */ }
        }
      }

      const doc = generateInvoicePdf({ invoice, shipper, loads: invoiceLoads, podImages });
      doc.save(`${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/invoices">Invoices</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{invoice.invoiceNumber}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {shipper?.companyName || 'Unknown Shipper'} &middot; {invoiceLoads.length} load{invoiceLoads.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Badge className={`text-sm px-3 py-1 ${statusColors[invoice.status as InvoiceStatus]}`}>
          {invoiceStatusLabels[invoice.status as InvoiceStatus]}
        </Badge>
        <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={downloading}>
          <Download className="mr-1 h-4 w-4" />{downloading ? 'Downloading...' : 'Download PDF'}
        </Button>
        {invoice.status === 'draft' && (
          <Button size="sm" variant="outline" onClick={() => updateStatus('sent')}>
            <Send className="mr-1 h-4 w-4" />Mark Sent
          </Button>
        )}
        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
          <Button size="sm" onClick={() => updateStatus('paid')}>
            <CheckCircle className="mr-1 h-4 w-4" />Mark Paid
          </Button>
        )}
        {invoice.status === 'sent' && (
          <Button size="sm" variant="destructive" onClick={() => updateStatus('overdue')}>
            Mark Overdue
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
              <Trash2 className="mr-1 h-4 w-4" />Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {invoice.invoiceNumber}?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete this invoice. This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  deleteRecord('invoices', invoice.id);
                  setInvoices(prev => prev.filter(i => i.id !== invoice.id));
                  toast.success('Invoice deleted');
                  navigate('/invoices');
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Amount</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Created</CardTitle></CardHeader>
          <CardContent>
            <p className="flex items-center gap-1 text-sm"><Calendar className="h-3 w-3" />{new Date(invoice.createdAt).toLocaleDateString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Due Date</CardTitle></CardHeader>
          <CardContent>
            <p className="flex items-center gap-1 text-sm"><Calendar className="h-3 w-3" />{new Date(invoice.dueDate).toLocaleDateString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Paid</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : '—'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Shipper Info */}
      {shipper && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-1"><Building2 className="h-4 w-4" />Shipper</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{shipper.companyName}</p>
            {shipper.address && <p className="text-muted-foreground">{shipper.address}</p>}
            <p className="text-muted-foreground">{shipper.city}, {shipper.state} {shipper.zip}</p>
            {shipper.paymentTerms && <p className="text-muted-foreground">Terms: {shipper.paymentTerms}</p>}
          </CardContent>
        </Card>
      )}

      {/* Loads */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-1"><Package className="h-4 w-4" />Loads</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {invoiceLoads.map(l => (
              <Link
                key={l.id}
                to={`/loads/${l.id}`}
                className="flex items-center justify-between p-3 hover:bg-accent/50"
              >
                <div>
                  <span className="font-medium text-sm">{l.loadNumber}</span>
                  <span className="text-sm text-muted-foreground ml-3">{l.origin} → {l.destination}</span>
                </div>
                <span className="font-medium text-sm">${l.shipperRate.toLocaleString()}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InvoiceDetail;
