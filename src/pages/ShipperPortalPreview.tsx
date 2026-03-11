import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShipperPortalLayout } from '@/components/layout/ShipperPortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Truck, CheckCircle, Download, ArrowLeft } from 'lucide-react';

interface ShipperContract {
  id: string;
  title: string;
  type: string;
  status: string;
  terms: string;
  signed_by_name: string;
  signed_at: string;
  created_at: string;
  expires_at: string;
  entity_id: string;
}

interface ShipperLoad {
  id: string;
  load_number: string;
  origin: string;
  destination: string;
  pickup_date: string;
  delivery_date: string;
  equipment_type: string;
  weight: number;
  status: string;
  reference_number: string;
  pod_uploaded: boolean;
  shipper_rate: number;
  carrier_id: string | null;
}

const statusColors: Record<string, string> = {
  signed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  expired: 'bg-destructive/10 text-destructive',
};

const loadStatusColors: Record<string, string> = {
  available: 'bg-muted text-muted-foreground',
  booked: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_transit: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  invoiced: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const equipmentLabels: Record<string, string> = {
  dry_van: 'Dry Van', reefer: 'Reefer', flatbed: 'Flatbed',
  step_deck: 'Step Deck', conestoga: 'Conestoga', power_only: 'Power Only',
};

const loadStatusLabels: Record<string, string> = {
  available: 'Available', booked: 'Booked', in_transit: 'In Transit',
  delivered: 'Delivered', invoiced: 'Invoiced', paid: 'Paid',
};

const ShipperPortalPreview = () => {
  const { shipperId } = useParams<{ shipperId: string }>();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<ShipperContract[]>([]);
  const [loads, setLoads] = useState<ShipperLoad[]>([]);
  const [carriers, setCarriers] = useState<Map<string, string>>(new Map());
  const [shipperName, setShipperName] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('contracts');
  const [viewingContract, setViewingContract] = useState<ShipperContract | null>(null);

  useEffect(() => {
    if (!shipperId) return;

    const fetchData = async () => {
      const { data: shipper } = await supabase
        .from('shippers')
        .select('company_name')
        .eq('id', shipperId)
        .single();
      setShipperName(shipper?.company_name || 'Unknown Shipper');

      const { data: contractData } = await supabase
        .from('contracts')
        .select('*')
        .eq('entity_id', shipperId)
        .eq('entity_type', 'shipper')
        .order('created_at', { ascending: false });
      setContracts((contractData as ShipperContract[]) || []);

      const { data: loadData } = await supabase
        .from('loads')
        .select('id, load_number, origin, destination, pickup_date, delivery_date, equipment_type, weight, status, reference_number, pod_uploaded, shipper_rate, carrier_id')
        .eq('shipper_id', shipperId)
        .order('created_at', { ascending: false });
      setLoads((loadData as ShipperLoad[]) || []);

      const carrierIds = [...new Set((loadData || []).map((l: any) => l.carrier_id).filter(Boolean))];
      if (carrierIds.length > 0) {
        const { data: carrierData } = await supabase
          .from('carriers')
          .select('id, company_name')
          .in('id', carrierIds);
        const map = new Map<string, string>();
        (carrierData || []).forEach((c: any) => map.set(c.id, c.company_name));
        setCarriers(map);
      }

      setLoading(false);
    };

    fetchData();
  }, [shipperId]);

  const exportContractPdf = (contract: ShipperContract) => {
    const html = `<!DOCTYPE html><html><head><title>${contract.title}</title>
    <style>body{font-family:system-ui,sans-serif;padding:20mm;color:#111}@media print{body{padding:10mm}}</style></head>
    <body><h1>${contract.title}</h1>
    <p>Status: ${contract.status} | Created: ${new Date(contract.created_at).toLocaleDateString()}</p>
    <hr/><pre style="white-space:pre-wrap;font-family:inherit">${contract.terms}</pre>
    ${contract.status === 'signed' ? `<hr/><p><strong>Signed by:</strong> ${contract.signed_by_name} on ${new Date(contract.signed_at).toLocaleString()}</p>` : ''}
    </body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  };

  if (loading) {
    return (
      <ShipperPortalLayout shipperName={shipperName}>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading preview...</p>
        </div>
      </ShipperPortalLayout>
    );
  }

  return (
    <ShipperPortalLayout shipperName={shipperName}>
      <div className="mb-4">
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300">
          Preview Mode — This is what the shipper sees
        </Badge>
      </div>

      {viewingContract ? (
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setViewingContract(null)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Contracts
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">{viewingContract.title}</h2>
              <p className="text-sm text-muted-foreground">Created {new Date(viewingContract.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              {viewingContract.status === 'signed' && (
                <Button variant="outline" size="sm" onClick={() => exportContractPdf(viewingContract)} className="gap-1">
                  <Download className="h-4 w-4" /> Export PDF
                </Button>
              )}
              <Badge className={statusColors[viewingContract.status]}>
                {viewingContract.status === 'signed' ? 'Signed' : viewingContract.status === 'sent' ? 'Pending Signature' : viewingContract.status}
              </Badge>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Contract Terms</CardTitle></CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-lg text-foreground leading-relaxed max-h-[500px] overflow-y-auto">
                {viewingContract.terms}
              </pre>
            </CardContent>
          </Card>

          {viewingContract.status === 'signed' && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-green-600" /> Signature Details</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">Signed By</p><p className="font-medium text-foreground">{viewingContract.signed_by_name}</p></div>
                  <div><p className="text-sm text-muted-foreground">Signed At</p><p className="font-medium text-foreground">{new Date(viewingContract.signed_at).toLocaleString()}</p></div>
                </div>
              </CardContent>
            </Card>
          )}

          {(viewingContract.status === 'sent' || viewingContract.status === 'draft') && (
            <Card className="border-primary">
              <CardHeader><CardTitle className="text-sm">Sign This Contract</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">Signing is disabled in preview mode. The shipper would sign here.</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="contracts">Contracts ({contracts.length})</TabsTrigger>
              <TabsTrigger value="loads">Shipments ({loads.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="contracts" className="mt-4 space-y-3">
              {contracts.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">No contracts yet.</CardContent></Card>
              ) : (
                contracts.map((contract) => (
                  <Card key={contract.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setViewingContract(contract)}>
                    <CardContent className="py-4 flex items-center gap-4">
                      <FileText className="h-8 w-8 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{contract.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(contract.created_at).toLocaleDateString()}
                          {contract.expires_at && ` • Expires ${new Date(contract.expires_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Badge className={statusColors[contract.status]}>
                        {contract.status === 'signed' ? 'Signed' : contract.status === 'sent' ? 'Pending Signature' : contract.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="loads" className="mt-4 space-y-3">
              {loads.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">No shipments yet.</CardContent></Card>
              ) : (
                loads.map((load) => (
                  <Card key={load.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Truck className="h-5 w-5 text-primary shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">Load #{load.load_number}</p>
                            {load.reference_number && <p className="text-xs text-muted-foreground">Ref: {load.reference_number}</p>}
                          </div>
                        </div>
                        <Badge className={loadStatusColors[load.status] || 'bg-muted text-muted-foreground'}>
                          {loadStatusLabels[load.status] || load.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold">Route</p>
                          <p className="text-foreground">{load.origin} → {load.destination}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold">Dates</p>
                          <p className="text-foreground">{load.pickup_date} — {load.delivery_date}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold">Equipment / Weight</p>
                          <p className="text-foreground">{equipmentLabels[load.equipment_type] || load.equipment_type} • {load.weight.toLocaleString()} lbs</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold">Carrier</p>
                          <p className="text-foreground">{load.carrier_id ? carriers.get(load.carrier_id) || 'Assigned' : 'Pending'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        {load.pod_uploaded && (
                          <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3 w-3" /> POD Uploaded</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </ShipperPortalLayout>
  );
};

export default ShipperPortalPreview;
