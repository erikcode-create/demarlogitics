import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, FileEdit, Download, Save } from 'lucide-react';

interface DocumentViewerProps {
  doc: {
    id: string;
    type: string;
    status: string;
    signed_by_name: string;
    signed_at: string | null;
    created_at: string;
    document_data: Record<string, any>;
    carrier_id: string;
    load_id: string;
  };
  carrierName?: string;
  editable?: boolean;
  onUpdated?: () => void;
}

const DocumentViewer = ({ doc, carrierName, editable = false, onUpdated }: DocumentViewerProps) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState<Record<string, any>>(doc.document_data);
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: string) => setFields(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('carrier_documents')
      .update({ document_data: fields as any })
      .eq('id', doc.id);
    if (error) {
      toast.error('Failed to save changes');
    } else {
      toast.success('Document updated');
      setEditing(false);
      onUpdated?.();
    }
    setSaving(false);
  };

  const exportPdf = () => {
    const d = fields;
    let html = '';
    if (doc.type === 'rate_con') {
      html = `<!DOCTYPE html><html><head><title>Rate Confirmation - ${d.loadNumber}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#1a1a1a;padding:40px}.header{text-align:center;border-bottom:3px solid #1a365d;padding-bottom:12px;margin-bottom:20px}.header h1{font-size:20px;color:#1a365d}.header p{font-size:11px;color:#555}.load-banner{background:#1a365d;color:white;padding:8px 16px;font-size:14px;font-weight:bold;margin-bottom:16px}.section{margin-bottom:16px}.section-title{font-size:12px;font-weight:bold;color:#1a365d;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:8px;text-transform:uppercase}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.field{margin-bottom:6px}.field-label{font-weight:bold;color:#555;font-size:10px;text-transform:uppercase}.field-value{font-size:12px}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}th{background:#f0f0f0;font-size:10px;text-transform:uppercase}.rate-box{background:#f0fdf4;border:2px solid #16a34a;padding:12px;text-align:center;margin-top:8px}.rate-box .amount{font-size:24px;font-weight:bold;color:#16a34a}.sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px}.sig-line{border-top:1px solid #333;padding-top:4px;margin-top:40px;font-size:10px;color:#555}@media print{body{padding:20px}}</style></head><body>
<div class="header"><h1>${d.brokerName || 'DeMar Transportation'}</h1><p>${d.brokerAddress || ''} | ${d.brokerPhone || ''} | ${d.brokerEmail || ''}</p></div>
<div class="load-banner">RATE CONFIRMATION — Load #${d.loadNumber}${d.refNumber ? ` | Ref: ${d.refNumber}` : ''}${d.orderNumber ? ` | Order #: ${d.orderNumber}` : ''}</div>
<div class="grid"><div class="section"><div class="section-title">Shipper</div><div class="field-value">${d.shipperName}</div><div class="field-value">${d.shipperAddress || ''}</div></div>
<div class="section"><div class="section-title">Carrier</div><div class="field-value">${d.carrierName}</div><div class="field"><div class="field-label">MC#</div><div class="field-value">${d.carrierMC || ''}</div></div><div class="field"><div class="field-label">DOT#</div><div class="field-value">${d.carrierDOT || ''}</div></div></div></div>
<div class="section"><div class="section-title">Shipment Details</div><table><tr><th>Origin</th><th>Destination</th><th>Pickup</th><th>Delivery</th></tr><tr><td>${d.origin}</td><td>${d.destination}</td><td>${d.pickupDate}</td><td>${d.deliveryDate}</td></tr></table><table style="margin-top:8px"><tr><th>Equipment</th><th>Weight</th></tr><tr><td>${d.equipment}</td><td>${d.weight} lbs</td></tr></table></div>
<div class="section"><div class="section-title">Rate</div><div class="rate-box"><div class="amount">$${d.carrierRate}</div><p style="font-size:10px;color:#555;margin-top:4px">All-inclusive</p></div></div>
<div class="section"><div class="section-title">Payment Terms</div><p>${d.paymentTerms || ''}</p></div>
<div class="section"><div class="section-title">Special Instructions</div><p>${d.specialInstructions || 'None'}</p></div>
${doc.status === 'signed' ? `<div style="margin-top:30px;padding:16px;border:2px solid #16a34a;border-radius:4px"><p style="font-weight:bold;color:#16a34a">✓ SIGNED by ${doc.signed_by_name} on ${new Date(doc.signed_at!).toLocaleString()}</p></div>` : `<div class="sig-grid"><div><div class="sig-line">Broker Signature / Date</div></div><div><div class="sig-line">Carrier Signature / Date</div></div></div>`}
</body></html>`;
    } else {
      const commodities = d.commodities || [];
      const commodityRows = commodities.map((c: any) => `<tr><td>${c.quantity}</td><td>${c.packagingType}</td><td>${c.description}</td><td>${c.nmfc}</td><td>${c.class}</td><td>${c.weight}</td><td>${c.hazmat ? '⚠ YES' : 'No'}</td></tr>`).join('');
      const totalWeight = commodities.reduce((s: number, c: any) => s + (parseFloat(String(c.weight).replace(/,/g, '')) || 0), 0);
      html = `<!DOCTYPE html><html><head><title>Bill of Lading - ${d.bolNumber}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#1a1a1a;padding:40px}.header{text-align:center;border-bottom:3px double #1a1a1a;padding-bottom:10px;margin-bottom:16px}.header h1{font-size:22px;letter-spacing:2px}.header h2{font-size:11px;font-weight:normal;color:#555}.meta{display:flex;justify-content:space-between;margin-bottom:16px;font-size:12px}.meta strong{color:#1a365d}.grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:2px solid #1a1a1a;margin-bottom:16px}.grid-cell{padding:10px;border:1px solid #ccc}.grid-cell .label{font-size:9px;text-transform:uppercase;font-weight:bold;color:#555;margin-bottom:4px}.grid-cell .value{font-size:12px}table{width:100%;border-collapse:collapse;border:2px solid #1a1a1a;margin-bottom:16px}th{background:#e2e8f0;font-size:9px;text-transform:uppercase;padding:6px;border:1px solid #ccc;text-align:left}td{padding:6px;border:1px solid #ccc;font-size:11px}.total-row td{font-weight:bold;background:#f7fafc}.section-title{font-size:11px;font-weight:bold;text-transform:uppercase;background:#1a365d;color:white;padding:4px 8px;margin-bottom:8px}.instructions{border:1px solid #ccc;padding:10px;min-height:50px;margin-bottom:20px}@media print{body{padding:20px}}</style></head><body>
<div class="header"><h1>BILL OF LADING</h1><h2>STRAIGHT — NON-NEGOTIABLE</h2></div>
<div class="meta"><div><strong>BOL #:</strong> ${d.bolNumber}</div><div><strong>Date:</strong> ${d.date}</div><div><strong>Load #:</strong> ${d.loadNumber}</div><div><strong>Ref #:</strong> ${d.refNumber || '—'}</div></div>
<div class="grid"><div class="grid-cell"><div class="label">Ship From</div><div class="value"><strong>${d.shipperName}</strong><br/>${d.shipperAddress || ''}</div></div><div class="grid-cell"><div class="label">Ship To</div><div class="value"><strong>${d.consigneeName || '—'}</strong><br/>${d.consigneeAddress || ''}</div></div><div class="grid-cell"><div class="label">Carrier</div><div class="value">${d.carrierName}</div></div><div class="grid-cell"><div class="label">Pickup / Equipment</div><div class="value">${d.pickupDate} | ${d.equipment}</div></div></div>
<div class="section-title">Commodity Information</div>
<table><thead><tr><th>Qty</th><th>Packaging</th><th>Description</th><th>NMFC#</th><th>Class</th><th>Weight (lbs)</th><th>Hazmat</th></tr></thead><tbody>${commodityRows}<tr class="total-row"><td colspan="5" style="text-align:right">Total Weight:</td><td>${totalWeight.toLocaleString()}</td><td></td></tr></tbody></table>
<div class="section-title">Special Instructions</div><div class="instructions">${d.specialInstructions || 'None'}</div>
</body></html>`;
    }
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  };

  const d = fields;

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => { setOpen(true); setFields(doc.document_data); setEditing(false); }} className="gap-1.5">
        <Eye className="h-3.5 w-3.5" />View
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {doc.type === 'rate_con' ? 'Rate Confirmation' : 'Bill of Lading'} — {d.loadNumber}
              <Badge variant={doc.status === 'signed' ? 'default' : 'outline'} className="ml-2">
                {doc.status === 'signed' ? 'Signed' : 'Pending'}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {editing ? (
            <div className="space-y-4">
              {doc.type === 'rate_con' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Load Number</Label><Input value={d.loadNumber || ''} onChange={e => update('loadNumber', e.target.value)} /></div>
                    <div><Label>Reference Number</Label><Input value={d.refNumber || ''} onChange={e => update('refNumber', e.target.value)} /></div>
                    <div><Label>Order Number</Label><Input value={d.orderNumber || ''} onChange={e => update('orderNumber', e.target.value)} /></div>
                  </div>
                  <h4 className="text-sm font-semibold text-muted-foreground">Broker</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Company</Label><Input value={d.brokerName || ''} onChange={e => update('brokerName', e.target.value)} /></div>
                    <div><Label>Phone</Label><Input value={d.brokerPhone || ''} onChange={e => update('brokerPhone', e.target.value)} /></div>
                  </div>
                  <h4 className="text-sm font-semibold text-muted-foreground">Shipper</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Company</Label><Input value={d.shipperName || ''} onChange={e => update('shipperName', e.target.value)} /></div>
                    <div><Label>Address</Label><Input value={d.shipperAddress || ''} onChange={e => update('shipperAddress', e.target.value)} /></div>
                  </div>
                  <h4 className="text-sm font-semibold text-muted-foreground">Carrier</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label>Company</Label><Input value={d.carrierName || ''} onChange={e => update('carrierName', e.target.value)} /></div>
                    <div><Label>MC#</Label><Input value={d.carrierMC || ''} onChange={e => update('carrierMC', e.target.value)} /></div>
                    <div><Label>DOT#</Label><Input value={d.carrierDOT || ''} onChange={e => update('carrierDOT', e.target.value)} /></div>
                  </div>
                  <h4 className="text-sm font-semibold text-muted-foreground">Shipment</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Origin</Label><Input value={d.origin || ''} onChange={e => update('origin', e.target.value)} /></div>
                    <div><Label>Destination</Label><Input value={d.destination || ''} onChange={e => update('destination', e.target.value)} /></div>
                    <div><Label>Pickup Date</Label><Input type="date" value={d.pickupDate || ''} onChange={e => update('pickupDate', e.target.value)} /></div>
                    <div><Label>Delivery Date</Label><Input type="date" value={d.deliveryDate || ''} onChange={e => update('deliveryDate', e.target.value)} /></div>
                    <div><Label>Equipment</Label><Input value={d.equipment || ''} onChange={e => update('equipment', e.target.value)} /></div>
                    <div><Label>Weight (lbs)</Label><Input value={d.weight || ''} onChange={e => update('weight', e.target.value)} /></div>
                  </div>
                  <h4 className="text-sm font-semibold text-muted-foreground">Rate & Payment</h4>
                  <div><Label>Carrier Rate ($)</Label><Input value={d.carrierRate || ''} onChange={e => update('carrierRate', e.target.value)} /></div>
                  <div><Label>Payment Terms</Label><Textarea value={d.paymentTerms || ''} onChange={e => update('paymentTerms', e.target.value)} /></div>
                  <div><Label>Special Instructions</Label><Textarea value={d.specialInstructions || ''} onChange={e => update('specialInstructions', e.target.value)} /></div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label>BOL Number</Label><Input value={d.bolNumber || ''} onChange={e => update('bolNumber', e.target.value)} /></div>
                    <div><Label>Date</Label><Input type="date" value={d.date || ''} onChange={e => update('date', e.target.value)} /></div>
                    <div><Label>Load Number</Label><Input value={d.loadNumber || ''} onChange={e => update('loadNumber', e.target.value)} /></div>
                  </div>
                  <h4 className="text-sm font-semibold text-muted-foreground">Ship From</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Company</Label><Input value={d.shipperName || ''} onChange={e => update('shipperName', e.target.value)} /></div>
                    <div><Label>Address</Label><Input value={d.shipperAddress || ''} onChange={e => update('shipperAddress', e.target.value)} /></div>
                  </div>
                  <h4 className="text-sm font-semibold text-muted-foreground">Ship To</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Company</Label><Input value={d.consigneeName || ''} onChange={e => update('consigneeName', e.target.value)} /></div>
                    <div><Label>Address</Label><Input value={d.consigneeAddress || ''} onChange={e => update('consigneeAddress', e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label>Carrier</Label><Input value={d.carrierName || ''} onChange={e => update('carrierName', e.target.value)} /></div>
                    <div><Label>Pickup Date</Label><Input type="date" value={d.pickupDate || ''} onChange={e => update('pickupDate', e.target.value)} /></div>
                    <div><Label>Equipment</Label><Input value={d.equipment || ''} onChange={e => update('equipment', e.target.value)} /></div>
                  </div>
                  <div><Label>Special Instructions</Label><Textarea value={d.specialInstructions || ''} onChange={e => update('specialInstructions', e.target.value)} /></div>
                </>
              )}
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                  <Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => { setEditing(false); setFields(doc.document_data); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {doc.type === 'rate_con' ? (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-muted-foreground text-xs uppercase font-semibold">Broker</p><p className="font-medium">{d.brokerName}</p><p className="text-muted-foreground">{d.brokerPhone} • {d.brokerEmail}</p></div>
                    <div><p className="text-muted-foreground text-xs uppercase font-semibold">Carrier</p><p className="font-medium">{d.carrierName}</p><p className="text-muted-foreground">MC# {d.carrierMC} • DOT# {d.carrierDOT}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-muted-foreground text-xs uppercase font-semibold">Shipper</p><p>{d.shipperName}</p><p className="text-muted-foreground">{d.shipperAddress}</p></div>
                    <div><p className="text-muted-foreground text-xs uppercase font-semibold">Route</p><p>{d.origin} → {d.destination}</p><p className="text-muted-foreground">{d.pickupDate} to {d.deliveryDate}</p></div>
                  </div>
                  {d.orderNumber && <div><p className="text-muted-foreground text-xs uppercase font-semibold">Order Number</p><p className="font-medium text-primary">{d.orderNumber}</p></div>}
                  <div className="grid grid-cols-3 gap-4">
                    <div><p className="text-muted-foreground text-xs uppercase font-semibold">Equipment</p><p>{d.equipment}</p></div>
                    <div><p className="text-muted-foreground text-xs uppercase font-semibold">Weight</p><p>{d.weight} lbs</p></div>
                    <div><p className="text-muted-foreground text-xs uppercase font-semibold">Carrier Rate</p><p className="text-xl font-bold text-success">${d.carrierRate}</p></div>
                  </div>
                  <div><p className="text-muted-foreground text-xs uppercase font-semibold">Payment Terms</p><p>{d.paymentTerms}</p></div>
                  {d.specialInstructions && <div><p className="text-muted-foreground text-xs uppercase font-semibold">Special Instructions</p><p>{d.specialInstructions}</p></div>}
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-3 gap-4">
                    <div><p className="text-muted-foreground text-xs uppercase font-semibold">BOL #</p><p className="font-medium">{d.bolNumber}</p></div>
                    <div><p className="text-muted-foreground text-xs uppercase font-semibold">Date</p><p>{d.date}</p></div>
                    <div><p className="text-muted-foreground text-xs uppercase font-semibold">Load #</p><p>{d.loadNumber}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-muted-foreground text-xs uppercase font-semibold">Ship From</p><p className="font-medium">{d.shipperName}</p><p className="text-muted-foreground">{d.shipperAddress}</p></div>
                    <div><p className="text-muted-foreground text-xs uppercase font-semibold">Ship To</p><p className="font-medium">{d.consigneeName || '—'}</p><p className="text-muted-foreground">{d.consigneeAddress}</p></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><p className="text-muted-foreground text-xs uppercase font-semibold">Carrier</p><p>{d.carrierName}</p></div>
                    <div><p className="text-muted-foreground text-xs uppercase font-semibold">Pickup</p><p>{d.pickupDate}</p></div>
                    <div><p className="text-muted-foreground text-xs uppercase font-semibold">Equipment</p><p>{d.equipment}</p></div>
                  </div>
                  {d.commodities?.length > 0 && (
                    <div>
                      <p className="text-muted-foreground text-xs uppercase font-semibold mb-2">Commodities</p>
                      <div className="border border-border rounded overflow-hidden">
                        <table className="w-full text-xs">
                          <thead><tr className="bg-muted"><th className="p-2 text-left">Qty</th><th className="p-2 text-left">Pkg</th><th className="p-2 text-left">Description</th><th className="p-2 text-left">Weight</th></tr></thead>
                          <tbody>
                            {d.commodities.map((c: any, i: number) => (
                              <tr key={i} className="border-t border-border"><td className="p-2">{c.quantity}</td><td className="p-2">{c.packagingType}</td><td className="p-2">{c.description}</td><td className="p-2">{c.weight} lbs</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {d.specialInstructions && <div><p className="text-muted-foreground text-xs uppercase font-semibold">Special Instructions</p><p>{d.specialInstructions}</p></div>}
                </div>
              )}

              {doc.status === 'signed' && (
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="py-3 flex items-center gap-2 text-sm">
                    <Badge className="bg-success/20 text-success border-0">Signed</Badge>
                    <span>by {doc.signed_by_name} on {new Date(doc.signed_at!).toLocaleString()}</span>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={exportPdf} className="gap-1.5">
                  <Download className="h-4 w-4" />Export PDF
                </Button>
                {editable && (
                  <Button variant="outline" onClick={() => setEditing(true)} className="gap-1.5">
                    <FileEdit className="h-4 w-4" />Edit / Amend
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentViewer;
