import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';
import { Load, Shipper, Carrier } from '@/types';
import { equipmentTypeLabels } from '@/data/mockData';

interface RateConBuilderProps {
  load: Load;
  shipper: Shipper | undefined;
  carrier: Carrier | null | undefined;
}

const RateConBuilder = ({ load, shipper, carrier }: RateConBuilderProps) => {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState(() => ({
    loadNumber: load.loadNumber,
    refNumber: load.referenceNumber,
    brokerName: 'DeMar Transportation',
    brokerAddress: '123 Broker Lane, Dallas, TX 75201',
    brokerPhone: '(555) 555-0100',
    brokerEmail: 'dispatch@demartransportation.com',
    shipperName: shipper?.companyName || '',
    shipperAddress: shipper ? `${shipper.address}, ${shipper.city}, ${shipper.state} ${shipper.zip}` : '',
    carrierName: carrier?.companyName || '',
    carrierMC: carrier?.mcNumber || '',
    carrierDOT: carrier?.dotNumber || '',
    origin: load.origin,
    destination: load.destination,
    pickupDate: load.pickupDate,
    deliveryDate: load.deliveryDate,
    equipment: equipmentTypeLabels[load.equipmentType] || load.equipmentType,
    weight: load.weight.toLocaleString(),
    carrierRate: load.carrierRate.toLocaleString(),
    paymentTerms: carrier?.factoringCompany
      ? `Pay to: ${carrier.factoringCompany} — ${carrier.factoringRemitTo}`
      : 'Payment within 30 days of receipt of signed POD and invoice. Pay direct to carrier.',
    specialInstructions: load.notes || '',
  }));

  const update = (key: string, value: string) => setFields(prev => ({ ...prev, [key]: value }));

  const exportPdf = () => {
    const html = `<!DOCTYPE html>
<html><head><title>Rate Confirmation - ${fields.loadNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 40px; }
  .header { text-align: center; border-bottom: 3px solid #1a365d; padding-bottom: 12px; margin-bottom: 20px; }
  .header h1 { font-size: 20px; color: #1a365d; margin-bottom: 4px; }
  .header p { font-size: 11px; color: #555; }
  .load-banner { background: #1a365d; color: white; padding: 8px 16px; font-size: 14px; font-weight: bold; margin-bottom: 16px; }
  .section { margin-bottom: 16px; }
  .section-title { font-size: 12px; font-weight: bold; color: #1a365d; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .field { margin-bottom: 6px; }
  .field-label { font-weight: bold; color: #555; font-size: 10px; text-transform: uppercase; }
  .field-value { font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
  th { background: #f0f0f0; font-size: 10px; text-transform: uppercase; }
  .rate-box { background: #f0fdf4; border: 2px solid #16a34a; padding: 12px; text-align: center; margin-top: 8px; }
  .rate-box .amount { font-size: 24px; font-weight: bold; color: #16a34a; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
  .sig-line { border-top: 1px solid #333; padding-top: 4px; margin-top: 40px; font-size: 10px; color: #555; }
  @media print { body { padding: 20px; } }
</style></head><body>
  <div class="header">
    <h1>${fields.brokerName}</h1>
    <p>${fields.brokerAddress} | ${fields.brokerPhone} | ${fields.brokerEmail}</p>
  </div>
  <div class="load-banner">RATE CONFIRMATION — Load #${fields.loadNumber}${fields.refNumber ? ` | Ref: ${fields.refNumber}` : ''}</div>
  <div class="grid">
    <div class="section">
      <div class="section-title">Shipper</div>
      <div class="field"><div class="field-value">${fields.shipperName}</div></div>
      <div class="field"><div class="field-value">${fields.shipperAddress}</div></div>
    </div>
    <div class="section">
      <div class="section-title">Carrier</div>
      <div class="field"><div class="field-value">${fields.carrierName}</div></div>
      <div class="field"><div class="field-label">MC#</div><div class="field-value">${fields.carrierMC}</div></div>
      <div class="field"><div class="field-label">DOT#</div><div class="field-value">${fields.carrierDOT}</div></div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Shipment Details</div>
    <table>
      <tr><th>Origin</th><th>Destination</th><th>Pickup</th><th>Delivery</th></tr>
      <tr><td>${fields.origin}</td><td>${fields.destination}</td><td>${fields.pickupDate}</td><td>${fields.deliveryDate}</td></tr>
    </table>
    <table style="margin-top:8px">
      <tr><th>Equipment</th><th>Weight</th></tr>
      <tr><td>${fields.equipment}</td><td>${fields.weight} lbs</td></tr>
    </table>
  </div>
  <div class="section">
    <div class="section-title">Rate</div>
    <div class="rate-box"><div class="amount">$${fields.carrierRate}</div><p style="font-size:10px;color:#555;margin-top:4px">All-inclusive (fuel surcharge included unless otherwise noted)</p></div>
  </div>
  <div class="section">
    <div class="section-title">Payment Terms</div>
    <p>${fields.paymentTerms}</p>
  </div>
  <div class="section">
    <div class="section-title">Special Instructions</div>
    <p>${fields.specialInstructions || 'None'}</p>
  </div>
  <p style="margin-top:16px;font-size:10px;color:#555;">By signing below, Carrier agrees to transport the above shipment under the terms of the existing Carrier-Broker Agreement and this Rate Confirmation.</p>
  <div class="sig-grid">
    <div><div class="sig-line">Broker Signature / Date</div></div>
    <div><div class="sig-line">Carrier Signature / Date</div></div>
  </div>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />Generate Rate Con
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate Confirmation — {fields.loadNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Load Number</Label><Input value={fields.loadNumber} onChange={e => update('loadNumber', e.target.value)} /></div>
            <div><Label>Reference Number</Label><Input value={fields.refNumber} onChange={e => update('refNumber', e.target.value)} /></div>
          </div>

          <h4 className="text-sm font-semibold text-muted-foreground pt-2">Broker</h4>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Company</Label><Input value={fields.brokerName} onChange={e => update('brokerName', e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={fields.brokerPhone} onChange={e => update('brokerPhone', e.target.value)} /></div>
          </div>

          <h4 className="text-sm font-semibold text-muted-foreground pt-2">Shipper</h4>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Company</Label><Input value={fields.shipperName} onChange={e => update('shipperName', e.target.value)} /></div>
            <div><Label>Address</Label><Input value={fields.shipperAddress} onChange={e => update('shipperAddress', e.target.value)} /></div>
          </div>

          <h4 className="text-sm font-semibold text-muted-foreground pt-2">Carrier</h4>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Company</Label><Input value={fields.carrierName} onChange={e => update('carrierName', e.target.value)} /></div>
            <div><Label>MC#</Label><Input value={fields.carrierMC} onChange={e => update('carrierMC', e.target.value)} /></div>
            <div><Label>DOT#</Label><Input value={fields.carrierDOT} onChange={e => update('carrierDOT', e.target.value)} /></div>
          </div>

          <h4 className="text-sm font-semibold text-muted-foreground pt-2">Shipment</h4>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Origin</Label><Input value={fields.origin} onChange={e => update('origin', e.target.value)} /></div>
            <div><Label>Destination</Label><Input value={fields.destination} onChange={e => update('destination', e.target.value)} /></div>
            <div><Label>Pickup Date</Label><Input type="date" value={fields.pickupDate} onChange={e => update('pickupDate', e.target.value)} /></div>
            <div><Label>Delivery Date</Label><Input type="date" value={fields.deliveryDate} onChange={e => update('deliveryDate', e.target.value)} /></div>
            <div><Label>Equipment</Label><Input value={fields.equipment} onChange={e => update('equipment', e.target.value)} /></div>
            <div><Label>Weight (lbs)</Label><Input value={fields.weight} onChange={e => update('weight', e.target.value)} /></div>
          </div>

          <h4 className="text-sm font-semibold text-muted-foreground pt-2">Rate & Payment</h4>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Carrier Rate ($)</Label><Input value={fields.carrierRate} onChange={e => update('carrierRate', e.target.value)} /></div>
          </div>
          <div><Label>Payment Terms</Label><Textarea value={fields.paymentTerms} onChange={e => update('paymentTerms', e.target.value)} /></div>
          <div><Label>Special Instructions</Label><Textarea value={fields.specialInstructions} onChange={e => update('specialInstructions', e.target.value)} /></div>

          <Button onClick={exportPdf} className="w-full">Export PDF</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RateConBuilder;
