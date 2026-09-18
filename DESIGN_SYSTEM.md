# LifeOS — Design System Specification

> **Version:** 1.0.0 (Phase 1 Baseline)  
> **Source of Truth:** `client/src/index.css` (`@theme`) & `client/src/lib/design-tokens.js`  
> **Target Aesthetic:** Apple-grade interaction polish + obsidian RPG depth + cinematic composition.

---

## 1. Color Token Architecture

LifeOS employs a two-layer color system:
1. **Primitive Ramps:** Raw palette scales (`obsidian-950..600`, `neutral-50..950`, identity violet, 5 attribute colors).
2. **Semantic Tokens:** Components consume strictly semantic tokens rather than hand-mixed opacities.

### 1.1 Canvas & Obsidian Depth
| Token | Hex Value | Semantic Role |
|:---|:---|:---|
| `--color-obsidian-950` | `#040508` | Deepest canvas background, sunken wells, progress bar troughs |
| `--color-obsidian` | `#07080C` | Standard application canvas background |
| `--color-obsidian-900` | `#0B0D14` | Primary panel surface (`material-solid`), sidebar, card backgrounds |
| `--color-obsidian-800` | `#12141D` | Elevated surfaces, button hover states, inputs |
| `--color-obsidian-700` | `#1B1E2B` | Active states, primary button top gradient |
| `--color-obsidian-600` | `#262A3B` | High-contrast borders and dividers |

### 1.2 Text Hierarchy
| Token | Value | Intended Role |
|:---|:---|:---|
| `--color-text-primary` / `--color-ink` | `#E7E9EE` | Primary titles, active labels, body headings (contrast $\ge 12.8:1$) |
| `--color-text-secondary` / `--color-ink-muted` | `#9AA0AE` | Body copy, timestamps, secondary labels (contrast $\ge 6.2:1$) |
| `--color-text-tertiary` / `--color-ink-subtle` | `#646A7A` | Inactive icons, subtle hints, footnotes |
| `--color-text-disabled` | `#4B5162` | Disabled form controls and inactive buttons |
| `--color-text-on-accent` | `#07080C` | High-contrast text placed on gold/yellow accent buttons |

### 1.3 Gameplay Status & Attribute Tokens
| Token | Hex Value | Gameplay Purpose |
|:---|:---|:---|
| `--color-attr-strength` | `#DC2626` | Strength attribute, physical habits, destructive actions |
| `--color-attr-intelligence` | `#38BDF8` | Intelligence attribute, mental habits, focus chamber |
| `--color-attr-vitality` | `#34D399` | Vitality attribute, health habits, positive streak scoring |
| `--color-attr-willpower` | `#A78BFA` | Willpower attribute, discipline habits, progression violet |
| `--color-attr-perception` | `#FBBF24` | Perception attribute, awareness, active navigation highlight |
| `--color-xp` | `#F59E0B` | Experience points bar, streak fire counter |
| `--color-gold` / `--color-reward` | `#EAB308` | Currency counter, shop rewards, milestone diamond markers |
| `--color-hp` / `--color-danger` | `#E11D48` | Character health points, critical low-HP warnings |
| `--color-mana` | `#3B82F6` | Character mana pool, cognitive energy |
| `--color-streak` | `#F97316` | Habit continuous streak flames |
| `--color-quest` | `#8B5CF6` | Quest objectives and scroll badges |

---

## 2. Typography Scale

The type system uses **Cabinet Grotesk** (display headings) and **Inter** (body copy), with tabular figures for numbers.

| Class / Role | Font Family | Size | Weight | Line Height | Tracking | Purpose |
|:---|:---|:---|:---|:---|:---|:---|
| `.text-display-lg` | Cabinet Grotesk | 40px | 600 | 1.1 | -0.01em | Level-up modal titles, hero headlines |
| `.text-display-md` | Cabinet Grotesk | 32px | 600 | 1.15 | -0.01em | Page header titles |
| `.text-display-sm` | Cabinet Grotesk | 24px | 600 | 1.2 | -0.01em | Section titles, feature card headers |
| `.text-display-xs` | Cabinet Grotesk | 18px | 600 | 1.3 | -0.005em | Modal titles, quest card titles |
| `.text-card-title` | Cabinet Grotesk | 16px | 600 | 1.35 | -0.005em | Card headers, list section labels |
| `.text-body` | Inter | 16px | 400 | 1.5 | normal | Standard body text |
| `.text-body-medium`| Inter | 16px | 500 | 1.5 | normal | Emphasized body text |
| `.text-body-sm` | Inter | 14px | 400 | 1.5 | normal | Descriptions, secondary card content |
| `.text-body-xs` | Inter | 12px | 400 | 1.45 | normal | Small metadata, tags, item details |
| `.text-label` | Inter | 14px | 500 | 1.4 | normal | Form input labels |
| `.text-caption` | Inter | 12px | 500 | 1.4 | normal | Helper text, badge labels |
| `.text-metadata`| Inter | 11px | 400 | 1.35 | normal | Footnotes, sub-badges |
| `.text-stat-value`| JetBrains Mono | 14px+ | 700 | 1.2 | tabular | Numeric counters, gold, HP/XP values |
| `.text-progression`| Cabinet Grotesk | 12px | 600 | 1.2 | +0.06em | Uppercase RPG eyebrow labels |

---

## 3. The 4 Materials & Glass Performance Budget

To eliminate blur sprawl and frame drops, LifeOS defines **exactly four materials**:

| Material Utility | Intended Surface | Visual Specification | Fallback (No Blur Support) |
|:---|:---|:---|:---|
| `.material-solid` | Standard cards & panels (90% of UI) | `bg-obsidian-900 border border-glass-border shadow-elevation-surface` | Pure opaque surface |
| `.material-translucent` | Persistent chrome (HUD, floating nav) | `bg-obsidian-900/78 backdrop-blur-[12px] border border-glass-border` | `bg-obsidian-900` |
| `.material-elevated-glass`| Featured hero cards & loot popups | `bg-white/[0.05] backdrop-blur-[18px] saturate-[130%] border border-glass-border-strong` | `bg-obsidian-800` |
| `.material-modal-glass` | Dialogs, sheets, overlay scrims | `bg-obsidian-900/90 backdrop-blur-[24px] saturate-[140%] border border-glass-border-strong` | `bg-obsidian-900` |

### Glass Performance Ceiling Rule
1. **Maximum 2 Blurred Surfaces in Visual Stack:** Never composite more than 2 backdrop-filter surfaces simultaneously.
2. **No Backdrop-Filter in Animating Scroll Containers:** Never apply active backdrop blur to items inside virtualized or animated lists.
3. **Always Include `@supports` Fallback:** Every translucent glass class must define an opaque background fallback.

---

## 4. Radius Hierarchy & Concentric Nested Radius Rule

| Token | Value | Target Usage |
|:---|:---|:---|
| `--radius-control` | `10px` | Buttons, form inputs, badge chips, nested tiles |
| `--radius-card` | `16px` | Standard feature cards, stat containers |
| `--radius-card-lg` | `20px` | Hero panels, featured quest cards |
| `--radius-modal` | `24px` | Desktop dialogs, mobile bottom sheet top corners |
| `--radius-pill` | `999px` | Badges, avatar indicators, segmented tabs |
| `--radius-full` | `9999px` | Circular buttons, avatar icons |

### The Nested Radius Rule
When an inner component sits inside a parent card with inset padding $P$:
$$R_{inner} = R_{outer} - P$$
*Example:* A card with $R = 16\text{px}$ and $P = 6\text{px}$ requires inner elements to have $R = 10\text{px}$ (`radius-control`) so corners remain concentric and eliminate optical pinching.

---

## 5. Layered Elevation System

| Semantic Level | Box Shadow Formulation | Intended Elevation |
|:---|:---|:---|
| `shadow-elevation-none` | `none` | Flat embedded elements |
| `shadow-elevation-subtle` | `0 2px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)` | Compact tiles, list row items |
| `shadow-elevation-surface`| `0 4px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)` | Standard cards, input fields |
| `shadow-elevation-elevated`| `0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)` | Featured heroes, hovered cards |
| `shadow-elevation-floating`| `0 16px 36px -4px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)` | Floating navigation, HUD, Toasts |
| `shadow-elevation-modal` | `0 24px 48px -12px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.14)` | Modals, bottom sheets, dialogs |

---

## 6. Motion Language & Spring Architecture

Defined in `client/src/lib/motion.js`:

### Durations & Easings
- `instant`: 80ms (switches, micro-ticks)
- `fast`: 150ms (hover feedback, dropdowns)
- `base`: 250ms (card expansion, drawer slide)
- `slow`: 400ms (modal entrances, dialog zoom)
- `deliberate`: 600ms (milestone fanfare, XP progress fills)
- `easings.standard`: `[0.2, 0, 0, 1]`

### Springs
- `spring.press`: `{ stiffness: 600, damping: 35, mass: 0.5 }` (Sub-100ms pointer-down compression)
- `spring.snappy`: `{ stiffness: 500, damping: 32 }` (Snappy tab slides, drawer transitions)
- `spring.smooth`: `{ stiffness: 260, damping: 26 }` (Gentle card positioning)
- `spring.bouncyRestrained`: `{ stiffness: 340, damping: 20 }` (Level-up badge popups)

### Reduced Motion Strategy
When `useReducedMotion()` is active, `getAccessibleMotion()` automatically collapses motion transforms (`y`, `scale`) to opacity-only fades (`opacity: 0 -> 1`), preventing vestibular discomfort while maintaining full functional feedback.

---

## 7. Responsive Breakpoint Architecture (§9 Decision)

To protect the 131+ existing `sm:` responsive grid classes across the application, Tailwind defaults are preserved, with explicit custom breakpoints for mobile and ultrawide targets:

| Breakpoint Prefix | Width | Usage Rule |
|:---|:---|:---|
| `xs:` | `375px` | Compact phone baseline |
| `phone:` | `390px` | Standard iPhone 12–16 viewport |
| `phone-lg:` | `430px` | Large Pro Max / Plus mobile devices |
| `sm:` | `640px` | Standard tablet small landscape / responsive grid break (preserved) |
| `md:` | `768px` | Tablet portrait, navigation swap point (sidebar appears, bottom nav hides) |
| `lg:` | `1024px` | Compact desktop / tablet landscape |
| `xl:` | `1280px` | Standard widescreen desktop |
| `desktop-lg:` | `1440px` | Target cinematic desktop canvas |
| `desktop-xl:` | `1920px` | Ultrawide gaming desktop canvas |

---

## 8. Touch & Safe-Area Geometry

- **Minimum Interactive Target:** Every button, tab, checkbox, toggle, and icon control enforces a **minimum $44 \times 44\text{px}$ hit area** (`touch-target-44` or `hit-area-expand`).
- **Hit Area Expander:** Compact visual elements (`size="xs"`, 32px height) use `.hit-area-expand` (a `::after` pseudo-element spanning 44×44px) so compact styling never degrades touch accuracy.
- **Safe Area Insets:** Top HUD and bottom navigation leverage `.safe-top` and `.safe-bottom` (`env(safe-area-inset-top)` / `env(safe-area-inset-bottom)`), enabled by `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />`.
- **Dynamic Viewport Height:** Full-height views utilize `min-h-dvh` (`100dvh` with `100vh` fallback) to prevent mobile browser URL bar collapse from breaking vertical alignment.
