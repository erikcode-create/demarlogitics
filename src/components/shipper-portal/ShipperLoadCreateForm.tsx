import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EQUIPMENT_TYPES } from '@/constants/locations';
import CityStateSelect from './CityStateSelect';

interface ShipperLoadCreateFormProps {
  shipperId: string;
  onSuccess: () => void;
}

async function generateUniqueLoadNumber(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const num = String(Math.floor(100000 + Math.random() * 900000));
    const { data } = await supabase
      .from('loads')
      .select('id')
      .eq('load_number', num)
      .maybeSingle();
    if (!data) return num;
  }
  throw new Error('Could not generate unique load number');
}

export default function ShipperLoadCreateForm({ shipperId, onSuccess }: ShipperLoadCreateFormProps) {
  const [equipmentType, setEquipmentType] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [weight, setWeight] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = equipmentType && origin && destination && pickupDate && deliveryDate && weight && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      const loadNumber = await generateUniqueLoadNumber();
      const refNumber = String(Math.floor(10000000 + Math.random() * 90000000));

      const { error } = await supabase.from('loads').insert({
        id: crypto.randomUUID(),
        load_number: loadNumber,
        reference_number: refNumber,
        shipper_id: shipperId,
        carrier_id: null,
        origin,
        destination,
        pickup_date: pickupDate,
        delivery_date: deliveryDate,
        shipper_rate: 0,
        carrier_rate: 0,
        weight: Number(weight),
        equipment_type: equipmentType,
        status: 'available',
        pod_uploaded: false,
        payment_status: 'pending',
        notes: '',
      });

      if (error) {
        toast.error('Failed to post load');
        console.error(error);
        return;
      }

      toast.success(`Load ${loadNumber} posted`);
      onSuccess();
    } catch (err) {
      toast.error('Failed to post load');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      <div>
        <Label>Equipment Type *</Label>
        <Select value={equipmentType || undefined} onValueChange={setEquipmentType}>
          <SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger>
          <SelectContent>
            {EQUIPMENT_TYPES.map(e => (
              <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CityStateSelect label="Origin *" value={origin} onChange={setOrigin} />
      <CityStateSelect label="Destination *" value={destination} onChange={setDestination} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Pickup Date *</Label>
          <Input type="date" min={today} value={pickupDate} onChange={e => setPickupDate(e.target.value)} />
        </div>
        <div>
          <Label>Delivery Date *</Label>
          <Input type="date" min={pickupDate || today} value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Weight (lbs) *</Label>
        <Input type="number" min={1} max={80000} placeholder="0" value={weight} onChange={e => setWeight(e.target.value)} />
      </div>

      <Button onClick={handleSubmit} className="w-full" disabled={!canSubmit}>
        {submitting ? 'Posting...' : 'Post Load'}
      </Button>
    </div>
  );
}
