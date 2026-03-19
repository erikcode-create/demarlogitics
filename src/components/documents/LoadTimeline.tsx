import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowRight, Upload, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LoadEvent {
  id: string;
  load_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  description: string | null;
  actor: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  booked: 'Booked',
  dispatched: 'Dispatched',
  rate_con_signed: 'Rate Con Signed',
  at_pickup: 'At Pickup',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  at_delivery: 'At Delivery',
  delivered: 'Delivered',
  pod_submitted: 'POD Submitted',
  invoiced: 'Invoiced',
  paid: 'Paid',
};

interface LoadTimelineProps {
  loadId: string;
}

export default function LoadTimeline({ loadId }: LoadTimelineProps) {
  const [events, setEvents] = useState<LoadEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('load_events')
      .select('*')
      .eq('load_id', loadId)
      .order('created_at', { ascending: false });
    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [loadId]);

  // Subscribe to realtime events
  useEffect(() => {
    const channel = supabase
      .channel(`load_events:${loadId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'load_events',
        filter: `load_id=eq.${loadId}`,
      }, (payload) => {
        setEvents(prev => [payload.new as LoadEvent, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadId]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'status_change': return <ArrowRight className="h-3.5 w-3.5" />;
      case 'document_uploaded': return <Upload className="h-3.5 w-3.5" />;
      case 'note': return <MessageSquare className="h-3.5 w-3.5" />;
      default: return <ArrowRight className="h-3.5 w-3.5" />;
    }
  };

  const getEventDescription = (event: LoadEvent) => {
    if (event.event_type === 'status_change' && event.from_status && event.to_status) {
      return `${STATUS_LABELS[event.from_status] || event.from_status} → ${STATUS_LABELS[event.to_status] || event.to_status}`;
    }
    return event.description || 'Event';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Timeline</CardTitle>
        <Button variant="ghost" size="icon" onClick={fetchEvents} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {events.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">No events recorded yet.</p>
        )}

        <div className="space-y-0">
          {events.map((event, i) => (
            <div key={event.id} className="flex gap-3">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  {getEventIcon(event.event_type)}
                </div>
                {i < events.length - 1 && <div className="w-px flex-1 bg-border" />}
              </div>

              {/* Content */}
              <div className="pb-4 flex-1">
                <p className="text-sm font-medium">{getEventDescription(event)}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                  {event.actor && (
                    <p className="text-xs text-muted-foreground">· {event.actor}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
