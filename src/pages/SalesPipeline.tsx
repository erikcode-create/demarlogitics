import { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { salesStageLabels } from '@/data/mockData';
import { SalesStage } from '@/types';
import { Kanban } from 'lucide-react';

const pipelineStages: SalesStage[] = ['prospect', 'contacted', 'engaged', 'lane_discussed', 'quoting', 'contract_sent', 'active', 'dormant', 'closed_lost'];

const stageColors: Record<string, string> = {
  prospect: 'border-blue-500/30',
  contacted: 'border-cyan-500/30',
  engaged: 'border-primary/30',
  lane_discussed: 'border-warning/30',
  quoting: 'border-orange-500/30',
  contract_sent: 'border-purple-500/30',
  active: 'border-success/30',
  dormant: 'border-muted-foreground/30',
  closed_lost: 'border-destructive/30',
};

const SalesPipeline = () => {
  const { shippers, setShippers, logStageChange, outboundCalls } = useAppContext();
  const navigate = useNavigate();

  const shippersByStage = useMemo(() => {
    const map: Record<string, typeof shippers> = {};
    for (const stage of pipelineStages) {
      map[stage] = shippers.filter(s => s.salesStage === stage);
    }
    // Also include lead in prospect column
    map['prospect'] = [...shippers.filter(s => s.salesStage === 'lead'), ...map['prospect']];
    return map;
  }, [shippers]);

  const totalValue = useMemo(() => {
    return shippers.filter(s => s.salesStage === 'active').reduce((sum, s) => sum + (s.estimatedMonthlyLoads || 0), 0);
  }, [shippers]);

  const handleDrop = (shipperId: string, newStage: SalesStage) => {
    const shipper = shippers.find(s => s.id === shipperId);
    if (shipper && shipper.salesStage !== newStage) {
      logStageChange(shipperId, shipper.salesStage, newStage);
      setShippers(prev => prev.map(s => s.id === shipperId ? { ...s, salesStage: newStage } : s));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Kanban className="h-6 w-6 text-primary" />Sales Pipeline</h1>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Total prospects: <strong className="text-foreground">{shippers.length}</strong></span>
          <span>Active monthly loads: <strong className="text-foreground">{totalValue}</strong></span>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {pipelineStages.map(stage => {
          const stageShippers = shippersByStage[stage] || [];
          return (
            <div
              key={stage}
              className={`min-w-[240px] flex-shrink-0 rounded-lg border-2 ${stageColors[stage]} bg-card`}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                const id = e.dataTransfer.getData('shipperId');
                if (id) handleDrop(id, stage);
              }}
            >
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{salesStageLabels[stage] || stage}</h3>
                  <Badge variant="secondary" className="text-xs">{stageShippers.length}</Badge>
                </div>
              </div>
              <ScrollArea className="h-[500px]">
                <div className="p-2 space-y-2">
                  {stageShippers.map(s => {
                    const lastCall = outboundCalls.filter(c => c.shipperId === s.id).sort((a, b) => new Date(b.callDate).getTime() - new Date(a.callDate).getTime())[0];
                    return (
                      <div
                        key={s.id}
                        draggable
                        onDragStart={e => e.dataTransfer.setData('shipperId', s.id)}
                        onClick={() => navigate(`/shippers/${s.id}`)}
                        className="p-3 rounded-md bg-accent/30 border border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <p className="font-medium text-sm truncate">{s.companyName}</p>
                        <p className="text-xs text-muted-foreground">{s.city}, {s.state}</p>
                        {s.shippingManagerName && <p className="text-xs text-muted-foreground mt-1">{s.shippingManagerName}</p>}
                        <div className="flex items-center justify-between mt-2">
                          {s.estimatedMonthlyLoads ? <span className="text-xs text-primary">{s.estimatedMonthlyLoads} loads/mo</span> : <span />}
                          {lastCall && <span className="text-[10px] text-muted-foreground">{new Date(lastCall.callDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SalesPipeline;
