import { useState } from 'react';
import {
  Button,
  Card,
  Badge,
  Progress,
  Tabs,
  Checkbox,
  Toggle,
  Avatar,
  Input,
} from '@/components/ui';
import { Sparkles, Swords, Shield, Heart, Zap, Award } from 'lucide-react';

export default function TokenGalleryPage() {
  const [activeTab, setActiveTab] = useState('primitives');
  const [checkboxState, setCheckboxState] = useState(true);
  const [toggleState, setToggleState] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const galleryTabs = [
    { id: 'primitives', label: 'Core Primitives' },
    { id: 'colors', label: 'Color Token System' },
    { id: 'typography', label: 'Typography Scale' },
    { id: 'elevation', label: 'Elevation & Shadows' },
    { id: 'materials', label: 'The 4 Materials' },
  ];

  return (
    <div className="min-h-screen bg-obsidian text-ink p-6 md:p-10 safe-top safe-bottom max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <div className="border-b border-glass-border pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-control bg-accent-primary/20 border border-accent-primary/40 flex items-center justify-center text-accent-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-display-md text-ink">LifeOS Token Gallery</h1>
            <p className="text-body-sm text-ink-muted">
              Dev-only verification surface for Design System Tokens, Materials, and Primitives.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <Tabs tabs={galleryTabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      {/* ── 1. PRIMITIVES ── */}
      {activeTab === 'primitives' && (
        <div className="space-y-12">
          {/* Buttons */}
          <section className="space-y-4">
            <h2 className="text-display-xs text-ink">Button Primitives (44px Minimum Hit Area)</h2>
            <div className="p-6 rounded-card bg-obsidian-900 border border-glass-border space-y-6">
              <div>
                <h3 className="text-caption font-semibold mb-3 text-ink-muted">Variants</h3>
                <div className="flex flex-wrap gap-3 items-center">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="glass">Glass</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="success">Success</Button>
                  <Button variant="attr" attribute="strength">Strength</Button>
                  <Button variant="attr" attribute="intelligence">Intelligence</Button>
                  <Button variant="attr" attribute="vitality">Vitality</Button>
                  <Button variant="attr" attribute="willpower">Willpower</Button>
                  <Button variant="attr" attribute="perception">Perception</Button>
                </div>
              </div>

              <div>
                <h3 className="text-caption font-semibold mb-3 text-ink-muted">Sizes & States</h3>
                <div className="flex flex-wrap gap-3 items-center">
                  <Button size="xs">Size XS (32px visual, 44px tap)</Button>
                  <Button size="sm">Size SM (38px visual, 44px tap)</Button>
                  <Button size="md">Size MD (44px touch-target)</Button>
                  <Button size="lg">Size LG (48px touch-target)</Button>
                  <Button
                    loading={buttonLoading}
                    onClick={() => {
                      setButtonLoading(true);
                      setTimeout(() => setButtonLoading(false), 2000);
                    }}
                  >
                    Click to Test Loading
                  </Button>
                  <Button disabled>Disabled</Button>
                </div>
              </div>
            </div>
          </section>

          {/* Cards 9-Tier */}
          <section className="space-y-4">
            <h2 className="text-display-xs text-ink">Card Hierarchy (9 Formal Tiers)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card variant="surface">
                <h4 className="text-card-title text-ink">1. Surface (Default)</h4>
                <p className="text-body-xs text-ink-muted mt-1">Standard quiet UI container.</p>
              </Card>

              <Card variant="interactive" onClick={() => alert('Card clicked!')}>
                <h4 className="text-card-title text-ink">2. Interactive (Clickable)</h4>
                <p className="text-body-xs text-ink-muted mt-1">Tactile press + hover feedback.</p>
              </Card>

              <Card variant="elevated">
                <h4 className="text-card-title text-ink">3. Elevated</h4>
                <p className="text-body-xs text-ink-muted mt-1">Layered depth with ambient shadow.</p>
              </Card>

              <Card variant="featured">
                <h4 className="text-card-title text-ink">4. Featured Hero</h4>
                <p className="text-body-xs text-ink-muted mt-1">Subtle accent lighting border.</p>
              </Card>

              <Card variant="immersive">
                <h4 className="text-card-title text-ink">5. Immersive HUD Glass</h4>
                <p className="text-body-xs text-ink-muted mt-1">High-blur glassmorphic surface.</p>
              </Card>

              <Card variant="compact">
                <h4 className="text-caption font-semibold text-ink">6. Compact Tile</h4>
                <p className="text-metadata text-ink-muted">Dense grid cell.</p>
              </Card>

              <Card variant="stat">
                <span className="text-stat-label">7. Stat Metric</span>
                <span className="text-stat-value text-xl text-gold">1,450 XP</span>
              </Card>

              <div className="col-span-1 md:col-span-2">
                <Card variant="listRow">
                  <div className="flex items-center gap-2">
                    <Swords className="w-4 h-4 text-gold" />
                    <span className="text-body-sm font-medium">8. List Row Item</span>
                  </div>
                  <Badge color="success">Completed</Badge>
                </Card>
              </div>

              <div className="col-span-1 md:col-span-3">
                <Card variant="mediaHorizontal">
                  <div className="w-12 h-12 rounded-control bg-accent-primary/20 border border-accent-primary/30 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6 text-accent-primary" />
                  </div>
                  <div>
                    <h4 className="text-card-title text-ink">9. Media Horizontal Layout</h4>
                    <p className="text-body-xs text-ink-muted mt-0.5">Media/Icon slot on the left, structured metadata on the right.</p>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          {/* Form Controls & Checkbox / Toggle */}
          <section className="space-y-4">
            <h2 className="text-display-xs text-ink">Form Controls, Checkbox & Toggle (44px Targets)</h2>
            <div className="p-6 rounded-card bg-obsidian-900 border border-glass-border grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Checkbox
                  checked={checkboxState}
                  onChange={setCheckboxState}
                  label="Daily Quest: Complete Code Review"
                  description="+50 XP, +10 Gold"
                />

                <Toggle
                  checked={toggleState}
                  onChange={setToggleState}
                  label="Enable Rest Mode (Freeze streaks)"
                />
              </div>

              <div className="space-y-4">
                <Input
                  label="Quest Title"
                  placeholder="Enter quest name..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  helperText="Clear objectives improve completion rates."
                />

                <Input
                  label="Failed Validation Demo"
                  value="Invalid Entry"
                  error="This title contains invalid characters."
                />
              </div>
            </div>
          </section>

          {/* Progress & Badges & Avatars */}
          <section className="space-y-4">
            <h2 className="text-display-xs text-ink">Progress, Badges & Avatars</h2>
            <div className="p-6 rounded-card bg-obsidian-900 border border-glass-border space-y-6">
              <div className="space-y-3">
                <Progress value={65} max={100} variant="xp" showLabel label="Experience Points" milestones={[25, 50, 75, 100]} />
                <Progress value={45} max={100} variant="hp" showLabel label="Health Points" />
                <Progress value={80} max={100} variant="mana" showLabel label="Mana Pool" />
              </div>

              <div>
                <h3 className="text-caption font-semibold mb-3 text-ink-muted">Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge color="strength">Strength</Badge>
                  <Badge color="intelligence">Intelligence</Badge>
                  <Badge color="vitality">Vitality</Badge>
                  <Badge color="willpower">Willpower</Badge>
                  <Badge color="perception">Perception</Badge>
                  <Badge color="hp">HP</Badge>
                  <Badge color="mana">Mana</Badge>
                  <Badge color="xp">XP</Badge>
                  <Badge color="gold">Gold</Badge>
                  <Badge color="success">Success</Badge>
                  <Badge color="danger">Danger</Badge>
                  <Badge color="warning">Warning</Badge>
                  <Badge color="focus">Focus</Badge>
                </div>
              </div>

              <div>
                <h3 className="text-caption font-semibold mb-3 text-ink-muted">Avatars with Progression Rings</h3>
                <div className="flex items-center gap-6">
                  <Avatar name="Kaelen" size="sm" />
                  <Avatar name="Kaelen" size="md" level={4} />
                  <Avatar name="Kaelen" size="lg" level={7} progress={75} showProgressionRing />
                  <Avatar name="Kaelen" size="xl" level={12} progress={40} showProgressionRing />
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── 2. COLORS ── */}
      {activeTab === 'colors' && (
        <div className="space-y-8">
          <section>
            <h3 className="text-card-title mb-4">Obsidian Canvas Ramps</h3>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {[
                { name: 'obsidian-950', hex: '#040508' },
                { name: 'obsidian', hex: '#07080C' },
                { name: 'obsidian-900', hex: '#0B0D14' },
                { name: 'obsidian-800', hex: '#12141D' },
                { name: 'obsidian-700', hex: '#1B1E2B' },
                { name: 'obsidian-600', hex: '#262A3B' },
              ].map((c) => (
                <div key={c.name} className="p-3 rounded-card border border-glass-border bg-obsidian-900 flex flex-col gap-2">
                  <div className="h-12 rounded-control border border-glass-border" style={{ backgroundColor: c.hex }} />
                  <span className="text-caption font-semibold">{c.name}</span>
                  <span className="text-metadata text-ink-muted font-mono">{c.hex}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-card-title mb-4">5 RPG Attribute Colors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { name: 'Strength', hex: '#DC2626' },
                { name: 'Intelligence', hex: '#38BDF8' },
                { name: 'Vitality', hex: '#34D399' },
                { name: 'Willpower', hex: '#A78BFA' },
                { name: 'Perception', hex: '#FBBF24' },
              ].map((c) => (
                <div key={c.name} className="p-3 rounded-card border border-glass-border bg-obsidian-900 flex flex-col gap-2">
                  <div className="h-12 rounded-control" style={{ backgroundColor: c.hex }} />
                  <span className="text-caption font-semibold">{c.name}</span>
                  <span className="text-metadata text-ink-muted font-mono">{c.hex}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-card-title mb-4">Gameplay & Status Colors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {[
                { name: 'XP', hex: '#F59E0B' },
                { name: 'Gold', hex: '#EAB308' },
                { name: 'HP', hex: '#E11D48' },
                { name: 'Mana', hex: '#3B82F6' },
                { name: 'Streak', hex: '#F97316' },
                { name: 'Focus', hex: '#38BDF8' },
              ].map((c) => (
                <div key={c.name} className="p-3 rounded-card border border-glass-border bg-obsidian-900 flex flex-col gap-2">
                  <div className="h-12 rounded-control" style={{ backgroundColor: c.hex }} />
                  <span className="text-caption font-semibold">{c.name}</span>
                  <span className="text-metadata text-ink-muted font-mono">{c.hex}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── 3. TYPOGRAPHY ── */}
      {activeTab === 'typography' && (
        <div className="p-6 rounded-card bg-obsidian-900 border border-glass-border space-y-6">
          <div className="space-y-1">
            <span className="text-metadata text-ink-muted">.text-display-lg (40px / 1.1 / -0.01em)</span>
            <p className="text-display-lg text-ink">Level Up Achieved</p>
          </div>

          <div className="space-y-1">
            <span className="text-metadata text-ink-muted">.text-display-md (32px / 1.15 / -0.01em)</span>
            <p className="text-display-md text-ink">Daily Quest Chronicle</p>
          </div>

          <div className="space-y-1">
            <span className="text-metadata text-ink-muted">.text-display-sm (24px / 1.2 / -0.01em)</span>
            <p className="text-display-sm text-ink">Character Attributes</p>
          </div>

          <div className="space-y-1">
            <span className="text-metadata text-ink-muted">.text-display-xs (18px / 1.3)</span>
            <p className="text-display-xs text-ink">Focus Chamber Timer</p>
          </div>

          <div className="space-y-1">
            <span className="text-metadata text-ink-muted">.text-body (16px / 1.5)</span>
            <p className="text-body text-ink">
              Track habits and complete quests to earn gold and attribute points.
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-metadata text-ink-muted">.text-body-sm (14px / 1.5)</span>
            <p className="text-body-sm text-ink-muted">
              Secondary details, item descriptions, and timestamps.
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-metadata text-ink-muted">.text-body-xs (12px / 1.45 — Resolved Phantom Token)</span>
            <p className="text-body-xs text-ink-muted">
              Compact metadata, footnote hints, and status tags.
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-metadata text-ink-muted">.text-stat-value (tabular-nums font-mono)</span>
            <p className="text-stat-value text-2xl text-gold">1,240 / 3,000</p>
          </div>
        </div>
      )}

      {/* ── 4. ELEVATION ── */}
      {activeTab === 'elevation' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-card bg-obsidian-900 border border-glass-border shadow-elevation-subtle">
            <h4 className="text-card-title">elevation-subtle</h4>
            <p className="text-body-xs text-ink-muted mt-2">Tight contact shadow for tiles.</p>
          </div>

          <div className="p-6 rounded-card bg-obsidian-900 border border-glass-border shadow-elevation-surface">
            <h4 className="text-card-title">elevation-surface</h4>
            <p className="text-body-xs text-ink-muted mt-2">Standard ambient depth for cards.</p>
          </div>

          <div className="p-6 rounded-card bg-obsidian-800 border border-glass-border-strong shadow-elevation-elevated">
            <h4 className="text-card-title">elevation-elevated</h4>
            <p className="text-body-xs text-ink-muted mt-2">Prominent depth for heroes.</p>
          </div>

          <div className="p-6 rounded-card bg-obsidian-800 border border-glass-border shadow-elevation-floating">
            <h4 className="text-card-title">elevation-floating</h4>
            <p className="text-body-xs text-ink-muted mt-2">High depth for floating HUD & toast.</p>
          </div>

          <div className="p-6 rounded-card bg-obsidian-900 border border-white/10 shadow-elevation-modal">
            <h4 className="text-card-title">elevation-modal</h4>
            <p className="text-body-xs text-ink-muted mt-2">Deep ambient spread for modals.</p>
          </div>

          <div className="p-6 rounded-card bg-obsidian-900 border border-gold/40 shadow-glow">
            <h4 className="text-card-title text-gold">shadow-glow</h4>
            <p className="text-body-xs text-ink-muted mt-2">Milestone achievement lighting.</p>
          </div>
        </div>
      )}

      {/* ── 5. THE 4 MATERIALS ── */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-card material-solid">
              <h4 className="text-card-title">1. material-solid</h4>
              <p className="text-body-sm text-ink-muted mt-2">
                Default opaque obsidian surface. Used for the vast majority of cards and views to preserve GPU performance.
              </p>
            </div>

            <div className="p-6 rounded-card material-translucent">
              <h4 className="text-card-title">2. material-translucent</h4>
              <p className="text-body-sm text-ink-muted mt-2">
                Medium blur chrome (12px). Intended for floating navigation bars, sticky headers, and Player HUD.
              </p>
            </div>

            <div className="p-6 rounded-card material-elevated-glass">
              <h4 className="text-card-title">3. material-elevated-glass</h4>
              <p className="text-body-sm text-ink-muted mt-2">
                Featured glass (18px blur + 130% saturation). Reserved for celebratory modals and hero quest cards.
              </p>
            </div>

            <div className="p-6 rounded-card material-modal-glass">
              <h4 className="text-card-title">4. material-modal-glass</h4>
              <p className="text-body-sm text-ink-muted mt-2">
                High-density overlay glass (24px blur + 140% saturation). Used exclusively for modals, sheets, and scrims.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
