import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import demarLogo from '@/assets/demar-logo.png';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes('type=invite') || hash.includes('type=signup'))) {
      navigate('/set-password' + hash, { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/sales/dashboard',
      },
    });

    if (error) {
      toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
    } else {
      setSent(true);
      toast({ title: 'Check your email', description: 'We sent you a magic link to sign in.' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center space-y-4">
          <img src={demarLogo} alt="Demar Logistics" className="h-20 mx-auto" />
          <CardTitle className="text-2xl text-foreground">Welcome Back</CardTitle>
          <CardDescription className="text-muted-foreground">
            {sent ? 'Check your email for the sign-in link' : 'Enter your email to sign in'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                We sent a magic link to <span className="font-medium text-foreground">{email}</span>
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSent(false)}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Magic Link'}
              </Button>
            </form>
          )}
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Access is invite-only. Contact your admin for an invite.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
