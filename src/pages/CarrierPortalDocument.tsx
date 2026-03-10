import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CarrierPortalLayout } from '@/components/layout/CarrierPortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Download, CheckCircle, AlertCircle } from 'lucide-react';

interface CarrierDocument {
  id: string;
  type: string;
  status: string;
  signed_by_name: string;
  signed_at: string | null;
  created_at: string;
  document_data: Record<string, any>;
  carrier_id: string;
  load_id: string;
}

const REQUIRED_DOC_TYPES = ['w9', 'workers_comp', 'certificate_of_insurance', 'mc_authority_letter', 'notice_of_assignment'];

const CarrierPortalDocument = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<CarrierDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [sigName, setSigName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      const { data } = await supabase
        .from('carrier_documents')
        .select('*')
        .eq('id', id)
        .single();

      const docData = data as CarrierDocument | null;
      setDoc(docData);

      if (docData) {
        // Check onboarding status
        const { data: onboardingDocs } = await supabase
          .from('carrier_onboarding_documents')
          .select('document_type')
          .eq('carrier_id', docData.carrier_id);

        const uploadedTypes = (onboardingDocs || []).map((d: any) => d.document_type);
        const complete = REQUIRED_DOC_TYPES.every(t => uploadedTypes.includes(t));
        setOnboardingComplete(complete);
      }
      setCheckingOnboarding(false);
      setLoading(false);
    };
    fetchDoc();
  }, [id]);

  const handleSign = async () => {
    if (!sigName.trim() || !agreed || !doc) return;
    setSigning(true);

    const { error } = await supabase
      .from('carrier_documents')
      .update({
        status: 'signed',
        signed_by_name: sigName.trim(),
        signed_at: new Date().toISOString(),
      })
      .eq('id', doc.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Document Signed', description: 'Rate confirmation has been signed successfully.' });
      setDoc(prev => prev ? { ...prev, status: 'signed', signed_by_name: sigName.trim(), signed_at: new Date().toISOString() } : null);
    }
    setSigning(false);
  };

  const exportPdf = () => {
    if (!doc) return;
    const d = doc.document_data;

    let html = '';
    if (doc.type === 'rate_con') {
      html = `<!DOCTYPE html><html><head><title>Rate Confirmation - ${d.loadNumber}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#1a1a1a;padding:40px}.header{text-align:center;border-bottom:3px solid #1a365d;padding-bottom:12px;margin-bottom:20px}.header h1{font-size:20px;color:#1a365d;margin-bottom:4px}.header p{font-size:11px;color:#555}.load-banner{background:#1a365d;color:white;padding:8px 16px;font-size:14px;font-weight:bold;margin-bottom:16px}.section{margin-bottom:16px}.section-title{font-size:12px;font-weight:bold;color:#1a365d;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:8px;text-transform:uppercase}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.field{margin-bottom:6px}.field-label{font-weight:bold;color:#555;font-size:10px;text-transform:uppercase}.field-value{font-size:12px}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}th{background:#f0f0f0;font-size:10px;text-transform:uppercase}.rate-box{background:#f0fdf4;border:2px solid #16a34a;padding:12px;text-align:center;margin-top:8px}.rate-box .amount{font-size:24px;font-weight:bold;color:#16a34a}.sig-section{margin-top:30px;padding:16px;border:2px solid #1a365d;border-radius:4px}@media print{body{padding:20px}}</style></head><body>
<div class="header"><h1>${d.brokerName || 'DeMar Transportation'}</h1><p>${d.brokerAddress || ''} | ${d.brokerPhone || ''} | ${d.brokerEmail || ''}</p></div>
<div class="load-banner">RATE CONFIRMATION — Load #${d.loadNumber}${d.refNumber ? ` | Ref: ${d.refNumber}` : ''}</div>
<div class="grid"><div class="section"><div class="section-title">Shipper</div><div class="field-value">${d.shipperName}</div><div class="field-value">${d.shipperAddress || ''}</div></div>
<div class="section"><div class="section-title">Carrier</div><div class="field-value">${d.carrierName}</div><div class="field"><div class="field-label">MC#</div><div class="field-value">${d.carrierMC || ''}</div></div><div class="field"><div class="field-label">DOT#</div><div class="field-value">${d.carrierDOT || ''}</div></div></div></div>
<div class="section"><div class="section-title">Shipment Details</div><table><tr><th>Origin</th><th>Destination</th><th>Pickup</th><th>Delivery</th></tr><tr><td>${d.origin}</td><td>${d.destination}</td><td>${d.pickupDate}</td><td>${d.deliveryDate}</td></tr></table>
<table style="margin-top:8px"><tr><th>Equipment</th><th>Weight</th></tr><tr><td>${d.equipment}</td><td>${d.weight} lbs</td></tr></table></div>
<div class="section"><div class="section-title">Rate</div><div class="rate-box"><div class="amount">$${d.carrierRate}</div><p style="font-size:10px;color:#555;margin-top:4px">All-inclusive</p></div></div>
<div class="section"><div class="section-title">Payment Terms</div><p>${d.paymentTerms || ''}</p></div>
<div class="section"><div class="section-title">Special Instructions</div><p>${d.specialInstructions || 'None'}</p></div>
${doc.status === 'signed' ? `<div class="sig-section"><p style="font-weight:bold;color:#16a34a">✓ SIGNED by ${doc.signed_by_name} on ${new Date(doc.signed_at!).toLocaleString()}</p></div>` : ''}
</body></html>`;
    } else {
      const commodities = d.commodities || [];
      const commodityRows = commodities.map((c: any) => `<tr><td>${c.quantity}</td><td>${c.packagingType}</td><td>${c.description}</td><td>${c.nmfc}</td><td>${c.class}</td><td>${c.weight}</td><td>${c.hazmat ? '⚠ YES' : 'No'}</td></tr>`).join('');
      const totalWeight = commodities.reduce((s: number, c: any) => s + (parseFloat(String(c.weight).replace(/,/g, '')) || 0), 0);

      html = `<!DOCTYPE html><html><head><title>Bill of Lading - ${d.bolNumber}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#1a1a1a;padding:40px}.header{text-align:center;border-bottom:3px double #1a1a1a;padding-bottom:10px;margin-bottom:16px}.header h1{font-size:22px;letter-spacing:2px;margin-bottom:2px}.header h2{font-size:11px;font-weight:normal;color:#555}.meta{display:flex;justify-content:space-between;margin-bottom:16px;font-size:12px}.meta strong{color:#1a365d}.grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:2px solid #1a1a1a;margin-bottom:16px}.grid-cell{padding:10px;border:1px solid #ccc}.grid-cell .label{font-size:9px;text-transform:uppercase;font-weight:bold;color:#555;margin-bottom:4px}.grid-cell .value{font-size:12px}table{width:100%;border-collapse:collapse;border:2px solid #1a1a1a;margin-bottom:16px}th{background:#e2e8f0;font-size:9px;text-transform:uppercase;padding:6px;border:1px solid #ccc;text-align:left}td{padding:6px;border:1px solid #ccc;font-size:11px}.total-row td{font-weight:bold;background:#f7fafc}.section-title{font-size:11px;font-weight:bold;text-transform:uppercase;background:#1a365d;color:white;padding:4px 8px;margin-bottom:8px}.instructions{border:1px solid #ccc;padding:10px;min-height:50px;margin-bottom:20px;font-size:11px}@media print{body{padding:20px}}</style></head><body>
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

  if (loading || checkingOnboarding) {
    return (
      <CarrierPortalLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </CarrierPortalLayout>
    );
  }

  if (!doc) {
    return (
      <CarrierPortalLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Document not found.</p>
          <Button variant="link" onClick={() => navigate('/portal/documents')}>Back to Documents</Button>
        </div>
      </CarrierPortalLayout>
    );
  }

  // Onboarding gate
  if (!onboardingComplete) {
    return (
      <CarrierPortalLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/portal/documents')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold text-foreground">Onboarding Required</h2>
          </div>
          <Card className="border-orange-300">
            <CardContent className="py-8 text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto" />
              <h3 className="text-lg font-semibold text-foreground">Complete Your Onboarding First</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You must upload all required documents (W-9, Workers Comp, Certificate of Insurance, MC Authority Letter, and Notice of Assignment) before you can view or sign rate confirmations.
              </p>
              <Button onClick={() => navigate('/portal/documents')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </CarrierPortalLayout>
    );
  }

  const d = doc.document_data;

  return (
    <CarrierPortalLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/portal/documents')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">
              {doc.type === 'rate_con' ? 'Rate Confirmation' : 'Bill of Lading'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Load #{d.loadNumber} • {d.origin} → {d.destination}
            </p>
          </div>
          <Badge variant={doc.status === 'signed' ? 'default' : 'outline'} className="text-sm">
            {doc.status === 'signed' ? 'Signed' : 'Pending Signature'}
          </Badge>
        </div>

        {/* Document Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Document Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {doc.type === 'rate_con' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase font-semibold">Broker</p>
                    <p className="font-medium">{d.brokerName}</p>
                    <p className="text-muted-foreground">{d.brokerPhone} • {d.brokerEmail}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase font-semibold">Carrier</p>
                    <p className="font-medium">{d.carrierName}</p>
                    <p className="text-muted-foreground">MC# {d.carrierMC} • DOT# {d.carrierDOT}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase font-semibold">Shipper</p>
                    <p>{d.shipperName}</p>
                    <p className="text-muted-foreground">{d.shipperAddress}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase font-semibold">Route</p>
                    <p>{d.origin} → {d.destination}</p>
                    <p className="text-muted-foreground">{d.pickupDate} to {d.deliveryDate}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><p className="text-muted-foreground text-xs uppercase font-semibold">Equipment</p><p>{d.equipment}</p></div>
                  <div><p className="text-muted-foreground text-xs uppercase font-semibold">Weight</p><p>{d.weight} lbs</p></div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase font-semibold">Carrier Rate</p>
                    <p className="text-xl font-bold text-success">${d.carrierRate}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-semibold">Payment Terms</p>
                  <p>{d.paymentTerms}</p>
                </div>
                {d.specialInstructions && (
                  <div>
                    <p className="text-muted-foreground text-xs uppercase font-semibold">Special Instructions</p>
                    <p>{d.specialInstructions}</p>
                  </div>
                )}
              </>
            ) : (
              <>
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
              </>
            )}
          </CardContent>
        </Card>

        {/* Signature Section */}
        {doc.type === 'rate_con' && doc.status === 'pending' && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-sm">Sign Rate Confirmation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                By signing below, you agree to transport the above shipment under the terms of the existing Carrier-Broker Agreement and this Rate Confirmation.
              </p>
              <div>
                <Label htmlFor="sig-name">Your Full Name</Label>
                <Input
                  id="sig-name"
                  value={sigName}
                  onChange={(e) => setSigName(e.target.value)}
                  placeholder="Enter your full legal name"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="agree"
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(!!v)}
                />
                <Label htmlFor="agree" className="text-sm">
                  I agree to the terms and conditions of this Rate Confirmation
                </Label>
              </div>
              <Button
                onClick={handleSign}
                disabled={!sigName.trim() || !agreed || signing}
                className="w-full"
              >
                {signing ? 'Signing...' : 'Sign Rate Confirmation'}
              </Button>
            </CardContent>
          </Card>
        )}

        {doc.status === 'signed' && (
          <Card className="border-success">
            <CardContent className="py-4 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-success" />
              <div>
                <p className="font-medium text-foreground">Signed by {doc.signed_by_name}</p>
                <p className="text-sm text-muted-foreground">{new Date(doc.signed_at!).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Button variant="outline" onClick={exportPdf} className="gap-2">
          <Download className="h-4 w-4" />Export PDF
        </Button>
      </div>
    </CarrierPortalLayout>
  );
};

export default CarrierPortalDocument;
