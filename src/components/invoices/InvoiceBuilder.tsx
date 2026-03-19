import { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Invoice } from '@/types';
import { generateInvoicePdf } from './InvoicePdfGenerator';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedShipperId?: string;
  preSelectedLoadIds?: string[];
}

export default function InvoiceBuilder({ open, onOpenChange, preSelectedShipperId, preSelectedLoadIds }: InvoiceBuilderProps) {
  const { shippers, loads, invoices, setInvoices, setLoads } = useAppContext();
  const [shipperId, setShipperId] = useState(preSelectedShipperId || '');
  const [selectedLoadIds, setSelectedLoadIds] = useState<string[]>(preSelectedLoadIds || []);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  // When shipperId changes, reset selections
  const eligibleLoads = useMemo(() => {
    if (!shipperId) return [];
    const invoicedLoadIds = new Set(invoices.flatMap(i => i.loadIds));
    return loads.filter(l =>
      l.shipperId === shipperId &&
      ['pod_submitted', 'delivered', 'invoiced'].includes(l.status) &&
      !invoicedLoadIds.has(l.id)
    );
  }, [shipperId, loads, invoices]);

  const totalRate = useMemo(() => {
    return loads
      .filter(l => selectedLoadIds.includes(l.id))
      .reduce((sum, l) => sum + l.shipperRate, 0);
  }, [selectedLoadIds, loads]);

  // Set default amount when loads change
  const handleLoadToggle = (loadId: string, checked: boolean) => {
    const next = checked
      ? [...selectedLoadIds, loadId]
      : selectedLoadIds.filter(id => id !== loadId);
    setSelectedLoadIds(next);
    const newTotal = loads.filter(l => next.includes(l.id)).reduce((sum, l) => sum + l.shipperRate, 0);
    setAmount(String(newTotal));
  };

  // Set defaults when shipper changes
  const handleShipperChange = (id: string) => {
    setShipperId(id);
    setSelectedLoadIds([]);
    setAmount('');
    // Default due date: 30 days from now
    const due = new Date();
    due.setDate(due.getDate() + 30);
    setDueDate(due.toISOString().split('T')[0]);
  };

  // Pre-select loads when dialog opens with pre-selections
  useState(() => {
    if (preSelectedShipperId) {
      handleShipperChange(preSelectedShipperId);
      if (preSelectedLoadIds?.length) {
        setSelectedLoadIds(preSelectedLoadIds);
        const total = loads.filter(l => preSelectedLoadIds.includes(l.id)).reduce((sum, l) => sum + l.shipperRate, 0);
        setAmount(String(total));
      }
    }
  });

  const generateInvoiceNumber = (): string => {
    const year = new Date().getFullYear();
    const existing = invoices
      .map(i => i.invoiceNumber)
      .filter(n => n.startsWith(`INV-${year}-`))
      .map(n => parseInt(n.split('-')[2], 10))
      .filter(n => !isNaN(n));
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    return `INV-${year}-${String(next).padStart(4, '0')}`;
  };

  const fetchPodImages = async (loadIds: string[]): Promise<string[]> => {
    const images: string[] = [];
    for (const loadId of loadIds) {
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
          images.push(base64);
        } catch {
          // Skip failed images
        }
      }
    }
    return images;
  };

  const handleCreate = async () => {
    if (!shipperId || selectedLoadIds.length === 0 || !dueDate) {
      toast.error('Select a shipper, at least one load, and a due date');
      return;
    }

    setGenerating(true);
    try {
      const shipper = shippers.find(s => s.id === shipperId);
      if (!shipper) throw new Error('Shipper not found');

      const invoiceNumber = generateInvoiceNumber();
      const selectedLoads = loads.filter(l => selectedLoadIds.includes(l.id));
      const podImages = await fetchPodImages(selectedLoadIds);

      const invoice: Invoice = {
        id: crypto.randomUUID(),
        invoiceNumber,
        shipperId,
        loadIds: selectedLoadIds,
        amount: Number(amount) || totalRate,
        dueDate,
        status: 'draft',
        notes,
        pdfPath: '',
        createdAt: new Date().toISOString(),
      };

      // Generate PDF
      const doc = generateInvoicePdf({
        invoice,
        shipper,
        loads: selectedLoads,
        podImages,
      });

      // Save PDF to Supabase Storage
      const pdfBlob = doc.output('blob');
      const pdfPath = `invoices/${invoice.id}/${invoiceNumber}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('load-documents')
        .upload(pdfPath, pdfBlob, { contentType: 'application/pdf' });

      if (uploadError) {
        console.error('PDF upload error:', uploadError);
        // Still save the invoice even if upload fails
      } else {
        invoice.pdfPath = pdfPath;
      }

      // Download PDF for user
      doc.save(`${invoiceNumber}.pdf`);

      // Save invoice
      setInvoices(prev => [...prev, invoice]);

      // Update load statuses to 'invoiced'
      setLoads(prev => prev.map(l =>
        selectedLoadIds.includes(l.id)
          ? { ...l, status: 'invoiced' as const, invoiceNumber, invoiceAmount: l.shipperRate, invoiceDate: new Date().toISOString().split('T')[0] }
          : l
      ));

      toast.success(`Invoice ${invoiceNumber} created and downloaded`);
      onOpenChange(false);
    } catch (err) {
      console.error('Invoice creation error:', err);
      toast.error('Failed to create invoice');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Shipper</Label>
            <Select value={shipperId} onValueChange={handleShipperChange}>
              <SelectTrigger><SelectValue placeholder="Select shipper" /></SelectTrigger>
              <SelectContent>
                {shippers.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {shipperId && (
            <div>
              <Label className="mb-2 block">Select Loads</Label>
              {eligibleLoads.length === 0 ? (
                <p className="text-sm text-muted-foreground">No eligible loads (delivered/pod_submitted) for this shipper</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {eligibleLoads.map(l => (
                    <label key={l.id} className="flex items-center gap-3 p-2 rounded hover:bg-accent/50 cursor-pointer">
                      <Checkbox
                        checked={selectedLoadIds.includes(l.id)}
                        onCheckedChange={(checked) => handleLoadToggle(l.id, !!checked)}
                      />
                      <div className="flex-1 text-sm">
                        <span className="font-medium">{l.loadNumber}</span>
                        <span className="text-muted-foreground ml-2">{l.origin} → {l.destination}</span>
                      </div>
                      <span className="text-sm font-medium">${l.shipperRate.toLocaleString()}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount ($)</Label>
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={String(totalRate)}
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional notes for this invoice..."
              rows={2}
            />
          </div>

          {selectedLoadIds.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{selectedLoadIds.length} load{selectedLoadIds.length > 1 ? 's' : ''} selected</span>
                <span className="font-bold">${(Number(amount) || totalRate).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={generating || !shipperId || selectedLoadIds.length === 0 || !dueDate}
          >
            {generating ? 'Generating PDF...' : 'Create Invoice & Download PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
