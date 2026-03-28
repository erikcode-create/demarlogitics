import { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { SavedLocation } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, X, Search } from 'lucide-react';

interface LocationPickerProps {
  value: string | undefined;
  onSelect: (location: SavedLocation) => void;
  onClear: () => void;
  placeholder?: string;
}

export default function LocationPicker({ value, onSelect, onClear, placeholder = 'Pick saved location' }: LocationPickerProps) {
  const { locations } = useAppContext();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = locations.find(l => l.id === value);

  const filtered = useMemo(() => {
    if (!search.trim()) return locations;
    const q = search.toLowerCase();
    return locations.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.address.toLowerCase().includes(q) ||
      l.city.toLowerCase().includes(q)
    );
  }, [locations, search]);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <MapPin className="h-3 w-3" />
            {selected ? selected.name : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="start">
          <div className="relative mb-2">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search locations..."
              className="pl-7 h-8 text-xs"
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">No saved locations</p>
            )}
            {filtered.map(loc => (
              <button
                key={loc.id}
                className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-accent/50 flex items-center justify-between"
                onClick={() => { onSelect(loc); setOpen(false); setSearch(''); }}
              >
                <div>
                  <span className="font-medium">{loc.name}</span>
                  <span className="text-muted-foreground ml-1.5">{loc.city}{loc.state ? `, ${loc.state}` : ''}</span>
                </div>
                <Badge variant="outline" className="text-[10px] h-4 px-1">
                  {loc.geofenceType === 'polygon' ? 'poly' : 'circle'}
                </Badge>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {selected && (
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClear}>
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
