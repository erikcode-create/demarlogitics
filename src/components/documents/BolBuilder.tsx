import { useState, useEffect } from 'react';
import { useDraft } from '@/hooks/useDraft';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ClipboardList, Plus, Trash2, Send, FileEdit, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Load, Shipper, Carrier } from '@/types';
import { equipmentTypeLabels } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CommodityLine {
  description: string;
  nmfc: string;
  class: string;
  packagingType: string;
  quantity: string;
  weight: string;
  hazmat: boolean;
}

interface BolBuilderProps {
  load: Load;
  shipper: Shipper | undefined;
  carrier: Carrier | null | undefined;
}

const emptyLine = (): CommodityLine => ({
  description: '', nmfc: '', class: '', packagingType: 'Pallets', quantity: '1', weight: '', hazmat: false,
});

const BolBuilder = ({ load, shipper, carrier }: BolBuilderProps) => {
  const [open, setOpen] = useState(false);

  const buildFields = () => ({
    bolNumber: `BOL-${load.loadNumber}`,
    date: new Date().toISOString().slice(0, 10),
    shipperName: shipper?.companyName || '',
    shipperAddress: shipper ? `${shipper.address}, ${shipper.city}, ${shipper.state} ${shipper.zip}` : '',
    consigneeName: '',
    consigneeAddress: load.destination,
    carrierName: carrier?.companyName || '',
    loadNumber: load.loadNumber,
    refNumber: load.referenceNumber,
    pickupDate: load.pickupDate,
    equipment: equipmentTypeLabels[load.equipmentType] || load.equipmentType,
    specialInstructions: load.notes || '',
  });

  const defaultFields = buildFields();
  const defaultCommodities: CommodityLine[] = [{ ...emptyLine(), weight: load.weight.toLocaleString() }];
  
  const { data: bolDraft, setData: setBolDraft, hasDraft, clearDraft } = useDraft({
    key: `bol:${load.id}`,
    defaultValue: { fields: defaultFields, commodities: defaultCommodities },
  });
  
  const fields = bolDraft.fields;
  const commodities = bolDraft.commodities;
  const setFields = (updater: React.SetStateAction<typeof defaultFields>) => {
    setBolDraft(prev => ({ ...prev, fields: typeof updater === 'function' ? updater(prev.fields) : updater }));
  };
  const setCommodities = (updater: React.SetStateAction<CommodityLine[]>) => {
    setBolDraft(prev => ({ ...prev, commodities: typeof updater === 'function' ? updater(prev.commodities) : updater }));
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && !hasDraft) {
      setBolDraft({ fields: buildFields(), commodities: [{ ...emptyLine(), weight: load.weight.toLocaleString() }] });
    }
    setOpen(isOpen);
  };

  const update = (key: string, value: string) => setFields(prev => ({ ...prev, [key]: value }));

  const updateCommodity = (idx: number, key: keyof CommodityLine, value: string | boolean) => {
    setCommodities(prev => prev.map((c, i) => i === idx ? { ...c, [key]: value } : c));
  };
  const addCommodity = () => setCommodities(prev => [...prev, emptyLine()]);
  const removeCommodity = (idx: number) => setCommodities(prev => prev.filter((_, i) => i !== idx));

  const exportPdf = () => {
    const commodityRows = commodities.map(c => `
      <tr>
        <td>${c.quantity}</td>
        <td>${c.packagingType}</td>
        <td>${c.description}</td>
        <td>${c.nmfc}</td>
        <td>${c.class}</td>
        <td>${c.weight}</td>
        <td>${c.hazmat ? '⚠ YES' : 'No'}</td>
      </tr>`).join('');

    const totalWeight = commodities.reduce((sum, c) => sum + (parseFloat(c.weight.replace(/,/g, '')) || 0), 0);

    const html = `<!DOCTYPE html>
<html><head><title>Bill of Lading - ${fields.bolNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 40px; }
  .header { text-align: center; border-bottom: 3px double #1a1a1a; padding-bottom: 10px; margin-bottom: 16px; }
  .header h1 { font-size: 22px; letter-spacing: 2px; margin-bottom: 2px; }
  .header h2 { font-size: 11px; font-weight: normal; color: #555; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px; }
  .meta strong { color: #1a365d; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 2px solid #1a1a1a; margin-bottom: 16px; }
  .grid-cell { padding: 10px; border: 1px solid #ccc; }
  .grid-cell .label { font-size: 9px; text-transform: uppercase; font-weight: bold; color: #555; margin-bottom: 4px; }
  .grid-cell .value { font-size: 12px; }
  table { width: 100%; border-collapse: collapse; border: 2px solid #1a1a1a; margin-bottom: 16px; }
  th { background: #e2e8f0; font-size: 9px; text-transform: uppercase; padding: 6px; border: 1px solid #ccc; text-align: left; }
  td { padding: 6px; border: 1px solid #ccc; font-size: 11px; }
  .total-row td { font-weight: bold; background: #f7fafc; }
  .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; background: #1a365d; color: white; padding: 4px 8px; margin-bottom: 8px; }
  .instructions { border: 1px solid #ccc; padding: 10px; min-height: 50px; margin-bottom: 20px; font-size: 11px; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; margin-top: 30px; }
  .sig-block .sig-line { border-top: 1px solid #333; padding-top: 4px; margin-top: 50px; font-size: 9px; color: #555; }
  .footer { text-align: center; font-size: 9px; color: #888; margin-top: 20px; border-top: 1px solid #ccc; padding-top: 8px; }
  @media print { body { padding: 20px; } }
</style></head><body>
  <div class="header">
    <h1>BILL OF LADING</h1>
    <h2>STRAIGHT — NON-NEGOTIABLE</h2>
  </div>
  <div class="meta">
    <div><strong>BOL #:</strong> ${fields.bolNumber}</div>
    <div><strong>Date:</strong> ${fields.date}</div>
    <div><strong>Load #:</strong> ${fields.loadNumber}</div>
    <div><strong>Ref #:</strong> ${fields.refNumber || '—'}</div>
  </div>
  <div class="grid">
    <div class="grid-cell">
      <div class="label">Ship From (Shipper)</div>
      <div class="value"><strong>${fields.shipperName}</strong><br/>${fields.shipperAddress}</div>
    </div>
    <div class="grid-cell">
      <div class="label">Ship To (Consignee)</div>
      <div class="value"><strong>${fields.consigneeName || '—'}</strong><br/>${fields.consigneeAddress}</div>
    </div>
    <div class="grid-cell">
      <div class="label">Carrier</div>
      <div class="value">${fields.carrierName}</div>
    </div>
    <div class="grid-cell">
      <div class="label">Pickup / Equipment</div>
      <div class="value">${fields.pickupDate} | ${fields.equipment}</div>
    </div>
  </div>
  <div class="section-title">Commodity Information</div>
  <table>
    <thead><tr><th>Qty</th><th>Packaging</th><th>Description</th><th>NMFC#</th><th>Class</th><th>Weight (lbs)</th><th>Hazmat</th></tr></thead>
    <tbody>
      ${commodityRows}
      <tr class="total-row"><td colspan="5" style="text-align:right">Total Weight:</td><td>${totalWeight.toLocaleString()}</td><td></td></tr>
    </tbody>
  </table>
  <div class="section-title">Special Instructions</div>
  <div class="instructions">${fields.specialInstructions || 'None'}</div>
  <div class="sig-grid">
    <div class="sig-block"><div class="sig-line">Shipper Signature / Date</div></div>
    <div class="sig-block"><div class="sig-line">Carrier Signature / Date</div></div>
    <div class="sig-block"><div class="sig-line">Consignee Signature / Date</div></div>
  </div>
  <div class="footer">This is a non-negotiable Bill of Lading subject to the terms and conditions of the NMFTA Uniform Straight Bill of Lading.</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ClipboardList className="h-4 w-4" />Generate BOL
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bill of Lading — {fields.bolNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div><Label>BOL Number</Label><Input value={fields.bolNumber} onChange={e => update('bolNumber', e.target.value)} /></div>
            <div><Label>Date</Label><Input type="date" value={fields.date} onChange={e => update('date', e.target.value)} /></div>
            <div><Label>Load Number</Label><Input value={fields.loadNumber} onChange={e => update('loadNumber', e.target.value)} /></div>
          </div>

          <h4 className="text-sm font-semibold text-muted-foreground pt-2">Ship From (Shipper)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Company</Label><Input value={fields.shipperName} onChange={e => update('shipperName', e.target.value)} /></div>
            <div><Label>Address</Label><Input value={fields.shipperAddress} onChange={e => update('shipperAddress', e.target.value)} /></div>
          </div>

          <h4 className="text-sm font-semibold text-muted-foreground pt-2">Ship To (Consignee)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Company</Label><Input value={fields.consigneeName} onChange={e => update('consigneeName', e.target.value)} /></div>
            <div><Label>Address</Label><Input value={fields.consigneeAddress} onChange={e => update('consigneeAddress', e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div><Label>Carrier</Label><Input value={fields.carrierName} onChange={e => update('carrierName', e.target.value)} /></div>
            <div><Label>Pickup Date</Label><Input type="date" value={fields.pickupDate} onChange={e => update('pickupDate', e.target.value)} /></div>
            <div><Label>Equipment</Label><Input value={fields.equipment} onChange={e => update('equipment', e.target.value)} /></div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Commodities</h4>
            <Button variant="outline" size="sm" onClick={addCommodity} className="gap-1"><Plus className="h-3 w-3" />Add Item</Button>
          </div>

          {commodities.map((c, idx) => (
            <div key={idx} className="border border-border rounded-md p-3 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
                {commodities.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCommodity(idx)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3"><Label>Description</Label><Input value={c.description} onChange={e => updateCommodity(idx, 'description', e.target.value)} placeholder="e.g. Dry goods, Electronics" /></div>
                <div><Label>NMFC#</Label><Input value={c.nmfc} onChange={e => updateCommodity(idx, 'nmfc', e.target.value)} /></div>
                <div><Label>Class</Label><Input value={c.class} onChange={e => updateCommodity(idx, 'class', e.target.value)} /></div>
                <div><Label>Packaging</Label><Input value={c.packagingType} onChange={e => updateCommodity(idx, 'packagingType', e.target.value)} /></div>
                <div><Label>Quantity</Label><Input value={c.quantity} onChange={e => updateCommodity(idx, 'quantity', e.target.value)} /></div>
                <div><Label>Weight (lbs)</Label><Input value={c.weight} onChange={e => updateCommodity(idx, 'weight', e.target.value)} /></div>
                <div className="flex items-center gap-2 pt-5">
                  <Checkbox checked={c.hazmat} onCheckedChange={v => updateCommodity(idx, 'hazmat', !!v)} id={`hazmat-${idx}`} />
                  <Label htmlFor={`hazmat-${idx}`} className="text-xs">Hazmat</Label>
                </div>
              </div>
            </div>
          ))}

          <div><Label>Special Instructions</Label><Textarea value={fields.specialInstructions} onChange={e => update('specialInstructions', e.target.value)} /></div>

          <div className="flex gap-2">
            <Button onClick={exportPdf} className="flex-1">Export PDF</Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              disabled={!carrier}
              onClick={async () => {
                if (!carrier || !load.carrierId) return;
                const docData = { ...fields, commodities } as any;
                const { error } = await supabase.from('carrier_documents').insert({
                  carrier_id: load.carrierId,
                  load_id: load.id,
                  type: 'bol',
                  document_data: docData,
                  status: 'pending',
                });
                if (error) {
                  toast({ title: 'Error', description: error.message, variant: 'destructive' });
                } else {
                  await supabase.functions.invoke('send-carrier-magic-link', {
                    body: { carrier_id: load.carrierId },
                  });
                  toast({ title: 'Sent to Carrier Portal', description: `BOL saved and magic link sent to ${carrier.email}` });
                  setOpen(false);
                }
              }}
            >
              <Send className="h-4 w-4" />Save & Send to Carrier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BolBuilder;
