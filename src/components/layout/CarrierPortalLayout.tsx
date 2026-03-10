import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface CarrierPortalLayoutProps {
  children: ReactNode;
  carrierName?: string;
}

export const CarrierPortalLayout = ({ children, carrierName }: CarrierPortalLayoutProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/portal');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/src/assets/demar-logo.png" alt="DeMar Transportation" className="h-8" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div>
              <h1 className="text-lg font-bold text-foreground">Carrier Portal</h1>
              {carrierName && <p className="text-xs text-muted-foreground">{carrierName}</p>}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 text-muted-foreground">
            <LogOut className="h-4 w-4" />Sign Out
          </Button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};
