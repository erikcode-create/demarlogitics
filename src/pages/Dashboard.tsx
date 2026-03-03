import { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Package, Clock, Plus, Building2, Truck, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { loadStatusLabels } from '@/data/mockData';
import { generateAlerts } from '@/utils/alertEngine';

const Dashboard = () => {
  const { loads, shippers, carriers, activities, followUps, contracts } = useAppContext();
  const navigate = useNavigate();
  const alerts = useMemo(() => generateAlerts(carriers, followUps, loads, contracts), [carriers, followUps, loads, contracts]);
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity === 'info').length;

  // Revenue metrics
  const totalRevenue = loads.filter(l => ['delivered', 'invoiced', 'paid'].includes(l.status)).reduce((sum, l) => sum + l.shipperRate, 0);
  const totalCost = loads.filter(l => ['delivered', 'invoiced', 'paid'].includes(l.status)).reduce((sum, l) => sum + l.carrierRate, 0);
  const totalMargin = totalRevenue - totalCost;
  const marginPct = totalRevenue > 0 ? ((totalMargin / totalRevenue) * 100).toFixed(1) : '0';
  const activeLoads = loads.filter(l => ['booked', 'in_transit'].includes(l.status)).length;

  // Load pipeline
  const statusCounts = ['available', 'booked', 'in_transit', 'delivered', 'invoiced', 'paid'].map(s => ({
    name: loadStatusLabels[s],
    count: loads.filter(l => l.status === s).length,
  }));

  // AR/AP
  const arTotal = loads.filter(l => l.status === 'invoiced').reduce((s, l) => s + l.invoiceAmount, 0);
  const apTotal = loads.filter(l => ['delivered', 'invoiced'].includes(l.status)).reduce((s, l) => s + l.carrierRate, 0);

  const pieColors = ['hsl(174, 60%, 45%)', 'hsl(199, 60%, 50%)', 'hsl(38, 92%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(270, 60%, 50%)', 'hsl(0, 63%, 50%)'];

  const recentActivities = [...activities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/loads')} size="sm"><Plus className="mr-1 h-4 w-4" />New Load</Button>
          <Button onClick={() => navigate('/shippers')} variant="outline" size="sm"><Building2 className="mr-1 h-4 w-4" />New Shipper</Button>
          <Button onClick={() => navigate('/carriers')} variant="outline" size="sm"><Truck className="mr-1 h-4 w-4" />New Carrier</Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Delivered + invoiced + paid loads</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMargin.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{marginPct}% average margin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Loads</CardTitle>
            <Package className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLoads}</div>
            <p className="text-xs text-muted-foreground">Booked + in transit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AR Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${arTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">AP: ${apTotal.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Load Pipeline</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusCounts}>
                <XAxis dataKey="name" tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 47%, 14%)', border: '1px solid hsl(217, 33%, 22%)', borderRadius: '8px', color: 'hsl(210, 40%, 98%)' }} />
                <Bar dataKey="count" fill="hsl(174, 60%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue by Status</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusCounts.filter(s => s.count > 0)} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {statusCounts.filter(s => s.count > 0).map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 47%, 14%)', border: '1px solid hsl(217, 33%, 22%)', borderRadius: '8px', color: 'hsl(210, 40%, 98%)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Summary + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/alerts')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <div className="flex gap-2 mt-2">
              {criticalCount > 0 && <Badge variant="destructive" className="text-[10px]">{criticalCount} Critical</Badge>}
              {warningCount > 0 && <Badge className="bg-warning text-warning-foreground text-[10px]">{warningCount} Warning</Badge>}
              {infoCount > 0 && <Badge variant="secondary" className="text-[10px]">{infoCount} Info</Badge>}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map(a => (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <Badge variant="outline" className="shrink-0 capitalize">{a.type}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{a.description}</p>
                    <p className="text-xs text-muted-foreground">{a.user} · {new Date(a.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
