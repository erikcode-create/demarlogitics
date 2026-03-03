import { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckSquare, Phone, Mail, Linkedin, AlertTriangle } from 'lucide-react';
import { isBefore, isToday, isAfter, startOfDay } from 'date-fns';

const typeIcons: Record<string, any> = { call: Phone, email: Mail, linkedin_reminder: Linkedin };

const SalesTasks = () => {
  const { salesTasks, setSalesTasks, shippers, triggerCadence } = useAppContext();
  const [tab, setTab] = useState('today');
  const [shipperFilter, setShipperFilter] = useState('all');

  const today = startOfDay(new Date());

  const toggleComplete = (taskId: string) => {
    setSalesTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : '' } : t));
  };

  const filtered = useMemo(() => {
    let tasks = salesTasks;
    if (shipperFilter !== 'all') tasks = tasks.filter(t => t.shipperId === shipperFilter);

    switch (tab) {
      case 'overdue': return tasks.filter(t => !t.completed && isBefore(new Date(t.dueDate), today));
      case 'today': return tasks.filter(t => !t.completed && isToday(new Date(t.dueDate)));
      case 'upcoming': return tasks.filter(t => !t.completed && isAfter(new Date(t.dueDate), today) && !isToday(new Date(t.dueDate)));
      case 'completed': return tasks.filter(t => t.completed);
      default: return tasks;
    }
  }, [salesTasks, tab, shipperFilter]);

  const overdueCount = salesTasks.filter(t => !t.completed && isBefore(new Date(t.dueDate), today)).length;

  // Find prospect shippers without cadence tasks
  const prospectsWithoutCadence = shippers.filter(s =>
    s.salesStage === 'prospect' && !salesTasks.some(t => t.shipperId === s.id && t.cadenceDay)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><CheckSquare className="h-6 w-6 text-primary" />Sales Tasks</h1>
        <div className="flex items-center gap-2">
          {overdueCount > 0 && <Badge variant="destructive">{overdueCount} overdue</Badge>}
          <Badge variant="secondary">{salesTasks.filter(t => !t.completed).length} open</Badge>
        </div>
      </div>

      {prospectsWithoutCadence.length > 0 && (
        <Card className="border-warning/50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm"><AlertTriangle className="inline h-4 w-4 text-warning mr-1" />{prospectsWithoutCadence.length} prospects without cadence tasks</p>
              <Button size="sm" variant="outline" onClick={() => prospectsWithoutCadence.forEach(s => triggerCadence(s.id))}>
                Generate All Cadence Tasks
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 items-center">
        <Tabs value={tab} onValueChange={setTab} className="flex-1">
          <TabsList>
            <TabsTrigger value="overdue">Overdue {overdueCount > 0 && `(${overdueCount})`}</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={shipperFilter} onValueChange={setShipperFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Shippers" /></SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="all">All Shippers</SelectItem>
            {shippers.map(s => <SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map(task => {
          const shipper = shippers.find(s => s.id === task.shipperId);
          const Icon = typeIcons[task.type] || CheckSquare;
          const isOverdue = !task.completed && isBefore(new Date(task.dueDate), today);
          return (
            <Card key={task.id} className={`${isOverdue ? 'border-destructive/50' : ''} ${task.completed ? 'opacity-60' : ''}`}>
              <CardContent className="py-3 flex items-center gap-3">
                <Checkbox checked={task.completed} onCheckedChange={() => toggleComplete(task.id)} />
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.completed ? 'line-through' : ''}`}>{task.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{shipper?.companyName} · {task.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xs ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                  {task.cadenceDay && <Badge variant="outline" className="text-[10px] mt-0.5">Day {task.cadenceDay}</Badge>}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No tasks in this view</p>}
      </div>
    </div>
  );
};

export default SalesTasks;
