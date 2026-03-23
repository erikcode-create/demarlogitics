import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { US_STATES, US_CITIES } from '@/constants/locations';

interface CityStateSelectProps {
  value: string;
  onChange: (val: string) => void;
  label: string;
}

export default function CityStateSelect({ value, onChange, label }: CityStateSelectProps) {
  const parsed = value ? value.split(', ') : ['', ''];
  const [selectedState, setSelectedState] = useState(parsed[1] || '');
  const [selectedCity, setSelectedCity] = useState(parsed[0] || '');
  const [cityOpen, setCityOpen] = useState(false);

  const cities = useMemo(() => US_CITIES[selectedState] || [], [selectedState]);

  const handleStateChange = (st: string) => {
    setSelectedState(st);
    setSelectedCity('');
    onChange('');
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setCityOpen(false);
    if (city && selectedState) {
      onChange(`${city}, ${selectedState}`);
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 mt-1">
        <Select value={selectedState || undefined} onValueChange={handleStateChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            {US_STATES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.value} — {s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={cityOpen}
              className="flex-1 justify-between font-normal"
              disabled={!selectedState}
            >
              {selectedCity || 'Select city...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search city..." />
              <CommandList>
                <CommandEmpty>No city found.</CommandEmpty>
                <CommandGroup>
                  {cities.map(city => (
                    <CommandItem key={city} value={city} onSelect={() => handleCityChange(city)}>
                      <Check className={cn('mr-2 h-4 w-4', selectedCity === city ? 'opacity-100' : 'opacity-0')} />
                      {city}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
