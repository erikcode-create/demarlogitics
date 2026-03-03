import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { contractTypeLabels, contractStatusLabels } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  signed: { icon: CheckCircle2, color: 'text-green-600' },
  draft: { icon: Clock, color: 'text-muted-foreground' },
  sent: { icon: Clock, color: 'text-blue-600' },
  expired: { icon: AlertTriangle, color: 'text-destructive' },
};

export default function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contracts, shippers, carriers } = useAppContext();

  const contract = contracts.find(c => c.id === id);
  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Contract not found.</p>
        <Button variant="link" onClick={() => navigate('/contracts')}>Back to Contracts</Button>
      </div>
    );
  }

  const entityName = contract.entityType === 'shipper'
    ? shippers.find(s => s.id === contract.entityId)?.companyName
    : carriers.find(c => c.id === contract.entityId)?.companyName;

  const { icon: StatusIcon, color } = statusConfig[contract.status] ?? statusConfig.draft;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/contracts')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Contracts
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{contract.title}</h1>
          <p className="text-muted-foreground mt-1">
            {contractTypeLabels[contract.type]} • <Link to={`/${contract.entityType === 'shipper' ? 'shippers' : 'carriers'}/${contract.entityId}`} className="text-primary hover:underline">{entityName}</Link>
          </p>
        </div>
        <Badge className={`${contract.status === 'signed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-muted text-muted-foreground'}`}>
          {contractStatusLabels[contract.status]}
        </Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Contract Terms</CardTitle></CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-lg text-foreground leading-relaxed max-h-[500px] overflow-y-auto">
            {contract.terms}
          </pre>
        </CardContent>
      </Card>

      {contract.status === 'signed' && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><StatusIcon className={`h-5 w-5 ${color}`} /> Signature Details</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Signed By</p>
                <p className="font-medium text-foreground">{contract.signedByName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Signed At</p>
                <p className="font-medium text-foreground">{new Date(contract.signedAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium text-foreground">{contract.createdAt}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expires</p>
                <p className="font-medium text-foreground">{contract.expiresAt}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {contract.loadId && (
        <Button variant="outline" asChild>
          <Link to={`/loads/${contract.loadId}`}>View Associated Load</Link>
        </Button>
      )}
    </div>
  );
}
