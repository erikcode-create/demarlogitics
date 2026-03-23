import { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, AlertTriangle } from 'lucide-react';
import { isToday, isThisWeek, isThisMonth, differenceInBusinessDays, startOfMonth } from 'date-fns';

const TARGETS = {
  dialsPerDay: 40,
  conversationsPerDay: 10,
  laneDiscussionsPerWeek: 5,
  newAccountsPerMonth: 1,
};

const PerformanceTracker = () => {
  const { outboundCalls, shippers, stageChangeLogs } = useAppContext();

  const repKPIs = useMemo(() => {
    const reps = [...new Set(outboundCalls.map(c => c.assignedSalesRep))];
    if (reps.length === 0) reps.push('Mike DeMar');

    return reps.map(rep => {
      const repCalls = outboundCalls.filter(c => c.assignedSalesRep === rep);
      const dialsToday = repCalls.filter(c => isToday(new Date(c.callDate))).length;
      const convsToday = repCalls.filter(c => isToday(new Date(c.callDate)) && c.callOutcome.startsWith('spoke')).length;
      const quotesWeek = repCalls.filter(c => isThisWeek(new Date(c.callDate)) && c.callOutcome === 'spoke_quote_requested').length;
      const laneDiscWeek = stageChangeLogs.filter(l => l.changedBy === rep && l.toStage === 'lane_discussed' && isThisWeek(new Date(l.changedAt))).length;
      const newAccountsMonth = stageChangeLogs.filter(l => l.changedBy === rep && l.toStage === 'active' && isThisMonth(new Date(l.changedAt))).length;

      const totalCalls = repCalls.length;
      const totalConvs = repCalls.filter(c => c.callOutcome.startsWith('spoke')).length;
      const conversionPct = totalCalls > 0 ? ((totalConvs / totalCalls) * 100).toFixed(1) : '0';

      return {
        rep,
        dialsToday,
        convsToday,
        quotesWeek,
        laneDiscWeek,
        newAccountsMonth,
        conversionPct,
        belowTarget: {
          dials: dialsToday < TARGETS.dialsPerDay,
          convs: convsToday < TARGETS.conversationsPerDay,
          lanes: laneDiscWeek < TARGETS.laneDiscussionsPerWeek,
          accounts: newAccountsMonth < TARGETS.newAccountsPerMonth,
        },
      };
    });
  }, [outboundCalls, stageChangeLogs]);

  const belowCount = repKPIs.reduce((sum, r) => sum + Object.values(r.belowTarget).filter(Boolean).length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" />Performance Tracker</h1>
        {belowCount > 0 && <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{belowCount} below target</Badge>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Target: Dials/Day</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{TARGETS.dialsPerDay}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Target: Convos/Day</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{TARGETS.conversationsPerDay}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Target: Lane Disc./Week</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{TARGETS.laneDiscussionsPerWeek}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Target: New Accts/Month</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{TARGETS.newAccountsPerMonth}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Rep Performance</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sales Rep</TableHead>
                <TableHead className="text-center">Dials Today</TableHead>
                <TableHead className="text-center">Convos Today</TableHead>
                <TableHead className="text-center">Quotes This Week</TableHead>
                <TableHead className="text-center">Lane Disc./Week</TableHead>
                <TableHead className="text-center">New Accts/Month</TableHead>
                <TableHead className="text-center">Conversion %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repKPIs.map(r => (
                <TableRow key={r.rep}>
                  <TableCell className="font-medium">{r.rep}</TableCell>
                  <TableCell className={`text-center font-bold ${r.belowTarget.dials ? 'text-destructive' : 'text-success'}`}>{r.dialsToday}</TableCell>
                  <TableCell className={`text-center font-bold ${r.belowTarget.convs ? 'text-destructive' : 'text-success'}`}>{r.convsToday}</TableCell>
                  <TableCell className="text-center font-bold">{r.quotesWeek}</TableCell>
                  <TableCell className={`text-center font-bold ${r.belowTarget.lanes ? 'text-destructive' : 'text-success'}`}>{r.laneDiscWeek}</TableCell>
                  <TableCell className={`text-center font-bold ${r.belowTarget.accounts ? 'text-destructive' : 'text-success'}`}>{r.newAccountsMonth}</TableCell>
                  <TableCell className="text-center">{r.conversionPct}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Minimum Standards</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 rounded-md bg-accent/30">
              <p className="text-muted-foreground">Dials/Day</p>
              <p className="font-bold text-lg">{TARGETS.dialsPerDay}</p>
            </div>
            <div className="p-3 rounded-md bg-accent/30">
              <p className="text-muted-foreground">Conversations/Day</p>
              <p className="font-bold text-lg">{TARGETS.conversationsPerDay}</p>
            </div>
            <div className="p-3 rounded-md bg-accent/30">
              <p className="text-muted-foreground">Lane Discussions/Week</p>
              <p className="font-bold text-lg">{TARGETS.laneDiscussionsPerWeek}</p>
            </div>
            <div className="p-3 rounded-md bg-accent/30">
              <p className="text-muted-foreground">New Accounts/Month</p>
              <p className="font-bold text-lg">{TARGETS.newAccountsPerMonth}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceTracker;
