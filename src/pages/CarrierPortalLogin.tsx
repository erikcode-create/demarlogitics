import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Mail, CheckCircle } from 'lucide-react';

const CarrierPortalLogin = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/portal/documents`,
      },
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <img src="/src/assets/demar-logo.png" alt="DeMar Transportation" className="h-12 mx-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <h1 className="text-2xl font-bold text-foreground">Carrier Portal</h1>
          <p className="text-muted-foreground">Access your rate confirmations and bills of lading</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sign In</CardTitle>
            <CardDescription>Enter the email associated with your carrier account</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-3 py-4">
                <CheckCircle className="h-12 w-12 text-success mx-auto" />
                <h3 className="font-semibold text-foreground">Check your email</h3>
                <p className="text-sm text-muted-foreground">
                  We sent a magic link to <strong>{email}</strong>. Click the link in your email to sign in.
                </p>
                <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
                  Try a different email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSendMagicLink} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carrier@example.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  <Mail className="h-4 w-4" />
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CarrierPortalLogin;
