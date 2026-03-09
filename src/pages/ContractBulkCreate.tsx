import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { generateRateConfirmation } from '@/utils/contractTemplates';
import { Contract } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Check, ChevronDown, FileText, Layers } from 'lucide-react';

type Step = 'select' | 'review' | 'sign';

export default function ContractBulkCreate() {
  const { loads, shippers, carriers, contracts, setContracts } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('select');
  const [selectedLoadIds, setSelectedLoadIds] = useState<Set<string>>(new Set());
  const [agreedToSign, setAgreedToSign] = useState(false);
  const [signerName, setSignerName] = useState('');

  // Loads eligible for rate confirmation (booked/in_transit, no existing rate conf)
  const existingLoadIds = useMemo(
    () => new Set(contracts.filter(c => c.type === 'rate_confirmation' && c.loadId).map(c => c.loadId!)),
    [contracts]
  );

  const eligibleLoads = useMemo(
    () => loads.filter(l => (l.status === 'booked' || l.status === 'in_transit') && l.carrierId && !existingLoadIds.has(l.id)),
    [loads, existingLoadIds]
  );

  const allSelected = eligibleLoads.length > 0 && selectedLoadIds.size === eligibleLoads.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedLoadIds(new Set());
    } else {
      setSelectedLoadIds(new Set(eligibleLoads.map(l => l.id)));
    }
  };

  const toggleLoad = (id: string) => {
    setSelectedLoadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectedLoads = eligibleLoads.filter(l => selectedLoadIds.has(l.id));

  const previews = useMemo(() => {
    return selectedLoads.map(load => {
      const shipper = shippers.find(s => s.id === load.shipperId)!;
      const carrier = carriers.find(c => c.id === load.carrierId)!;
      return {
        load,
        shipper,
        carrier,
        title: `Rate Confirmation — ${load.loadNumber}`,
        terms: generateRateConfirmation(load, shipper, carrier),
      };
    });
  }, [selectedLoads, shippers, carriers]);

  const handleSign = () => {
    if (!agreedToSign || !signerName.trim()) return;
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const signedAt = now.toISOString().split('T')[0];
    const expiresAtStr = expiresAt.toISOString().split('T')[0];
    const createdAt = signedAt;

    const newContracts: Contract[] = previews.map((p, index) => ({
      id: crypto.randomUUID(),
      type: 'rate_confirmation',
      status: 'signed',
      entityId: p.carrier.id,
      entityType: 'carrier',
      loadId: p.load.id,
      title: p.title,
      terms: p.terms,
      signedByName: signerName.trim(),
      signedAt,
      createdAt,
      expiresAt: expiresAtStr,
    }));

    setContracts(prev => [...prev, ...newContracts]);
    toast({
      title: 'Contracts Created',
      description: `${newContracts.length} rate confirmation(s) signed and saved.`,
    });
    navigate('/contracts');
  };

  const steps: { key: Step; label: string; num: number }[] = [
    { key: 'select', label: 'Select Loads', num: 1 },
    { key: 'review', label: 'Review', num: 2 },
    { key: 'sign', label: 'Sign All', num: 3 },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/contracts')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bulk Rate Confirmations</h1>
          <p className="text-muted-foreground">Generate rate confirmations for multiple loads at once</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${i <= currentStepIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              <span>{s.num}</span>
              <span>{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Loads */}
      {step === 'select' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" /> Select Loads
              </CardTitle>
              {eligibleLoads.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} id="select-all" />
                  <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">Select All ({eligibleLoads.length})</label>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {eligibleLoads.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">No eligible loads. All booked loads already have rate confirmations.</p>
            ) : (
              eligibleLoads.map(load => {
                const carrier = carriers.find(c => c.id === load.carrierId);
                return (
                  <div
                    key={load.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedLoadIds.has(load.id) ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'}`}
                    onClick={() => toggleLoad(load.id)}
                  >
                    <Checkbox checked={selectedLoadIds.has(load.id)} onCheckedChange={() => toggleLoad(load.id)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{load.loadNumber}</span>
                        <Badge variant="outline" className="text-xs">{load.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {load.origin} → {load.destination} • {carrier?.companyName ?? 'Unknown'} • ${load.carrierRate.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep('review')} disabled={selectedLoadIds.size === 0}>
                Review {selectedLoadIds.size > 0 && `(${selectedLoadIds.size})`} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Review */}
      {step === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Review Contracts ({previews.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {previews.map(p => (
              <Collapsible key={p.load.id}>
                <div className="border rounded-lg">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left hover:bg-accent/50 transition-colors rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{p.title}</p>
                      <p className="text-sm text-muted-foreground">{p.carrier.companyName} • ${p.load.carrierRate.toLocaleString()}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <pre className="p-4 text-xs text-muted-foreground whitespace-pre-wrap border-t bg-muted/30">{p.terms}</pre>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('select')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep('sign')}>
                Sign All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Sign */}
      {step === 'sign' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5" /> Sign All ({previews.length}) Rate Confirmations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              By signing, you confirm that all {previews.length} rate confirmation(s) are accurate and agree to their terms.
            </p>
            <div className="flex items-center gap-2">
              <Checkbox checked={agreedToSign} onCheckedChange={v => setAgreedToSign(v === true)} id="agree" />
              <label htmlFor="agree" className="text-sm text-foreground cursor-pointer">
                I agree to the terms of all {previews.length} rate confirmation(s)
              </label>
            </div>
            <Input
              placeholder="Full name (e-signature)"
              value={signerName}
              onChange={e => setSignerName(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep('review')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleSign} disabled={!agreedToSign || !signerName.trim()}>
                Sign & Create All <Check className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
