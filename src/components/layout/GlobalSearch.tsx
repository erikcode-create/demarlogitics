import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Truck, Building2, Package, FileText, MapPin } from 'lucide-react';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { loads, shippers, carriers } = useAppContext();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search loads, shippers, carriers..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Loads">
          {loads.slice(0, 8).map((load) => (
            <CommandItem
              key={load.id}
              value={`${load.loadNumber} ${load.referenceNumber} ${load.origin} ${load.destination}`}
              onSelect={() => go(`/loads/${load.id}`)}
            >
              <Package className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-medium">{load.loadNumber}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {load.origin} → {load.destination}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Shippers">
          {shippers.slice(0, 8).map((shipper) => (
            <CommandItem
              key={shipper.id}
              value={`${shipper.companyName} ${shipper.email} ${shipper.city} ${shipper.state}`}
              onSelect={() => go(`/shippers/${shipper.id}`)}
            >
              <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-medium">{shipper.companyName}</span>
                <span className="text-xs text-muted-foreground">
                  {shipper.city}, {shipper.state}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Carriers">
          {carriers.slice(0, 8).map((carrier) => (
            <CommandItem
              key={carrier.id}
              value={`${carrier.companyName} ${carrier.mcNumber} ${carrier.dotNumber} ${carrier.city} ${carrier.state}`}
              onSelect={() => go(`/carriers/${carrier.id}`)}
            >
              <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-medium">{carrier.companyName}</span>
                <span className="text-xs text-muted-foreground">
                  MC# {carrier.mcNumber}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Navigation">
          <CommandItem value="dashboard" onSelect={() => go('/dashboard')}>
            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
            Dashboard
          </CommandItem>
          <CommandItem value="loads list" onSelect={() => go('/loads')}>
            <Package className="mr-2 h-4 w-4 text-muted-foreground" />
            All Loads
          </CommandItem>
          <CommandItem value="shippers list" onSelect={() => go('/shippers')}>
            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
            All Shippers
          </CommandItem>
          <CommandItem value="carriers list" onSelect={() => go('/carriers')}>
            <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
            All Carriers
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
