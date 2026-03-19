import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Send, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DispatchButtonProps {
  loadId: string;
  loadNumber: string;
  currentStatus: string;
  onStatusChange: (status: string) => void;
}

export default function DispatchButton({ loadId, loadNumber, currentStatus, onStatusChange }: DispatchButtonProps) {
  const [open, setOpen] = useState(false);
  const [driverPhone, setDriverPhone] = useState('');
  const [driverName, setDriverName] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [copied, setCopied] = useState(false);

  // Only show for booked loads
  if (currentStatus !== 'booked') return null;

  const deepLink = driverPhone
    ? `demarlogistics://track?load_id=${loadId}&phone=${encodeURIComponent(driverPhone)}`
    : '';

  const handleDispatch = async () => {
    if (!driverPhone.trim()) {
      toast.error('Driver phone is required');
      return;
    }

    setDispatching(true);

    // Update load with driver info and status
    const { error } = await supabase
      .from('loads')
      .update({
        driver_phone: driverPhone.trim(),
        driver_name: driverName.trim() || null,
        status: 'dispatched',
        dispatched_at: new Date().toISOString(),
      })
      .eq('id', loadId);

    if (error) {
      toast.error('Failed to dispatch load');
      setDispatching(false);
      return;
    }

    // Log event
    await supabase.from('load_events').insert({
      load_id: loadId,
      event_type: 'status_change',
      from_status: 'booked',
      to_status: 'dispatched',
      description: `Dispatched to driver ${driverName || driverPhone}`,
      actor: 'broker',
    });

    onStatusChange('dispatched');
    setOpen(false);
    toast.success(`Load ${loadNumber} dispatched to ${driverName || driverPhone}`);
    setDispatching(false);
  };

  const copyLink = () => {
    if (deepLink) {
      navigator.clipboard.writeText(deepLink);
      setCopied(true);
      toast.success('Deep link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Send className="h-4 w-4" />
        Dispatch to Driver
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispatch Load {loadNumber}</DialogTitle>
            <DialogDescription>
              Enter the driver's phone number to dispatch this load and generate a tracking link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Driver Phone *</Label>
              <Input
                placeholder="+15551234567"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
              />
            </div>
            <div>
              <Label>Driver Name</Label>
              <Input
                placeholder="John Smith"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
              />
            </div>

            {deepLink && (
              <div>
                <Label>Driver Deep Link</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={deepLink} readOnly className="text-xs font-mono" />
                  <Button variant="outline" size="icon" onClick={copyLink} className="shrink-0">
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Send this link to the driver to open the load in the DeMar Driver app.</p>
              </div>
            )}

            <Button onClick={handleDispatch} className="w-full" disabled={!driverPhone.trim() || dispatching}>
              {dispatching ? 'Dispatching...' : 'Dispatch Load'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
