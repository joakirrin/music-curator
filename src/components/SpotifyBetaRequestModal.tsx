// src/components/SpotifyBetaRequestModal.tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Info, ExternalLink } from 'lucide-react';
import { spotifyAuth } from '@/services/spotifyAuth';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpotifyBetaRequestModal({ open, onOpenChange }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Send to backend (placeholder for now)
      await fetch('/api/beta-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          timestamp: new Date().toISOString(),
        }),
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit beta request:', error);
      alert('Failed to submit request. Please try again or email us directly at foneamusiccurator@gmail.com');
    } finally {
      setLoading(false);
    }
  }

  function handleDirectLogin() {
    onOpenChange(false);
    void spotifyAuth.login();
  }

  // Success state
  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Request Received! 🎉</h3>
            <p className="text-sm text-gray-400 mb-4">
              We'll add you to the Spotify beta within 24 hours.
              <br />
              You'll receive a confirmation email at <strong className="text-white">{email}</strong>
            </p>
            <Alert className="mb-4 bg-blue-950/30 border-blue-500 text-left">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>What's next?</strong>
                <br />
                Once approved, you'll receive an email. Then come back here and click "Sign in" to connect your Spotify account!
              </AlertDescription>
            </Alert>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Request form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Spotify Beta Access</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Alert className="bg-yellow-950/30 border-yellow-500">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Due to Spotify API restrictions, we're limited to 25 beta users. 
              Approval typically within 24 hours.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Spotify Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your-spotify-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
            <p className="text-xs text-gray-400 mt-1">
              ⚠️ Must match your Spotify account email exactly
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Submitting...' : 'Request Access'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>

        {/* Direct login link for approved users */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <button
            type="button"
            onClick={handleDirectLogin}
            className="w-full text-sm text-gray-400 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1.5 py-2"
          >
            Already approved? Sign in directly
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
