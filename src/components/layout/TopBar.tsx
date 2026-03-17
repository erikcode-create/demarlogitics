import { useState } from 'react';
import { Bell, LogOut, Search } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { GlobalSearch } from '@/components/layout/GlobalSearch';

export function TopBar() {
  const { user, signOut } = useAuth();
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'U';
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <GlobalSearch />
      <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <Button
            variant="outline"
            className="hidden md:flex w-80 justify-start text-muted-foreground gap-2 bg-background"
            onClick={() => {
              const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
              document.dispatchEvent(event);
            }}
          >
            <Search className="h-4 w-4" />
            <span>Search loads, shippers, carriers...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">3</span>
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
      </header>
    </>
  );
}
