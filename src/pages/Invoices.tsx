import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, DollarSign, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { invoiceStatusLabels } from '@/data/mockData';
import { InvoiceStatus } from '@/types';
import { TableLoader } from '@/components/ui/page-loader';
import InvoiceBuilder from '@/components/invoices/InvoiceBuilder';

const statusColors: Record<InvoiceStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-500/20 text-blue-400',
  paid: 'bg-success/20 text-success',
  overdue: 'bg-destructive/20 text-destructive',
};

const Invoices = () => {
  const { invoices, shippers, loads, loading } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [builderOpen, setBuilderOpen] = useState(false);

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      const shipper = shippers.find(s => s.id === inv.shipperId);
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        shipper?.companyName.toLowerCase().includes(search.toLowerCase()) ||
        '';
      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, shippers, search, statusFilter]);

  const totals = useMemo(() => {
    const all = invoices;
    return {
      total: all.reduce((s, i) => s + i.amount, 0),
      outstanding: all.filter(i => ['draft', 'sent', 'overdue'].includes(i.status)).reduce((s, i) => s + i.amount, 0),
      paid: all.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
      overdue: all.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0),
    };
  }, [invoices]);

  if (loading) return <TableLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Button size="sm" onClick={() => setBuilderOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />New Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />Total Invoiced
            </div>
            <p className="text-xl font-bold">${totals.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />Outstanding
            </div>
            <p className="text-xl font-bold text-warning">${totals.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CheckCircle className="h-4 w-4" />Paid
            </div>
            <p className="text-xl font-bold text-success">${totals.paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4" />Overdue
            </div>
            <p className="text-xl font-bold text-destructive">${totals.overdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(invoiceStatusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Shipper</TableHead>
                <TableHead>Loads</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(inv => {
                const shipper = shippers.find(s => s.id === inv.shipperId);
                const loadCount = inv.loadIds.length;
                return (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  >
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-sm">{shipper?.companyName || '—'}</TableCell>
                    <TableCell className="text-sm">{loadCount} load{loadCount !== 1 ? 's' : ''}</TableCell>
                    <TableCell className="text-sm">{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm">{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[inv.status as InvoiceStatus] || statusColors.draft}>
                        {invoiceStatusLabels[inv.status as InvoiceStatus] || inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No invoices found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InvoiceBuilder open={builderOpen} onOpenChange={setBuilderOpen} />
    </div>
  );
};

export default Invoices;
