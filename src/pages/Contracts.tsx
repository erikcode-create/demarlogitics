import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Layers, Plus, Search, Trash2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { contractTypeLabels, contractStatusLabels } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ContractType } from '@/types';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  signed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  expired: 'bg-destructive/10 text-destructive',
};

export default function Contracts() {
  const { contracts, setContracts, shippers, carriers } = useAppContext();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  const deleteContract = (contractId: string) => {
    setContracts(prev => prev.filter(c => c.id !== contractId));
    toast.success('Contract deleted');
  };

  const filtered = useMemo(() => {
    let list = contracts;
    if (tab !== 'all') list = list.filter(c => c.type === tab);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q));
    }
    return list;
  }, [contracts, tab, search]);

  const getEntityName = (entityId: string, entityType: string) => {
    if (entityType === 'shipper') return shippers.find(s => s.id === entityId)?.companyName ?? 'Unknown';
    return carriers.find(c => c.id === entityId)?.companyName ?? 'Unknown';
  };

  const tabs: { value: string; label: string }[] = [
    { value: 'all', label: `All (${contracts.length})` },
    { value: 'shipper_agreement', label: `Shipper (${contracts.filter(c => c.type === 'shipper_agreement').length})` },
    { value: 'carrier_agreement', label: `Carrier (${contracts.filter(c => c.type === 'carrier_agreement').length})` },
    { value: 'rate_confirmation', label: `Rate Conf (${contracts.filter(c => c.type === 'rate_confirmation').length})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contracts</h1>
          <p className="text-muted-foreground">Manage agreements and rate confirmations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/contracts/bulk-create"><Layers className="mr-2 h-4 w-4" /> Bulk Create</Link>
          </Button>
          <Button asChild>
            <Link to="/contracts/new"><Plus className="mr-2 h-4 w-4" /> New Contract</Link>
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search contracts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {tabs.map(t => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {filtered.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No contracts found.</CardContent></Card>
          ) : (
            filtered.map(contract => (
              <div key={contract.id} className="flex items-center gap-2">
                <Link to={contract.status === 'draft' ? `/contracts/new?draft=${contract.id}` : `/contracts/${contract.id}`} className="flex-1">
                  <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                    <CardContent className="flex items-center justify-between py-4 px-5">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{contract.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {contractTypeLabels[contract.type]} • {getEntityName(contract.entityId, contract.entityType)} • Created {contract.createdAt}
                          </p>
                        </div>
                      </div>
                      <Badge className={statusColors[contract.status]}>{contractStatusLabels[contract.status]}</Badge>
                    </CardContent>
                  </Card>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Contract</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{contract.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteContract(contract.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
