import { useState } from 'react';

import { Button, Card, Badge, Modal } from '@/components/ui';
import { Sheet } from '@/components/layout';

/**
 * Development showcase page — displays all UI primitives and design tokens.
 * Used to verify acceptance criteria:
 * - All 5 attr glow tokens visible on a test row
 * - Fonts rendering correctly
 * - Motion system working
 *
 * This page will be removed or hidden behind a dev route in production.
 */
export default function DevShowcase() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const attributes = [
    'strength',
    'intelligence',
    'vitality',
    'willpower',
    'perception',
  ];

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      {/* Header — verifies display font */}
      <div>
        <h1 className="text-display-lg text-ink mb-2">Life OS</h1>
        <p className="text-body text-ink-muted">
          Design system showcase — Phase 1.1
        </p>
      </div>

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
