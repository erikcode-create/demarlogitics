import { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { generateAlerts, Alert, AlertType } from '@/utils/alertEngine';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, ShieldAlert, FileWarning, CalendarClock, DollarSign, FileText, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const tabConfig: { value: AlertType | 'all'; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All', icon: AlertTriangle },
  { value: 'insurance', label: 'Insurance', icon: ShieldAlert },
  { value: 'documents', label: 'Documents', icon: FileWarning },
  { value: 'followup', label: 'Follow-ups', icon: CalendarClock },
  { value: 'ar_aging', label: 'AR Aging', icon: DollarSign },
  { value: 'contract_expiry', label: 'Contracts', icon: FileText },
];

const severityStyles: Record<string, string> = {
  critical: 'border-l-4 border-l-destructive bg-destructive/5',
  warning: 'border-l-4 border-l-warning bg-warning/5',
  info: 'border-l-4 border-l-primary bg-primary/5',
};

const severityBadge: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  warning: 'bg-warning text-warning-foreground',
  info: 'bg-primary text-primary-foreground',
};

const Alerts = () => {
  const { carriers, followUps, loads, contracts } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AlertType | 'all'>('all');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const allAlerts = useMemo(() => generateAlerts(carriers, followUps, loads, contracts), [carriers, followUps, loads, contracts]);

  const activeAlerts = allAlerts.filter(a => !dismissed.has(a.id));
  const filtered = activeTab === 'all' ? activeAlerts : activeAlerts.filter(a => a.type === activeTab);

  const countByTab = (type: AlertType | 'all') => {
    if (type === 'all') return activeAlerts.length;
    return activeAlerts.filter(a => a.type === type).length;
  };

  const handleDismiss = (id: string) => setDismissed(prev => new Set(prev).add(id));

  const handleNavigate = (alert: Alert) => {
    const path = alert.entityType === 'carrier' ? `/carriers/${alert.entityId}`
      : alert.entityType === 'shipper' ? `/shippers/${alert.entityId}`
      : alert.entityType === 'contract' ? `/contracts/${alert.entityId}`
      : `/loads/${alert.entityId}`;
    navigate(path);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Alerts</h1>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AlertType | 'all')}>
        <TabsList className="bg-muted/50">
          {tabConfig.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {countByTab(tab.value) > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px]">
                  {countByTab(tab.value)}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No alerts in this category.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => (
            <Card key={alert.id} className={severityStyles[alert.severity]}>
              <CardContent className="flex items-start gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={severityBadge[alert.severity] + ' text-[10px] uppercase tracking-wider'}>
                      {alert.severity}
                    </Badge>
                    <span className="font-semibold text-sm">{alert.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.date}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleNavigate(alert)}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleDismiss(alert.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
