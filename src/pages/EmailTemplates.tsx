import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Mail, Copy, Eye, Pencil } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const EmailTemplates = () => {
  const { emailTemplates, setEmailTemplates, shippers } = useAppContext();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewShipperId, setPreviewShipperId] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', subject: '', body: '' });

  const renderTemplate = (template: string, shipperId: string) => {
    const shipper = shippers.find(s => s.id === shipperId);
    if (!shipper) return template;
    const region = shipper.notes.match(/Region:\s*([^|]+)/)?.[1]?.trim() || shipper.state;
    const equipment = shipper.notes.match(/Freight:\s*(.+)/)?.[1]?.trim() || 'Dry Van';
    return template
      .replace(/\{\{Contact_Name\}\}/g, shipper.shippingManagerName || 'there')
      .replace(/\{\{Company_Name\}\}/g, shipper.companyName)
      .replace(/\{\{Equipment_Type\}\}/g, equipment)
      .replace(/\{\{Region\}\}/g, region);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const startEdit = (id: string) => {
    const tpl = emailTemplates.find(t => t.id === id);
    if (tpl) {
      setEditForm({ name: tpl.name, subject: tpl.subject, body: tpl.body });
      setEditId(id);
    }
  };

  const saveEdit = () => {
    if (!editId) return;
    setEmailTemplates(prev => prev.map(t => t.id === editId ? { ...t, ...editForm } : t));
    setEditId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Mail className="h-6 w-6 text-primary" />Email Templates</h1>
        <Badge variant="secondary">{emailTemplates.length} templates</Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Variables: <code className="text-primary">{'{{Contact_Name}}'}</code>, <code className="text-primary">{'{{Company_Name}}'}</code>, <code className="text-primary">{'{{Equipment_Type}}'}</code>, <code className="text-primary">{'{{Region}}'}</code>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {emailTemplates.map(tpl => (
          <Card key={tpl.id}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-sm">{tpl.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Subject: {tpl.subject}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(tpl.id)}><Pencil className="h-3 w-3" /></Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setPreviewId(tpl.id)}><Eye className="h-3 w-3" /></Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Preview: {tpl.name}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <Select value={previewShipperId} onValueChange={setPreviewShipperId}>
                        <SelectTrigger><SelectValue placeholder="Select shipper for preview" /></SelectTrigger>
                        <SelectContent className="max-h-60">
                          {shippers.map(s => <SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {previewShipperId && (
                        <>
                          <div className="p-3 rounded-md bg-accent/30">
                            <p className="text-xs text-muted-foreground mb-1">Subject:</p>
                            <p className="text-sm font-medium">{renderTemplate(tpl.subject, previewShipperId)}</p>
                          </div>
                          <div className="p-3 rounded-md bg-accent/30 whitespace-pre-wrap text-sm">
                            {renderTemplate(tpl.body, previewShipperId)}
                          </div>
                          <Button onClick={() => copyToClipboard(renderTemplate(tpl.body, previewShipperId))} className="w-full"><Copy className="mr-1 h-4 w-4" />Copy to Clipboard</Button>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4">{tpl.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editId} onOpenChange={open => !open && setEditId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Template</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Subject</Label><Input value={editForm.subject} onChange={e => setEditForm(p => ({ ...p, subject: e.target.value }))} /></div>
            <div><Label>Body</Label><Textarea value={editForm.body} onChange={e => setEditForm(p => ({ ...p, body: e.target.value }))} className="min-h-[200px]" /></div>
            <Button onClick={saveEdit} className="w-full">Save Template</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailTemplates;
