import { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList } from 'recharts';
import { Phone, MessageSquare, FileText, Users, Building2, Moon, TrendingUp, Activity } from 'lucide-react';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';
import { salesStageLabels } from '@/data/mockData';
import { SalesStage } from '@/types';

const pipelineOrder: SalesStage[] = ['prospect', 'contacted', 'engaged', 'lane_discussed', 'quoting', 'contract_sent', 'active'];

const SalesDashboard = () => {
  const { outboundCalls, shippers, salesTasks, stageChangeLogs, loads } = useAppContext();

  const metrics = useMemo(() => {
    const callsToday = outboundCalls.filter(c => isToday(new Date(c.callDate))).length;
    const conversationsToday = outboundCalls.filter(c => isToday(new Date(c.callDate)) && c.callOutcome.startsWith('spoke')).length;
    const quotesThisWeek = outboundCalls.filter(c => isThisWeek(new Date(c.callDate)) && c.callOutcome === 'spoke_quote_requested').length;
    const newProspectsMonth = shippers.filter(s => isThisMonth(new Date(s.createdAt)) && ['prospect', 'lead'].includes(s.salesStage)).length;
    const activeAccounts = shippers.filter(s => s.salesStage === 'active').length;
    const dormantAccounts = shippers.filter(s => s.salesStage === 'dormant').length;

    // Pipeline funnel
    const funnel = pipelineOrder.map((stage, i) => ({
      name: salesStageLabels[stage] || stage,
      value: shippers.filter(s => s.salesStage === stage || (stage === 'prospect' && s.salesStage === 'lead')).length,
      fill: `hsl(${174 + i * 25}, 60%, ${45 + i * 3}%)`,
    }));

    // Conversion rate
    const totalProspects = shippers.filter(s => ['prospect', 'lead'].includes(s.salesStage) || stageChangeLogs.some(l => l.shipperId === s.id)).length || 1;
    const conversionRate = ((activeAccounts / totalProspects) * 100).toFixed(1);

    // Calls by rep
    const repMap: Record<string, number> = {};
    outboundCalls.forEach(c => { repMap[c.assignedSalesRep] = (repMap[c.assignedSalesRep] || 0) + 1; });
    const callsByRep = Object.entries(repMap).map(([rep, count]) => ({ name: rep, count }));

    return { callsToday, conversationsToday, quotesThisWeek, newProspectsMonth, activeAccounts, dormantAccounts, funnel, conversionRate, callsByRep };
  }, [outboundCalls, shippers, stageChangeLogs]);

  const widgetCards = [
    { label: 'Calls Today', value: metrics.callsToday, icon: Phone, color: 'text-primary' },
    { label: 'Conversations', value: metrics.conversationsToday, icon: MessageSquare, color: 'text-success' },
    { label: 'Quotes This Week', value: metrics.quotesThisWeek, icon: FileText, color: 'text-warning' },
    { label: 'New Prospects', value: metrics.newProspectsMonth, icon: Users, color: 'text-blue-400' },
    { label: 'Active Accounts', value: metrics.activeAccounts, icon: Building2, color: 'text-success' },
    { label: 'Dormant', value: metrics.dormantAccounts, icon: Moon, color: 'text-muted-foreground' },
    { label: 'Conversion Rate', value: `${metrics.conversionRate}%`, icon: TrendingUp, color: 'text-primary' },
    { label: 'Total Calls', value: outboundCalls.length, icon: Activity, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sales Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {widgetCards.map(w => (
          <Card key={w.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{w.label}</CardTitle>
              <w.icon className={`h-4 w-4 ${w.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{w.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Pipeline Funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.funnel.map((stage, i) => (
                <div key={stage.name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-28 text-right">{stage.name}</span>
                  <div className="flex-1 bg-accent/30 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/60 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(((stage.value / (metrics.funnel[0]?.value || 1)) * 100), 5)}%` }}
                    >
                      <span className="text-xs font-medium">{stage.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Calls by Rep</CardTitle></CardHeader>
          <CardContent>
            {metrics.callsByRep.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={metrics.callsByRep}>
                  <XAxis dataKey="name" tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 47%, 14%)', border: '1px solid hsl(217, 33%, 22%)', borderRadius: '8px', color: 'hsl(210, 40%, 98%)' }} />
                  <Bar dataKey="count" fill="hsl(174, 60%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Log calls to see rep performance</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesDashboard;
