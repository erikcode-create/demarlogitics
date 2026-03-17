import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDraft } from '@/hooks/useDraft';
import { ArrowLeft, ArrowRight, Check, FileEdit, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/context/AppContext';
import { ContractType, Contract } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { generateShipperAgreement, generateCarrierAgreement, generateRateConfirmation } from '@/utils/contractTemplates';

type Step = 'type' | 'entity' | 'review';

export default function ContractNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { shippers, carriers, loads, contracts, setContracts } = useAppContext();
  const { toast } = useToast();

  const defaultWizard = { step: 'type' as Step, contractType: '' as ContractType | '', entityId: '', loadId: '', signerName: '' };
  const { data: wizardDraft, setData: setWizardDraft, hasDraft: hasWizardDraft, clearDraft: clearWizardDraft } = useDraft({
    key: 'contract:new',
    defaultValue: defaultWizard,
  });

  const [step, setStepRaw] = useState<Step>(wizardDraft.step);
  const [contractType, setContractTypeRaw] = useState<ContractType | ''>(wizardDraft.contractType);
  const [entityId, setEntityIdRaw] = useState(wizardDraft.entityId);
  const [loadId, setLoadIdRaw] = useState(wizardDraft.loadId);
  const [agreed, setAgreed] = useState(false);
  const [signerName, setSignerNameRaw] = useState(wizardDraft.signerName);

  // Sync to draft
  const setStep = (s: Step) => { setStepRaw(s); setWizardDraft(p => ({ ...p, step: s })); };
  const setContractType = (t: ContractType | '') => { setContractTypeRaw(t); setWizardDraft(p => ({ ...p, contractType: t })); };
  const setEntityId = (id: string) => { setEntityIdRaw(id); setWizardDraft(p => ({ ...p, entityId: id })); };
  const setLoadId = (id: string) => { setLoadIdRaw(id); setWizardDraft(p => ({ ...p, loadId: id })); };
  const setSignerName = (name: string) => { setSignerNameRaw(name); setWizardDraft(p => ({ ...p, signerName: name })); };

  // Handle editing a draft
  const draftId = searchParams.get('draft');
  const draft = draftId ? contracts.find(c => c.id === draftId) : null;

  useState(() => {
    if (draft) {
      setContractType(draft.type);
      setEntityId(draft.entityId);
      if (draft.loadId) setLoadId(draft.loadId);
      setStep('review');
    }
  });

  const entityType = contractType === 'shipper_agreement' ? 'shipper' : 'carrier';
  const entities = contractType === 'shipper_agreement' ? shippers : carriers;
  const bookedLoads = useMemo(() =>
    loads.filter(l => l.carrierId && (l.status === 'booked' || l.status === 'in_transit')),
    [loads]
  );

  const generatedTerms = useMemo(() => {
    if (!contractType || !entityId) return '';
    if (contractType === 'shipper_agreement') {
      const shipper = shippers.find(s => s.id === entityId);
      return shipper ? generateShipperAgreement(shipper) : '';
    }
    if (contractType === 'carrier_agreement') {
      const carrier = carriers.find(c => c.id === entityId);
      return carrier ? generateCarrierAgreement(carrier) : '';
    }
    if (contractType === 'rate_confirmation' && loadId) {
      const load = loads.find(l => l.id === loadId);
      const shipper = load ? shippers.find(s => s.id === load.shipperId) : null;
      const carrier = load ? carriers.find(c => c.id === load.carrierId) : null;
      return load && shipper && carrier ? generateRateConfirmation(load, shipper, carrier) : '';
    }
    return '';
  }, [contractType, entityId, loadId, shippers, carriers, loads]);

  const entityName = useMemo(() => {
    if (entityType === 'shipper') return shippers.find(s => s.id === entityId)?.companyName ?? '';
    return carriers.find(c => c.id === entityId)?.companyName ?? '';
  }, [entityId, entityType, shippers, carriers]);

  const title = useMemo(() => {
    if (contractType === 'rate_confirmation') {
      const load = loads.find(l => l.id === loadId);
      return load ? `Rate Confirmation — ${load.loadNumber}` : '';
    }
    const typeLabel = contractType === 'shipper_agreement' ? 'Shipper Agreement' : 'Carrier Agreement';
    return entityName ? `${typeLabel} — ${entityName}` : '';
  }, [contractType, entityName, loadId, loads]);

  const canProceed = () => {
    if (step === 'type') return !!contractType;
    if (step === 'entity') {
      if (contractType === 'rate_confirmation') return !!loadId;
      return !!entityId;
    }
    return agreed && signerName.trim().length >= 2;
  };

  const handleNext = () => {
    if (step === 'type') setStep('entity');
    else if (step === 'entity') setStep('review');
  };

  const handleSign = () => {
    const newContract: Contract = {
      id: draft?.id ?? crypto.randomUUID(),
      type: contractType as ContractType,
      status: 'signed',
      entityId: contractType === 'rate_confirmation' ? (loads.find(l => l.id === loadId)?.carrierId ?? entityId) : entityId,
      entityType: entityType as 'shipper' | 'carrier',
      loadId: loadId || undefined,
      title,
      terms: generatedTerms,
      signedByName: signerName,
      signedAt: new Date().toISOString(),
      createdAt: draft?.createdAt ?? new Date().toISOString().split('T')[0],
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    };

    if (draft) {
      setContracts(prev => prev.map(c => c.id === draft.id ? newContract : c));
    } else {
      setContracts(prev => [...prev, newContract]);
    }

    clearWizardDraft();
    toast({ title: 'Contract signed', description: `${title} has been signed successfully.` });
    navigate(`/contracts/${newContract.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/contracts')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Contracts
        </Button>
        {hasWizardDraft && (
          <span className="inline-flex items-center gap-1">
            <Badge variant="outline" className="text-xs gap-1 border-warning text-warning">
              <FileEdit className="h-3 w-3" />Draft
            </Badge>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive gap-1" onClick={() => {
              clearWizardDraft();
              setStepRaw('type');
              setContractTypeRaw('');
              setEntityIdRaw('');
              setLoadIdRaw('');
              setSignerNameRaw('');
              setAgreed(false);
            }}>
              <X className="h-3 w-3" />Discard
            </Button>
          </span>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 text-sm">
        {(['type', 'entity', 'review'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
            <span className={step === s ? 'font-semibold text-primary' : 'text-muted-foreground'}>
              {s === 'type' ? '1. Type' : s === 'entity' ? '2. Entity' : '3. Review & Sign'}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Select Type */}
      {step === 'type' && (
        <Card>
          <CardHeader><CardTitle>Select Contract Type</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {([
              ['shipper_agreement', 'Shipper Agreement', 'Standard freight brokerage agreement with a shipper'],
              ['carrier_agreement', 'Carrier Agreement', 'Carrier-broker transportation agreement'],
              ['rate_confirmation', 'Rate Confirmation', 'Load-specific rate confirmation for a booked load'],
            ] as const).map(([value, label, desc]) => (
              <div
                key={value}
                onClick={() => setContractType(value)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  contractType === value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <p className="font-medium text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <Button onClick={handleNext} disabled={!canProceed()}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Entity */}
      {step === 'entity' && (
        <Card>
          <CardHeader><CardTitle>
            {contractType === 'rate_confirmation' ? 'Select Load' : `Select ${entityType === 'shipper' ? 'Shipper' : 'Carrier'}`}
          </CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {contractType === 'rate_confirmation' ? (
              <Select value={loadId} onValueChange={v => {
                setLoadId(v);
                const load = loads.find(l => l.id === v);
                if (load?.carrierId) setEntityId(load.carrierId);
              }}>
                <SelectTrigger><SelectValue placeholder="Select a booked load..." /></SelectTrigger>
                <SelectContent>
                  {bookedLoads.map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.loadNumber} — {l.origin} → {l.destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={entityId} onValueChange={setEntityId}>
                <SelectTrigger><SelectValue placeholder={`Select a ${entityType}...`} /></SelectTrigger>
                <SelectContent>
                  {entities.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('type')}>Back</Button>
              <Button onClick={handleNext} disabled={!canProceed()}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Sign */}
      {step === 'review' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-lg text-foreground leading-relaxed max-h-[400px] overflow-y-auto">
                {generatedTerms}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Electronic Signature</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox id="agree" checked={agreed} onCheckedChange={v => setAgreed(v === true)} />
                <Label htmlFor="agree" className="text-sm leading-relaxed cursor-pointer">
                  I have read and agree to the terms and conditions outlined in this contract. I understand that checking this box constitutes a legally binding electronic signature.
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signer">Full Legal Name</Label>
                <Input id="signer" placeholder="Type your full name..." value={signerName} onChange={e => setSignerName(e.target.value)} />
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('entity')}>Back</Button>
                <Button onClick={handleSign} disabled={!canProceed()} className="gap-2">
                  <Check className="h-4 w-4" /> Sign Contract
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
