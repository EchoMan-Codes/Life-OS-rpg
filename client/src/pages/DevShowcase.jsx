import { useState } from 'react';
import { Shield, Key, LogIn, LogOut, RefreshCw, AlertTriangle } from 'lucide-react';

import { Button, Card, Badge, Modal } from '@/components/ui';
import { Sheet } from '@/components/layout';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { useAuth } from '@/features/auth/hooks';
import { setAccessToken } from '@/lib/axios';

/**
 * Development showcase page — displays all UI primitives, design tokens,
 * and the Phase 1.2 authentication test surface.
 */
export default function DevShowcase() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [refreshMessage, setRefreshMessage] = useState('');

  const { user, isAuthenticated, isLoading, logout, isLoggingOut } = useAuth();

  const attributes = [
    'strength',
    'intelligence',
    'vitality',
    'willpower',
    'perception',
  ];

  const handleSimulateRefresh = async () => {
    try {
      setRefreshMessage('Refreshing token...');
      const data = await refreshToken();
      setAccessToken(data.accessToken);
      setRefreshMessage(`Token rotated! New token: ${data.accessToken.slice(0, 18)}...`);
    } catch (err) {
      setRefreshMessage(`Refresh failed: ${err?.response?.data?.error?.code || err.message}`);
    }
  };

  const handleWipeInMemoryToken = () => {
    setAccessToken(null);
    setRefreshMessage('In-memory access token wiped! Click "Simulate Silent Refresh" to recover session.');
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-12">
      {/* Header — verifies display font */}
      <div>
        <h1 className="text-display-lg text-ink mb-2">Life OS</h1>
        <p className="text-body text-ink-muted">
          Design system & dual-token auth showcase — Phase 1.1 + Phase 1.2
        </p>
      </div>

      {/* ── Phase 1.2: Dual-Token Auth & Session Security ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-6 h-6 text-attr-perception" />
          <h2 className="text-display-sm text-ink">Authentication & Session Security</h2>
        </div>

        <Card variant="hud" className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-glass-border pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink">Current Session:</span>
                {isLoading ? (
                  <Badge color="xp">Checking session...</Badge>
                ) : isAuthenticated && user ? (
                  <Badge color="vitality">Authenticated</Badge>
                ) : (
                  <Badge color="willpower">Guest / Unauthenticated</Badge>
                )}
              </div>
              <p className="text-body-sm text-ink-muted mt-1">
                {isAuthenticated && user
                  ? `Signed in as ${user.displayName} (${user.email})`
                  : 'No active session. Open the auth modal to sign in or create an account.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {!isAuthenticated ? (
                <>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthModalOpen(true);
                    }}
                  >
                    <LogIn size={16} />
                    Sign In
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setAuthMode('register');
                      setAuthModalOpen(true);
                    }}
                  >
                    Register
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => logout()}
                  disabled={isLoggingOut}
                  className="text-attr-strength hover:text-attr-strength"
                >
                  <LogOut size={16} />
                  {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                </Button>
              )}
            </div>
          </div>

          {/* Session Diagnostic Tools */}
          <div className="space-y-3">
            <h3 className="text-body-medium text-ink flex items-center gap-2">
              <Key size={16} className="text-attr-intelligence" />
              Session & Token Diagnostic Controls
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" onClick={handleSimulateRefresh}>
                <RefreshCw size={14} />
                Simulate Silent Refresh
              </Button>
              <Button variant="ghost" onClick={handleWipeInMemoryToken}>
                <AlertTriangle size={14} className="text-xp" />
                Wipe In-Memory Token
              </Button>
            </div>
            {refreshMessage && (
              <p className="text-xs font-mono p-2.5 rounded-panel bg-white/5 border border-glass-border text-ink-muted">
                {refreshMessage}
              </p>
            )}
          </div>
        </Card>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authMode}
        />
      </section>

      {/* ── Attribute Glow Test Row ── */}
      <section>
        <h2 className="text-display-sm text-ink mb-4">Attribute Glows</h2>
        <div className="flex flex-wrap gap-3">
          {attributes.map((attr) => (
            <Button key={attr} variant="attr" attribute={attr}>
              {attr.charAt(0).toUpperCase() + attr.slice(1)}
            </Button>
          ))}
        </div>
      </section>

      {/* ── Button Variants ── */}
      <section>
        <h2 className="text-display-sm text-ink mb-4">Button Variants</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </section>

      {/* ── Cards ── */}
      <section>
        <h2 className="text-display-sm text-ink mb-4">Card Surfaces</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="text-body-medium text-ink mb-1">Default card</h3>
            <p className="text-body-sm text-ink-muted">
              Quiet glass surface for most UI elements.
            </p>
          </Card>
          <Card variant="hud" className="p-5">
            <h3 className="text-body-medium text-ink mb-1">HUD card</h3>
            <p className="text-body-sm text-ink-muted">
              Bold glass surface — the one deliberately loud panel.
            </p>
          </Card>
        </div>
      </section>

      {/* ── Badges ── */}
      <section>
        <h2 className="text-display-sm text-ink mb-4">Badges</h2>
        <div className="flex flex-wrap gap-2">
          {attributes.map((attr) => (
            <Badge key={attr} color={attr}>
              {attr}
            </Badge>
          ))}
          <Badge color="hp">HP</Badge>
          <Badge color="mana">Mana</Badge>
          <Badge color="xp">XP</Badge>
          <Badge color="gold">Gold</Badge>
          <Badge>Default</Badge>
        </div>
      </section>

      {/* ── Type Scale ── */}
      <section>
        <h2 className="text-display-sm text-ink mb-4">Type Scale</h2>
        <Card className="p-5 space-y-3">
          <p className="text-display-lg">Display Large (40px)</p>
          <p className="text-display-md">Display Medium (32px)</p>
          <p className="text-display-sm">Display Small (24px)</p>
          <p className="text-body-medium">Body Medium (16px/500)</p>
          <p className="text-body">Body Regular (16px/400)</p>
          <p className="text-body-sm text-ink-muted">
            Body Small (14px/400)
          </p>
          <p className="text-label">Label (14px/500, muted)</p>
        </Card>
      </section>

      {/* ── Overlays: Modal & Sheet ── */}
      <section>
        <h2 className="text-display-sm text-ink mb-4">Overlays (Modal & Sheet)</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Open Modal
          </Button>
          <Button variant="ghost" onClick={() => setSheetOpen(true)}>
            Open Bottom Sheet
          </Button>
        </div>

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
          <h3 className="text-display-sm text-ink mb-3">Modal Title</h3>
          <p className="text-body text-ink-muted mb-5">
            This modal uses the <code>modalPanel</code> animation variant —
            scale from 0.96 with backdrop fade.
          </p>
          <Button variant="primary" onClick={() => setModalOpen(false)}>
            Close
          </Button>
        </Modal>

        <Sheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)}>
          <h3 className="text-display-sm text-ink mb-3">Slide-up Sheet</h3>
          <p className="text-body text-ink-muted mb-5">
            Mobile secondary action sheet with Framer Motion drag-to-dismiss.
          </p>
          <Button variant="primary" onClick={() => setSheetOpen(false)}>
            Close Sheet
          </Button>
        </Sheet>
      </section>
    </div>
  );
}
