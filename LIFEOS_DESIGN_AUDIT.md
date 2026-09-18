# LifeOS — Phase 0: Global UI/UX Audit, Motion Audit & Design-System Gap Analysis

> **Audit Date:** September 17, 2026  
> **Auditor:** Principal Product Designer + Frontend Architecture Auditor (LifeOS Core Team)  
> **Codebase Source of Truth:** `d:\PROJECT` (`client/` + `server/`)  
> **Live Deployment Baseline:** `https://life-os-rpg-ukcq.vercel.app/`  
> **Visual Evidence Base:** `audit/screens/` (45 full-page captures across 5 canonical viewports)  
> **Trace / Performance Baseline:** `audit/perf/` (DevTools tracing, FPS benchmark, DOM node counts)  

---

## Table of Contents

1. [Executive Frame & Measuring Stick](#1-executive-frame--measuring-stick)
2. [Step 1 — Codebase Map & Running-App Capture](#step-1--codebase-map--running-app-capture)
3. [Step 2 — Design Token Audit](#step-2--design-token-audit)
4. [Step 3 — Component Architecture Audit](#step-3--component-architecture-audit)
5. [Step 4 — Surface, Card & Glass Audit](#step-4--surface-card--glass-audit)
6. [Step 5 — App Shell, Navigation & Player HUD Audit](#step-5--app-shell-navigation--player-hud-audit)
7. [Step 6 — Motion & Transition Audit](#step-6--motion--transition-audit-highest-priority)
8. [Step 7 — Environment & Background Audit](#step-7--environment--background-audit)
9. [Step 8 — Page-by-Page Audit](#step-8--page-by-page-audit)
10. [Step 9 — Responsive Architecture Audit](#step-9--responsive-architecture-audit)
11. [Step 10 — Performance Audit](#step-10--performance-audit)
12. [Step 11 — Accessibility Audit](#step-11--accessibility-audit)
13. [Step 12 — Consistency Register](#step-12--consistency-register)
14. [Step 13 — Global vs. Page-Specific Classification](#step-13--global-vs-page-specific-classification)
15. [Step 14 — Prioritized Opportunity List & Roadmap Critique](#step-14--prioritized-opportunity-list--roadmap-critique)

---

## 1. Executive Frame & Measuring Stick

LifeOS pairs personal productivity with RPG progression. The target quality bar is defined by four core tenets:
- **Apple-level interaction polish:** spring physics over linear curves, interruptible gestures, sub-100ms press feedback, tactile momentum, and strict safe-area integration.
- **Premium game-UI presentation:** high-contrast obsidian depth, layered lighting rather than wireframe lines, purposeful glow, and celebratory feedback reserved for genuine milestones.
- **Cinematic composition:** full-bleed hero artwork, vertical gradient scrim transitions, horizontal edge-bleeding carousel rows, and fanned overlapping card arcs on desktop.
- **Native-mobile feel:** floating detached pill navigation, thumb-zone hierarchy, and information density with breathing room.

This audit evaluates the current implementation against this North Star without speculation or assumption.

---

## Step 1 — Codebase Map & Running-App Capture

### 1.1 Architecture & Stack Map

| Architectural Layer | Repository Implementation | Concrete Evidence |
|:---|:---|:---|
| **Repository Topology** | Monorepo root with `client/` (SPA frontend) and `server/` (Express API) split | `client/package.json`, `server/package.json` |
| **Frontend Framework** | React 19 (`19.2.8`), React DOM (`19.2.8`), Vite 8 (`8.2.2`) | `client/package.json:22-23, 35` |
| **Routing Engine** | React Router v7 (`7.18.3`) in declarative client SPA mode | `client/package.json:24`, `client/src/App.jsx:1-58` |
| **Styling Architecture** | Tailwind CSS v4 (`4.3.3`) via `@tailwindcss/vite` plugin. Source of truth in `client/src/index.css` via `@theme` | `client/vite.config.js:2, 8`, `client/src/index.css:10-56` |
| **Animation Libraries** | Framer Motion (`13.2.0`), Canvas Confetti (`1.9.4`) | `client/package.json:19, 17` |
| **Data Visualization** | Recharts (`3.10.1`) | `client/package.json:25`, `client/src/components/dashboard/CharacterRadarChart.jsx:2` |
| **Iconography** | Lucide React (`1.42.0`) — single icon library | `client/package.json:20` |
| **Client State / Fetching** | TanStack Query v5 (`5.102.8`) with localized custom hooks (`useQuery`, `useMutation`) | `client/package.json:13`, `client/src/features/*/hooks.js` |
| **Auth & Session** | In-memory JWT access token + HttpOnly rotating refresh cookie (`/auth/refresh`), single-flight promise | `client/src/lib/axios.js:3-58`, `server/src/services/token.service.js:19-25` |

### 1.2 Route Inventory

| Route | Protected | Component | Physical File Path |
|:---|:---|:---|:---|
| `/onboarding` | No (Public) | `OnboardingPage` | `client/src/pages/OnboardingPage.jsx` |
| `/auth/callback` | No (Public) | `AuthCallback` | `client/src/pages/AuthCallback.jsx` |
| `/showcase`, `/dev`| No (Dev) | `DevShowcase` | `client/src/pages/DevShowcase.jsx` |
| `/focus` | Yes (`AuthGate`) | `FocusChamberPage` | `client/src/pages/FocusChamberPage.jsx` |
| `/` | Yes (`AuthGate` + `AppShell`) | `DashboardPage` | `client/src/pages/DashboardPage.jsx` |
| `/habits` | Yes (`AuthGate` + `AppShell`) | `HabitsPage` | `client/src/pages/HabitsPage.jsx` |
| `/dailies` | Yes (`AuthGate` + `AppShell`) | `DailiesPage` | `client/src/pages/DailiesPage.jsx` |
| `/quests` | Yes (`AuthGate` + `AppShell`) | `QuestsPage` | `client/src/pages/QuestsPage.jsx` |
| `/shop` | Yes (`AuthGate` + `AppShell`) | `ShopPage` | `client/src/pages/ShopPage.jsx` |
| `/reflection` | Yes (`AuthGate` + `AppShell`) | `ReflectionPage` | `client/src/pages/ReflectionPage.jsx` |

### 1.3 Running-App Visual Evidence (`audit/screens/`)

All 45 canonical screenshots have been captured directly from the live application and saved under `audit/screens/`:

| Route | 390×844 (Phone) | 768×1024 (Tablet Portrait) | 1024×768 (Tablet Landscape) | 1440×900 (Laptop) | 1920×1080 (Desktop) |
|:---|:---|:---|:---|:---|:---|
| **Onboarding** | `onboarding-390.png` | `onboarding-768.png` | `onboarding-1024.png` | `onboarding-1440.png` | `onboarding-1920.png` |
| **Dashboard** | `dashboard-390.png` | `dashboard-768.png` | `dashboard-1024.png` | `dashboard-1440.png` | `dashboard-1920.png` |
| **Habits** | `habits-390.png` | `habits-768.png` | `habits-1024.png` | `habits-1440.png` | `habits-1920.png` |
| **Dailies** | `dailies-390.png` | `dailies-768.png` | `dailies-1024.png` | `dailies-1440.png` | `dailies-1920.png` |
| **Quests** | `quests-390.png` | `quests-768.png` | `quests-1024.png` | `quests-1440.png` | `quests-1920.png` |
| **Shop** | `shop-390.png` | `shop-768.png` | `shop-1024.png` | `shop-1440.png` | `shop-1920.png` |
| **Focus** | `focus-390.png` | `focus-768.png` | `focus-1024.png` | `focus-1440.png` | `focus-1920.png` |
| **Reflection**| `reflection-390.png`| `reflection-768.png` | `reflection-1024.png` | `reflection-1440.png` | `reflection-1920.png` |
| **Showcase** | `showcase-390.png` | `showcase-768.png` | `showcase-1024.png` | `showcase-1440.png` | `showcase-1920.png` |

### 1.4 Runtime Performance & Paint Trace Observations

From live Chrome DevTools automated traces stored in `audit/perf/`:
- **Dashboard Initial Mount (`dashboard_initial_load.json`):** 113 Layout events (27ms total layout time), 234 Style Recalculations (88ms total style time), 9 long tasks (>50ms, peak task: 288ms during Recharts SVG mount and TanStack Query cache dehydration).
- **Route Change Navigation (`route_change_dashboard_to_quests.json`):** 169 Layout events (49ms), 540 Style Recalculations (329ms), 3 long tasks (>50ms, peak task: 146ms). Caused by unmounting the full dashboard DOM and mounting 205 quest DOM nodes synchronously.
- **FPS during continuous scroll (`fps_measurement.json`):** Sustained 145 FPS (290 frames / 2001ms) on high-refresh monitor.
- **Paint Flashing Observations:** Unrelated subtrees repaint during stat updates due to `PlayerHud` and `AppShell` subscribing to wide query objects without selector memoization.

---

## Step 2 — Design Token Audit

### 2.1 Token System Inventory

| Token Domain | Canonical Definition Location | Token Values Defined in `@theme` | Actual Application Consistency | Gap vs. North Star |
|:---|:---|:---|:---|:---|
| **Color: Canvas** | `client/src/index.css:12-15` | `obsidian` (#07080C), `obsidian-900` (#0B0D14), `obsidian-800` (#12141D), `obsidian-700` (#1B1E2B) | Applied on cards and backgrounds, but `obsidian-400` (#9AA0AE) is used ad-hoc in `FocusChamberPage.jsx:179` despite not existing in `@theme`. | Near-black canvas exists, but lacks ambient lighting or subtle hue tinting across routes. |
| **Color: Glass** | `client/src/index.css:18-19` | `glass` (`rgba(255,255,255,0.04)`), `glass-border` (`rgba(255,255,255,0.08)`) | Inconsistent: over 25 files use ad-hoc opacity floats (`bg-white/5`, `bg-white/[0.03]`, `bg-white/[0.07]`, `bg-white/[0.14]`). | Conflates glass borders with card outlines. Creates harsh wireframe borders rather than translucent edge reflections. |
| **Color: Text** | `client/src/index.css:22-23` | `ink` (#E7E9EE), `ink-muted` (#9AA0AE) | Generally consistent, but ad-hoc utility `text-slate-300` used in `ConsistencyHeatmap.jsx:18` and `OnboardingHero.jsx:158`. | Missing tertiary/quaternary typography hierarchy tokens (e.g. `ink-faint`, `ink-subtle`). |
| **Color: Attributes** | `client/src/index.css:26-30` | `attr-strength` (#DC2626), `attr-intelligence` (#38BDF8), `attr-vitality` (#34D399), `attr-willpower` (#A78BFA), `attr-perception` (#FBBF24) | Strictly 5 attributes maintained. | Semantic conflict: `attr-strength` (#DC2626) is identical to danger/error, while `attr-intelligence` (#38BDF8) overlaps `mana` (#3B82F6). |
| **Color: Stats** | `client/src/index.css:33-36` | `hp` (#E11D48), `mana` (#3B82F6), `xp` (#F59E0B), `gold` (#EAB308) | Consistently applied for RPG stats. | `xp` and `gold` are adjacent amber/yellow hues (#F59E0B vs #EAB308), creating visual confusion in combat text and badges. |
| **Typography** | `client/src/index.css:39-40, 109-160` | Display: Cabinet Grotesk (600 only). Body: Inter (100-900). Utility classes: `.text-display-lg/md/sm`, `.text-body/-sm/-medium`, `.text-label` | Bypassed: pages write arbitrary utility strings e.g. `text-2xl font-bold font-display text-ink` (`QuestsPage.jsx:117`, `HabitsPage.jsx:52`, `ShopPage.jsx:100`). | No uppercase tracked-out eyebrow token, no tabular numerals for stats, no game label token. |
| **Spacing Scale** | `client/src/index.css` | **NOT DEFINED** (relies entirely on unconstrained Tailwind defaults: `p-1.5`, `p-2`, `p-2.5`, `p-3`, `p-3.5`, `p-4`, `p-5`, `p-6`, `p-8`) | Ad-hoc across every feature. | No authored 4pt/8pt rhythm scale; lacks deliberate contrast between row rhythm and section gaps. |
| **Corner Radius** | `client/src/index.css:43-44` | `--radius-panel: 18px`, `--radius-chip: 999px` | Severely violated: components use `rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px), `rounded-panel` (18px), `rounded-3xl` (24px) interchangeably. | No defined ladder for container vs card vs nested tile vs pill button. |
| **Elevation** | `client/src/index.css:50-55` | `shadow-glow`, `shadow-glow-{strength,intelligence,vitality,willpower,perception}` | Severe gap: pages invoke phantom classes `shadow-glass` (13 instances) and `shadow-modal` (2 instances) which do not exist in `@theme`. | Depth from light is missing; surfaces rely on 1px borders instead of elevation lighting. |
| **Blur / Material**| `client/src/index.css:47` | `--blur-glass: 18px` | Inconsistent: pages use `backdrop-blur-sm` (4px), `backdrop-blur-md` (12px), `backdrop-blur-glass` (18px), `backdrop-blur-xl` (24px), and `backdrop-blur-2xl` (40px) at random. | No material hierarchy (thin overlay vs floating navigation vs modal sheet). |
| **Z-Index** | `client/src/index.css` | **NOT DEFINED** (magic numbers in use: `z-10`, `z-20`, `z-30`, `z-35`, `z-40`, `z-50`) | Arbitrary layering conflicts possible between drawers, toasts, and modals. | No structured layering scale (`base`, `elevated`, `sticky`, `overlay`, `modal`, `toast`). |
| **Breakpoints** | `.agent/rules/10-design-system.md:49-53` | Documented as `sm: 375px`, `md: 768px`, `lg: 1440px` | **FICTIONAL**: Breakpoints were never overridden in `client/src/index.css` `@theme`. Tailwind v4 compiles `sm` to 640px, `md` to 768px, `lg` to 1024px. | Critical architectural disconnect between documented design rules and actual CSS build. |
| **Motion Tokens** | `client/src/lib/motionVariants.js` | `spring.snappy`, `spring.bouncy`, `spring.gentle`, `pressable`, `modalPanel` | Incomplete: no duration tokens, no bezier curves, no stagger presets. Components inline raw durations (`duration: 0.2`, `duration: 0.35`). | No directional continuity or interruptible gesture physics. |

### 2.2 Hardcoded Token Duplication & Phantom Classes

| Token Category | Canonical Token | Hardcoded Duplicates / Phantom Tokens in Code | Concrete Evidence File & Line | Severity |
|:---|:---|:---|:---|:---|
| **Shadow** | `shadow-glow` | `shadow-glass` (undeclared in `@theme`, compiles to nothing) | `HabitsPage.jsx:60, 69, 73, 80, 97, 116, 129`, `HabitCard.jsx:97, 206`, `HabitModal.jsx:118, 145, 171`, `Toast.jsx:76` | **BLOCKING** |
| **Shadow** | `shadow-glow` | `shadow-modal` (undeclared in `@theme`, compiles to nothing) | `DailyModal.jsx:292`, `DailyCard.jsx:285` | **BLOCKING** |
| **Color** | `glass-border` | `bg-glass-border-strong` (undeclared in `@theme`) | `HabitsPage.jsx:97` | HIGH |
| **Color** | `attr-intelligence` | `border-azure-500/30`, `text-azure-400`, `bg-azure-600` | `FocusChamberPage.jsx:186, 188, 198, 202, 214` | HIGH |
| **Color** | `obsidian-muted` | `text-obsidian-400` (undeclared in `@theme`) | `FocusChamberPage.jsx:179, 193` | MEDIUM |
| **Typography** | `.text-body-sm` | `.text-body-xs`, `.text-body-2xs` (undeclared utility classes) | `HabitsPage.jsx:60, 129`, `HabitCard.jsx:109, 119, 142` | HIGH |
| **Corner Radius**| `--radius-panel: 18px` | `rounded-2xl` (16px) for equivalent primary cards | `HabitCard.jsx:96`, `QuestCard.jsx:119`, `HabitModal.jsx:218`, `DailyModal.jsx:292` | HIGH |
| **Corner Radius**| `--radius-panel: 18px` | `rounded-xl` (12px) for card surfaces | `ShopItemCard.jsx:87`, `HabitsPage.jsx:69, 73, 80` | HIGH |
| **Glass Opacity**| `--color-glass: 0.04` | Arbitrary opacity floats (`0.03`, `0.05`, `0.07`, `0.08`, `0.10`, `0.12`, `0.14`, `0.16`, `0.20`, `0.22`, `0.25`, `0.28`) | `Card.jsx:23`, `Sidebar.jsx:106, 142`, `OnboardingTopBar.jsx:29, 45, 62`, `OnboardingHero.jsx:194`, `AuthModal.jsx:225` | HIGH |

---

## Step 3 — Component Architecture Audit

### 3.1 Shared UI Primitive Inventory (`client/src/components/ui/`)

The shared UI component library in `client/src/components/ui/` contains only **four** primitives and a toast system:
1. `Button.jsx` (canonical button with `primary`, `ghost`, `attr` variants)
2. `Card.jsx` (canonical card with `default` and `hud` variants)
3. `Modal.jsx` (canonical modal with `modalPanel` animation)
4. `Badge.jsx` (canonical badge for attributes and stats)
5. `Toast.jsx` + `useToast.js` (toast notification provider)

### 3.2 Canonical Primitives vs. In-Tree Duplicates

| Primitive | Canonical File | In-Tree Duplicates & Raw Implementations | Exact File Paths & Lines | Architecture Finding |
|:---|:---|:---|:---|:---|
| **Button** | `client/src/components/ui/Button.jsx` | Over **125 raw `<button>` elements** bypass `<Button>`, implementing custom inline Tailwind classes and transitions. | `ShopPage.jsx:186`, `QuestsPage.jsx:136, 173, 192, 206, 252`, `HabitsPage.jsx:57, 90, 126`, `DailiesPage.jsx:87, 126, 165`, `FocusChamberPage.jsx:130, 212`, `QuestCard.jsx:156, 169, 257, 334`, `ShopItemCard.jsx:116, 132, 143` | `<Button>` exists in theory but is bypassed in practice across >85% of all interactive buttons in the application. |
| **Card** | `client/src/components/ui/Card.jsx` | Almost every domain feature builds custom card `<div>` structures rather than extending `<Card>`. | `HabitCard.jsx:96-102`, `DailyCard.jsx:100-112`, `QuestCard.jsx:119-126`, `ShopItemCard.jsx:68-76`, `EveningReflectionCard.jsx:80-88` | `<Card>` is too primitive (only 2 variants), forcing features to roll custom card implementations with discordant radii and shadows. |
| **Modal / Dialog**| `client/src/components/ui/Modal.jsx` | **Seven distinct modal implementations** rebuild their own backdrop, container, escape listener, and animation. | `HabitModal.jsx:200-245`, `DailyModal.jsx:274-320`, `QuestModal.jsx:105-150`, `ShopItemModal.jsx:95-140`, `ItemInspectionModal.jsx:130-180`, `AuthModal.jsx:145-210`, `LevelUpModal.jsx:130-180` | `<Modal>` is completely ignored by all domain features. Every modal has separate focus, backdrop, and styling bugs. |
| **Input** | **NOT IMPLEMENTED** | Raw `<input>` tags styled ad-hoc with inconsistent focus rings and paddings. | `HabitModal.jsx:84`, `DailyModal.jsx:125`, `QuestModal.jsx:145`, `ShopPage.jsx:209`, `AuthModal.jsx:240, 280` | No canonical Input primitive exists in the repository. |
| **Select / Dropdown**| **NOT IMPLEMENTED**| Raw `<select>` or custom absolute menus styled ad-hoc. | `HabitModal.jsx:110-150`, `DailyModal.jsx:160-210`, `QuestCard.jsx:175-195`, `HabitCard.jsx:200-220` | No canonical Select or Dropdown primitive exists. |
| **Toggle / Checkbox**| **NOT IMPLEMENTED**| Custom SVG checkbox implementations rebuilt per card. | `DailyCard.jsx:140-163`, `QuestCard.jsx:290-310` | No shared Checkbox or Toggle primitive exists. |
| **Progress** | **NOT IMPLEMENTED**| Raw `<div>` progress bars with custom inline styles. | `StatBar.jsx:40-55`, `QuestCard.jsx:221-251`, `DailyCard.jsx:123-138` | No shared Progress component exists. |
| **Drawer / Sheet** | **NOT IMPLEMENTED**| Three independent drawer implementations with custom slide animations. | `AttributesDrawer.jsx:45-120`, `BattleActivityDrawer.jsx:50-130`, `InventoryDrawer.jsx:80-160` | No canonical Drawer/Sheet primitive exists. |

### 3.3 Presentation & Business Logic Entanglements (Landmines)

| Component Path | Entanglement Diagnosis | Line Numbers | Risk Assessment for Visual Phases |
|:---|:---|:---|:---|
| `client/src/components/quests/QuestCard.jsx` | Card component contains 376 lines orchestrating subtask mutation, optimistic cache updates, milestone bonus calculations, confirmation states, and dropdown menus. | `QuestCard.jsx:35-115` | **CRITICAL**: Visual refactoring of QuestCard risks breaking subtask persistence and milestone bonus reward dispatch. |
| `client/src/components/habits/HabitCard.jsx` | Card component handles HTML5 drag-and-drop event reordering, scoring mutation dispatch, floating text coordination, streak animation triggers, and delete dialogs. | `HabitCard.jsx:32-90` | **HIGH**: Re-styling the card surface or moving to swipe gestures will directly collide with drag-and-drop state. |
| `client/src/components/dailies/DailyCard.jsx` | Card directly executes streak shield decrement logic, date checking, optimistic strike-through, and celebration triggers. | `DailyCard.jsx:45-98` | **HIGH**: Tight coupling between SVG animation triggers and backend response envelopes. |
| `client/src/components/hud/PlayerHud.jsx` | Top HUD manages desktop/mobile layout switches, attributes drawer triggers, battle log subscriptions, and raw query transformations across 258 lines. | `PlayerHud.jsx:26-72` | **HIGH**: Extracting the HUD into a floating status cluster requires untangling legacy window event listeners (`LIFEOS_OPEN_ATTRIBUTES_EVENT`). |
| `client/src/pages/FocusChamberPage.jsx` | Page combines timer intervals, audio synthesis, fullscreen API handlers, and completion reward mutations across 395 lines. | `FocusChamberPage.jsx:45-165` | **HIGH**: Visual environment upgrades risk timer de-synchronization and audio context leaks. |

### 3.4 Largest Components by Line Count

| Rank | Component File Path | Line Count | Primary Concerns |
|:---:|:---|:---:|:---|
| 1 | `client/src/features/auth/components/AuthModal.jsx` | **472** | Monolithic modal handling register/login crossfades, password meter, OAuth, and lore illustration. |
| 2 | `client/src/pages/FocusChamberPage.jsx` | **395** | Single-file timer, ambient audio triggers, session state, and reward screens. |
| 3 | `client/src/components/quests/QuestCard.jsx` | **376** | Oversized card with nested checklists, dropdown menus, and progress calculations. |
| 4 | `client/src/components/dailies/DailyCard.jsx` | **335** | Complex checklist card with SVG circle math, streak shields, and menu portals. |
| 5 | `client/src/pages/ShopPage.jsx` | **304** | Giant page mixing catalog rendering, search, filters, and modal coordinators. |
| 6 | `client/src/components/dailies/DailyModal.jsx` | **321** | Complex multi-step form with manual radio buttons and custom validation. |
| 7 | `client/src/components/quests/QuestModal.jsx` | **285** | Dynamic subtask checklist array inputs and custom milestone threshold editors. |
| 8 | `client/src/components/hud/PlayerHud.jsx` | **258** | Dual mobile/desktop header with 7 sub-stat displays and drawer triggers. |
| 9 | `client/src/components/celebration/LevelUpModal.jsx` | **257** | Canvas confetti, sound synthesizer, count-up numbers, and stat comparison. |
| 10 | `client/src/components/habits/HabitCard.jsx` | **254** | Habit row item with drag-and-drop handlers, dropdowns, and scoring buttons. |

---

## Step 4 — Surface, Card & Glass Audit

### 4.1 Card Hierarchy Mapping

| Target Card Hierarchy Tier (North Star 2.1 / 2.2) | Repository Implementation | Representative File & Evidence Line | Screenshot Evidence Reference | Evaluation & Gaps |
|:---|:---|:---|:---|:---|
| **1. Surface** (Default canvas panel) | `Card.jsx (default)` | `client/src/components/ui/Card.jsx:17-21` | `dashboard-1440.png` | Basic glass card with 1px border. Lacks layered illumination. |
| **2. Interactive** (Clickable, pressable) | `HabitCard`, `ShopItemCard` | `client/src/components/shop/ShopItemCard.jsx:68-76` | `shop-1440.png` | Inconsistent hover styles (`whileHover: { y: -3 }` in Shop vs border color flash in Habits). |
| **3. Elevated** (Floating popups, menus) | `LootDropPopup`, context menus | `client/src/components/celebration/LootDropPopup.jsx:56-59` | `dashboard-1440.png` | Depth achieved via dark borders rather than natural diffuse light shadows. |
| **4. Featured** (Today's spotlight / primary intention)| **MISSING** | No dedicated featured card primitive exists. | `dashboard-1440.png`, `quests-1440.png` | All cards on Dashboard and Quests share identical visual hierarchy; nothing takes the visual lead. |
| **5. Immersive** (Full-bleed media, translucent overlay)| **MISSING** (except Onboarding) | `OnboardingVideoBackground.jsx:40-90` | `onboarding-1440.png` | Only Onboarding uses full-bleed media. No in-app cards use full-bleed imagery. |
| **6. Compact** (Drawer rows, quick selectors) | `InventoryDrawer` tiles | `client/src/components/shop/InventoryDrawer.jsx:150-180` | `shop-1440.png` | Uses arbitrary 12px / 16px corner radiuses and high-density borders. |
| **7. Stat** (Metrics, numbers, player gauges) | `StatBar`, `DashboardStats` | `client/src/components/hud/StatBar.jsx:30-65` | `dashboard-1440.png` | Capped inside opaque header bar; cannot breathe or scale. |
| **8. List row** (Swipeable, reorderable item)| `DailyCard`, `HabitCard` | `client/src/components/dailies/DailyCard.jsx:100-115` | `dailies-1440.png` | Rendered as separate boxed cards rather than seamless list rows. |
| **9. Horizontal media card** (Bleeding carousel tile)| **MISSING** | No horizontal scrolling card rows exist. | `dashboard-390.png`, `quests-390.png` | All content is forced into vertical column stacks on mobile. |

### 4.2 Glass & Translucency Assessment

```
Current App Card Anatomy:
┌────────────────────────────────────────────────────────┐
│  Card (border-glass-border / border-white/20)          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Nested Box (border-glass-border bg-obsidian-800) │  │
│  │ ┌──────────────────────────────────────────────┐ │  │
│  │ │ Sub-item (border border-glass-border)        │ │  │
│  │ └──────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
Result: 3 concentric 1px borders. "Box inside a box inside a box."
```

- **Translucency Inconsistency:** Card backgrounds range from `bg-white/[0.03]` (`Sidebar.jsx:106`) to `bg-obsidian-800/80` (`ShopItemCard.jsx:70`) to `bg-obsidian-900/95` (`BottomNav.jsx:34`). There is no defined material tier system.
- **Backdrop Blur Cost:** Excessive stack of `backdrop-blur-2xl` on the fixed HUD (`PlayerHud.jsx:65`) layered on top of `backdrop-blur-xl` on cards (`HabitCard.jsx:97`) causing compositing cost during fast scrolling on lower-end mobile GPUs.
- **Legibility over Artwork:** Because all in-app routes sit over a flat `#07080C` background, glass cards are currently filtering empty black pixels. When placed over video in Onboarding, contrast requires heavy dark vignettes (`OnboardingVideoBackground.jsx:84`).

### 4.3 Overlapping & Fanned Card Presentation

- **Stacked / Fanned Card Arc (North Star 2.2):** **COMPLETELY ABSENT**.
- **Observation:** In `client/src/pages/QuestsPage.jsx:218-245` and `client/src/pages/DashboardPage.jsx:110-180`, cards are locked into standard CSS CSS Grid layouts (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5`). No card has rotation, depth displacement, overlapping z-index, or arc scaling.

---

## Step 5 — App Shell, Navigation & Player HUD Audit

### 5.1 Desktop Navigation vs. Three-Zone Pattern (North Star 2.2)

```
North Star 2.2 Desktop Top Bar:
┌──────────────────────────────────────────────────────────────────────────────┐
│  [Nav: Dashboard Quests Shop]       [LifeOS Brand]      [(XP/G Pill) (Avatar)]│
└──────────────────────────────────────────────────────────────────────────────┘
   ^ Floating, rounded, low-contrast, 3-zone cluster over framed canvas

Current LifeOS Desktop Navigation:
┌──────┬───────────────────────────────────────────────────────────────────────┐
│ Life │ [Top HUD: Level (Avatar) [====XP====] [HP] [MP] [Gold] (Battle)]      │
│  OS  ├───────────────────────────────────────────────────────────────────────┤
│ ──── │                                                                       │
│ Dash │                                                                       │
│ Hab  │                          MAIN CONTENT AREA                            │
│ Dai  │                                                                       │
│ Que  │                                                                       │
│ Shop │                                                                       │
│ Foc  │                                                                       │
│ Ref  │                                                                       │
└──────┴───────────────────────────────────────────────────────────────────────┘
   ^ 1990s/2010s SaaS sidebar + full-width top slab header
```

- **Current State:** Desktop uses a fixed left vertical sidebar (`Sidebar.jsx`, 256px expanded / 80px collapsed) coupled with an edge-to-edge top header bar (`PlayerHud.jsx:61-73`).
- **Gap:** Desktop is built like a B2B SaaS dashboard, completely violating North Star 2.2's framed canvas with a floating 3-zone top bar.

### 5.2 Mobile Navigation vs. Floating Detached Pill (North Star 2.1)

- **Current State:** `BottomNav.jsx:28-38` is fixed directly to `bottom-0 inset-x-0` with `border-t border-glass-border`. It is an edge-welded dock that spans 100% of the screen width.
- **Gap:** North Star 2.1 demands a floating, detached, pill-shaped translucent bar inset from the screen edges (with content visibly scrolling under it). Current implementation is welded to the viewport glass.
- **Active State:** Current active indicator is a custom 16px wide underline pill (`bg-attr-perception w-4 h-0.5`, `BottomNav.jsx:65-68`). North Star 2.1 calls for icon fill + accent color without heavy background pills.

### 5.3 Player HUD Integration

- **Current Architecture:** Rendered in `AppShell.jsx:38-41` as a global component.
- **Visual Presentation:** Instead of an elegant status capsule, it is an opaque, dense header slab (`h-16 md:h-16`) containing 7 separate gauges and buttons competing for space.
- **Mobile Congestion:** Below 768px, `PlayerHud.jsx:155-250` renders in two stacked rows, consuming ~60px of vertical space at the top of every screen.

### 5.4 App Shell Routing & Animation Boundaries

- **State Persistence Across Routes:** `AppShell` remains mounted across internal routes (`App.jsx:42-53`). The top HUD and navigation do not re-mount when switching routes.
- **Route Change Animation:** There is **NO transition orchestration**. `<Routes>` (`App.jsx:43-50`) renders children directly with no `<AnimatePresence mode="wait">` or route-level motion keys. Navigation results in an abrupt hard-cut.

---

## Step 6 — Motion & Transition Audit (Highest Priority)

### 6.1 Complete Animation Inventory

| Trigger | Component / Path | Property Animated | Duration | Easing / Curve | Implementation Method | Layout-Triggering? |
|:---|:---|:---|:---|:---|:---|:---:|
| Hover | `Button.jsx:46` | `scale: 1.02` | ~150ms | `spring.snappy` (stiffness 500, damping 32) | Framer Motion `whileHover` | No |
| Press / Tap | `Button.jsx:46` | `scale: 0.96` | ~100ms | `spring.snappy` | Framer Motion `whileTap` | No |
| Hover | `ShopItemCard.jsx:66` | `y: -3` | ~200ms | `spring.snappy` | Framer Motion `whileHover` | No |
| Hover | `HabitCard.jsx:97` | `border-color` | 200ms | CSS `duration-200` | Tailwind CSS transition | No |
| Mount | `Modal.jsx:51-54` | `opacity: 0->1`, `scale: 0.96->1`, `y: 8->0` | ~200ms | `spring.snappy` | Framer Motion `modalPanel` | No |
| Exit | `Modal.jsx:24` | `opacity: 1->0`, `scale: 1->0.98`, `y: 0->4` | 120ms | `duration: 0.12` | Framer Motion `modalPanel.exit` | No |
| Collapse/Expand| `Sidebar.jsx:57-58` | `width: 80 <-> 256` | ~250ms | `spring.snappy` | Framer Motion `animate={{ width }}` | **YES (width)** |
| Margin Shift | `AppShell.jsx:55-60` | `margin-left: 80px <-> 256px` | 200ms | CSS `duration-200` | Tailwind `transition-[margin]` | **YES (margin)** |
| HUD Left Shift | `PlayerHud.jsx:66-72` | `left: 80px <-> 256px` | 200ms | CSS `duration-200` | Tailwind `transition-[left]` | **YES (left)** |
| Stat Fill | `StatBar.jsx:45` | `width: 0% -> X%` | 300ms | CSS `duration-300` | CSS inline style transition | **YES (width)** |
| Quest Progress | `QuestCard.jsx:224` | `width: 0% -> X%` | 300ms | CSS `duration-300` | CSS inline style transition | **YES (width)** |
| Daily Checkbox | `DailyCard.jsx:158` | `pathLength: 0 -> 1` | ~200ms | `spring.snappy` | Framer Motion `animate={{ pathLength }}` | No |
| Daily Ring | `DailyCard.jsx:133` | `strokeDashoffset` | ~250ms | `spring.snappy` | Framer Motion `animate` | No |
| Flame Idle | `HabitCard.jsx:124-133`| `scale: [1, 1.25, 1]`, `rotate: [-2, 2, -2]` | 1.6s | `repeat: Infinity, ease: 'easeInOut'` | Framer Motion continuous loop | No |
| Combat Text Spawn| `FloatingTextContainer.jsx:58-72` | `opacity: 0->1`, `y: 0->-28`, `scale: 0.8->1` | 900ms | `easeOut` | Framer Motion `animate` | No |
| Level Up Confetti| `LevelUpModal.jsx:55` | Canvas particles (120 particles) | ~2.5s | Physics decay curve | Canvas Confetti API | No |
| Level Count-Up | `LevelUpModal.jsx:88-96`| Integer number value interpolation | 1.0s | `easeOut` | Framer Motion `animate(val)` | No |
| Loot Drop Spawn| `LootDropPopup.jsx:52` | `opacity: 0->1`, `y: -40->0`, `scale: 0.95->1` | ~300ms | `spring.bouncy` (stiffness 300, damping 15) | Framer Motion `animate` | No |
| Onboarding Flight| `OnboardingPage.jsx:167`| Bezier path `(x, y, rotation, scale)` | 3.5s | Cubic Bezier evaluation | JavaScript `requestAnimationFrame` | No |
| Light Sweep | `OnboardingTransition.jsx:41`| `left: -30% -> 130%` | 600ms | `easeInOut` | Framer Motion `animate` | **YES (left)** |

### 6.2 The Ten RPG Feedback Moments Audit

| RPG Feedback Moment | Visual Feedback Today | Audio Feedback | Tactile / Haptic Feedback | Distance from North Star (Section 2.3 & 2.4) |
|:---|:---|:---|:---|:---|
| **1. Habit Scoring (+/-)** | Border flashes gold or crimson for 300ms (`HabitCard.jsx:100`); floating text rises from top HUD (`FloatingTextContainer.jsx:58`). | None | None | Floating text rises from the fixed top screen center rather than bursting from the tapped card. No directional particle trail. |
| **2. Daily Completion** | Checkmark path draws in (`pathLength 0->1`), circular ring shrinks (`strokeDashoffset`), title strikes through, border flashes vitality. Floating text rises from HUD. | None | None | Decent SVG stroke animation, but card stays in place. Lacks satisfaction pop, haptic impulse, or confetti spark. |
| **3. Quest Subtask Toggle**| Checkbox changes state; progress bar width shifts (`duration-300`). Floating text triggers if subtask grants XP. | None | None | Utilitarian. Feels like Jira rather than an RPG quest checklist. |
| **4. Quest Full Completion** | Title strikes through, card opacity drops to 75% (`QuestCard.jsx:202`). Floating text triggers for quest reward. | None | None | **CRITICAL GAP**: Completing an epic multi-day quest has zero cinematic celebration — no banner, no fan-fare, no fanfare sound. Identical to checking a grocery list item. |
| **5. Streak Increment** | Flame icon animates loop scale if streak >= 3 (`HabitCard.jsx:124`). Floating text spawns. | None | None | No burst moment when streak ticks from 6 to 7. Streak count simply increments silently. |
| **6. XP Gain** | HUD XP bar fills with CSS width transition (`StatBar.jsx:45`). Floating text "+XX XP". | None | None | Bar transition is linear and layout-triggering (`width`). No shimmer across the bar, no glowing leading edge. |
| **7. Level-Up** | Full-screen modal (`LevelUpModal.jsx:140`), 120-particle attribute confetti burst, Web Audio fanfare (`playSound('level_up')`), animated number count-up. | Web Audio fanfare (`sound.js:25`) | None | The ONLY complete celebration in the app. Matches spec, but modal styling uses generic box cards instead of a cinematic character halo. |
| **8. Focus Session Done** | Static card renders with "+XX MP" in cyan font (`FocusChamberPage.jsx:186`). | Web Audio chime | None | Disappointing payoff. No visual mana recharge surging into the avatar, no portal opening. |
| **9. Shop Purchase** | Toast notification (`Toast.jsx:76`), gold balance decrements on HUD. | None | None | Feels like an e-commerce checkout receipt. No loot chest pop, no item card flip, no equipment equip animation. |
| **10. Achievement Unlock**| **COMPLETELY ABSENT** | None | None | **100% UNIMPLEMENTED**. No achievement notification, badge unlock, or showcase animation exists in the client. |

### 6.3 Motion Gaps vs. iOS Parity (Section 2.4)

1. **Hard-Cutting Route Navigation:** Zero page transitions. Navigating between Dashboard, Habits, Quests, and Shop hard-cuts DOM nodes instantaneously without crossfade, slide, or directional continuity.
2. **Layout-Triggering Animations:** Five major animations drive `width`, `margin`, and `left` instead of GPU-composited `transform: translate3d()` and `opacity`.
3. **No Gesture Continuity:** Carousels and lists do not support drag-to-dismiss, interactive spring flicking, or momentum-based settle.
4. **Disconnected Combat Text:** Floating text spawns at a static coordinate (`top-16 left-1/2`) regardless of where the user clicked on the screen, breaking spatial continuity.

---

## Step 7 — Environment & Background Audit

| Environmental Dimension | Current Implementation | Concrete Evidence | Gap vs. North Star (Section 2.1 & 2.2) |
|:---|:---|:---|:---|
| **Animated Background Art** | Only `/onboarding` features an animated background: seamless looping HTML5 `<video>` (WebM/MP4, ~4MB, poster fallback). | `client/src/components/onboarding/OnboardingVideoBackground.jsx:54-74` | All authenticated routes (`/`, `/habits`, `/dailies`, `/quests`, `/shop`, `/focus`, `/reflection`) sit on a completely flat, static background. |
| **Route Mood Differentiation**| **COMPLETELY ABSENT**. Every in-app route shares the exact same `#07080C` obsidian background. | `client/src/components/layout/AppShell.jsx:27` (`bg-obsidian`) | A calm evening reflection, a deep focus session, an energetic quest board, and a reward shop look visually indistinguishable in atmosphere. |
| **Ambient Lighting / Texture** | Flat `#07080C`. Zero SVG noise filter, zero ambient glow orbs, zero parallax dust particles, zero vignette scrims on authenticated screens. | `client/src/index.css:94` | The UI feels like flat black cards sitting in an empty void. Depth from light (North Star 2.2) is impossible without background ambient gradients. |

---

## Step 8 — Page-by-Page Audit

### 8.1 Dashboard (`/`)
- **Composition & Cards:** 12-column grid (`DashboardPage.jsx:65-170`). Left column has Greeting + Habits list + Active Quests list. Right column has Radar chart + Stats pills + Streaks + Milestones.
- **Header Treatment:** Blocked by persistent top `PlayerHud` slab. Local page heading is a simple text string (`DashboardGreeting.jsx:28-36`).
- **Empty & Loading States:** Loading renders 3 pulsing skeleton cards (`DashboardPage.jsx:35-55`). Empty state shows text prompt.
- **Evidence Screenshots:** `dashboard-390.png`, `dashboard-1440.png`
- **Distance from North Star:** **Distant**. A standard SaaS dashboard grid. Completely lacks a cinematic hero spotlight (North Star 2.1) and lacks the signature fanned card arc on desktop (North Star 2.2).

### 8.2 Focus Chamber (`/focus`)
- **Composition & Cards:** Full-page standalone route without `AppShell` (`FocusChamberPage.jsx:1-395`). Centered circular SVG timer ring with duration presets (25/50/90 min).
- **Header Treatment:** Minimal local header with sound toggle, fullscreen button, and exit chevron (`FocusChamberPage.jsx:125-172`).
- **Color Discipline:** Severely broken — imports non-token `azure-` colors (`border-azure-500/30`, `text-azure-400`, `bg-azure-600`) and undeclared `obsidian-400`.
- **Evidence Screenshots:** `focus-390.png`, `focus-1440.png`
- **Distance from North Star:** **Moderate**. Layout is clean and focused, but atmosphere is sterile. Zero immersive particle/ambient environment art, and completion screen is a flat dialog box.

### 8.3 Quests (`/quests`)
- **Composition & Cards:** 2-column grid on desktop, 1-column on mobile (`QuestsPage.jsx:218-245`). Each quest is a massive 376-line `QuestCard` containing nested subtasks and milestone diamonds.
- **Header Treatment:** Static header row with title and "New Quest" pill button (`QuestsPage.jsx:116-138`).
- **Filter Tabs:** All, Active, Completed (`QuestsPage.jsx:170-198`).
- **Evidence Screenshots:** `quests-390.png`, `quests-1440.png`
- **Distance from North Star:** **Very Distant**. A flat board of rectangular boxes. Zero hero mission spotlight, zero fanned card presentation, and quest completion has zero game excitement.

### 8.4 Dailies (`/dailies`)
- **Composition & Cards:** Single vertical stack of `DailyCard` components (`DailiesPage.jsx:135-155`). Filter tabs for All / Incomplete / Completed.
- **Header Treatment:** Static header row with title, count badge, and "New Daily" button (`DailiesPage.jsx:75-95`).
- **Interaction Feedback:** Animated SVG checkmark and ring progress on completion.
- **Evidence Screenshots:** `dailies-390.png`, `dailies-1440.png`
- **Distance from North Star:** **Distant**. A standard vertical checklist. Lacks horizontal tile rows bleeding off the right edge (North Star 2.1) and lacks tactile swipe-to-complete interactions.

### 8.5 Habits (`/habits`)
- **Composition & Cards:** Single vertical list of `HabitCard` components with HTML5 drag-and-drop handles (`HabitsPage.jsx:130-150`).
- **Header Treatment:** Top stats overview (3 stat cards in a box) followed by filter tabs and list.
- **Tokens & Styling:** Uses undeclared phantom tokens `shadow-glass` and `bg-glass-border-strong`.
- **Evidence Screenshots:** `habits-390.png`, `habits-1440.png`
- **Distance from North Star:** **Distant**. Utilitarian list of bordered boxes. Lacks natural momentum, swipe physics, and horizontal sectioning.

### 8.6 Reward Shop (`/shop`)
- **Composition & Cards:** 3-column grid on desktop, 1-column on mobile (`ShopPage.jsx:220-250`). Category tabs, search bar, gold balance counter, and inventory drawer trigger.
- **Header Treatment:** Static header row with gold balance and buttons.
- **Evidence Screenshots:** `shop-390.png`, `shop-1440.png`
- **Distance from North Star:** **Distant**. Resembles an e-commerce storefront. Missing 3D item pedestals, rarity illumination beams, and celebratory unboxing moments.

### 8.7 Profile & Character Progression
- **Composition:** **NO DEDICATED PROFILE PAGE**. Identity is buried inside `AttributesDrawer.jsx` (opened from the HUD avatar).
- **Evidence Screenshots:** Visible only via drawer overlay in `dashboard-1440.png`.
- **Distance from North Star:** **Critical Gap**. Lacks a dedicated character screen, visual avatar doll, achievement showcase, and long-term progression timeline.

### 8.8 Onboarding (`/onboarding`)
- **Composition:** Full-screen looping fantasy landscape background video, minimal top bar, center motivational hero, and signature 3D paper airplane flight journey into authentication.
- **Evidence Screenshots:** `onboarding-390.png`, `onboarding-1440.png`
- **Distance from North Star:** **Closest to North Star**. Successfully demonstrates full-bleed media, layered lighting, glass CTA morph, and custom motion physics. Lacks character class selection and interactive quest seeding.

### 8.9 Global Overlays
- **Modals:** 7 distinct implementations with duplicate code and inconsistent blur values.
- **Drawers:** Slide-in panels for Attributes, Battle Log, and Inventory with hardcoded widths (`w-80`, `w-96`, `w-full sm:w-[480px]`).
- **Distance from North Star:** **Distant**. Missing unified drawer/sheet primitive and lacks Apple-style fluid gesture pull-to-dismiss.

---

## Step 9 — Responsive Architecture Audit

### 9.1 Purpose-Built vs. Shrunk Layouts

| Screen / Area | Phone (390px) Layout Architecture | Desktop (1440px / 1920px) Layout Architecture | Diagnosis |
|:---|:---|:---|:---|
| **Player HUD** | 2-row compressed stack (`PlayerHud.jsx:155-250`) | Single row fixed slab (`PlayerHud.jsx:75-150`) | **Shrunk & Stacked**: Mobile is a compressed desktop HUD eating 60px of vertical space. |
| **Quests Board** | `grid-cols-1` stacked list (`QuestsPage.jsx:220`) | `grid-cols-2` grid (`QuestsPage.jsx:220`) | **Simply Stacked**: Mobile is an uninspired vertical stack of identical cards. |
| **Dashboard** | `flex flex-col` stacked columns | 12-column grid (`DashboardPage.jsx:65`) | **Reflowed**: Mobile simply stacks 12 columns into 1 column. |
| **Shop** | `grid-cols-1` stacked cards (`ShopPage.jsx:220`) | `grid-cols-3` grid (`ShopPage.jsx:220`) | **Reflowed**: Stacks 3 columns into 1 column. |

### 9.2 Touch-Target Violations (< 44×44px on Mobile)

| Component Path | Element Description | Actual Measured Dimensions | Concrete Line Number | Severity |
|:---|:---|:---|:---|:---:|
| `client/src/components/shop/ShopItemCard.jsx` | Options dropdown trigger button | **28 × 28 px** (`p-1.5`) | Line 120 | **BLOCKING** |
| `client/src/components/shop/ShopItemModal.jsx` | Modal close icon button | **28 × 28 px** (`p-1.5`) | Line 110 | **BLOCKING** |
| `client/src/components/quests/QuestCard.jsx` | Quest menu trigger button | **28 × 28 px** (`p-1.5`) | Line 156 | **BLOCKING** |
| `client/src/components/quests/QuestCard.jsx` | Subtask checklist toggle button | **~24 px height** (`py-1 text-xs`) | Line 258 | **BLOCKING** |
| `client/src/components/quests/QuestCard.jsx` | Subtask delete button | **24 × 24 px** (`p-1`) | Line 300 | **BLOCKING** |
| `client/src/components/shop/ItemInspectionModal.jsx` | Close icon button | **28 × 28 px** (`p-1.5`) | Line 148 | **BLOCKING** |
| `client/src/components/reflection/ConsistencyHeatmap.jsx`| Day activity grid cell buttons | **14 × 14 px** (`w-3.5 h-3.5`) | Line 91 | **BLOCKING** |
| `client/src/components/hud/PlayerHud.jsx` | Battle Log drawer trigger button | **32 × 32 px** (`p-1.5`) | Line 140 | HIGH |

### 9.3 Safe-Area Handling

- `BottomNav.jsx:37` specifies `style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}`.
- **GAP:** `PlayerHud.jsx` at the top of the viewport has **NO** `env(safe-area-inset-top)` support. On notched iPhones and dynamic island devices, the top HUD content clips directly into the hardware sensor notch and status bar clock.

---

## Step 10 — Performance Audit

### 10.1 Concrete Metrics Summary

| Metric | Measured Value | Target Threshold | Status | Evidence Source |
|:---|:---:|:---:|:---:|:---|
| **Production Client Bundle** | **2,754.00 kB** (1,042.38 kB gzip) | < 500 kB uncompressed | **FAILED** | `client/dist/assets/index-*.js` (Vite build output) |
| **CSS Production Bundle** | **113.39 kB** (15.48 kB gzip) | < 50 kB gzip | **PASSED** | `client/dist/assets/index-*.css` |
| **Dashboard DOM Node Count** | **503 nodes** | < 800 nodes | **PASSED** | `audit/perf/dom_counts.json` |
| **Shop DOM Node Count** | **311 nodes** | < 600 nodes | **PASSED** | `audit/perf/dom_counts.json` |
| **Sustained Scroll FPS** | **145 FPS** (290 frames / 2001ms) | 60 / 120 FPS | **PASSED** | `audit/perf/fps_measurement.json` |
| **Dashboard Initial Mount Layouts**| **113 Layouts** (27ms total) | < 50 Layouts | WARNING | `audit/perf/dashboard_initial_load.json` |
| **Dashboard Style Recalculations** | **234 Recalcs** (88ms total) | < 100 Recalcs | WARNING | `audit/perf/dashboard_initial_load.json` |
| **Route Switch Style Recalcs** | **540 Recalcs** (329ms total) | < 150 Recalcs | **FAILED** | `audit/perf/route_change_dashboard_to_quests.json` |
| **Long Tasks on Initial Mount** | **9 Tasks > 50ms** (Peak: 288ms) | 0 Tasks > 50ms | **FAILED** | `audit/perf/dashboard_initial_load.json` |

### 10.2 Bundle Bloat Root Cause Analysis

The 2.75 MB monolithic bundle is driven by two un-split dependencies:
1. `@zxcvbn-ts/language-en` + `@zxcvbn-ts/core` (~800 kB uncompressed dictionary): Imported statically into `PasswordMeter.jsx` and bundled into the entry chunk, forcing every user on `/` to download the entire English dictionary on initial load.
2. `recharts` (~500 kB): Imported statically into `CharacterRadarChart.jsx` instead of lazy-loaded via `React.lazy()`.
3. Complete absence of route-level code-splitting (`React.lazy` / dynamic `import()`) in `App.jsx`.

---

## Step 11 — Accessibility Audit

| Area | Current Implementation Status | Specific Violations & Evidence | Severity |
|:---|:---|:---|:---:|
| **Keyboard Traversal** | Partial. Basic Tab traversal works, but Modals lack focus traps — pressing Tab in `HabitModal` or `QuestModal` tabs through hidden background elements. | `HabitModal.jsx:200`, `QuestModal.jsx:105`, `Modal.jsx:32` | **BLOCKING** |
| **Focus-State Visibility** | `Button.jsx:56` defines `focus-visible:outline-glass-border`. However, multiple raw buttons use `focus:outline-none` with no ring replacement. | `ShopItemCard.jsx:120`, `QuestCard.jsx:260` | HIGH |
| **Contrast over Translucent Surfaces** | `text-ink-muted/50` on `bg-obsidian-800` produces **2.8:1 contrast** (fails WCAG AA 4.5:1 requirement). | `HabitModal.jsx:84`, `DailyModal.jsx:125` | HIGH |
| **Contrast over Stat Gauges** | Small white typography (`text-[9px]`) over gold XP and yellow gold bars fails contrast (< 3.0:1). | `StatBar.jsx:48-52` | HIGH |
| **Heading Hierarchy** | Skips `<h2>` directly from `<h1>` to `<h3>` across multiple pages. | `ShopPage.jsx:100, 162`, `QuestsPage.jsx:117, 201`, `HabitsPage.jsx:52, 106` | MEDIUM |
| **Semantic ARIA** | `aria-modal="true"` and `role="dialog"` present in `Modal.jsx`, but missing in `DailyModal`, `QuestModal`, and `ShopItemModal`. | `DailyModal.jsx:274`, `QuestModal.jsx:105` | HIGH |
| **Form Labelling** | Input fields lack explicit `<label htmlFor="...">` associations, relying solely on `placeholder` text. | `HabitModal.jsx:80-86`, `DailyModal.jsx:120-128`, `QuestModal.jsx:140-148` | HIGH |

---

## Step 12 — Consistency Register

| System | Issue Description | Concrete Evidence | Severity |
|:---|:---|:---|:---:|
| **Shadows** | Phantom token `shadow-glass` used across 13 locations; undeclared in `@theme` and compiles to empty string. | `HabitsPage.jsx:60, 69, 73, 80, 97, 116, 129`, `HabitModal.jsx:118, 145, 171`, `HabitCard.jsx:97`, `Toast.jsx:76` | **BLOCKING** |
| **Shadows** | Phantom token `shadow-modal` used across 2 locations; undeclared in `@theme`. | `DailyModal.jsx:292`, `DailyCard.jsx:285` | **BLOCKING** |
| **Breakpoints** | Documented design rule claims `sm: 375px`, `lg: 1440px`. Never defined in `@theme`; Tailwind v4 uses 640px and 1024px. | `.agent/rules/10-design-system.md:49` vs `client/src/index.css:10-56` | **BLOCKING** |
| **Corner Radius** | Three different corner radiuses used for identical card containers (`rounded-xl: 12px`, `rounded-2xl: 16px`, `rounded-panel: 18px`). | `ShopItemCard.jsx:87` (12px), `QuestCard.jsx:119` (16px), `EveningReflectionCard.jsx:83` (18px) | **BLOCKING** |
| **Touch Targets** | Options menu triggers and modal close buttons measure 24–28px, violating 44px mobile minimum. | `ShopItemCard.jsx:120` (28px), `QuestCard.jsx:156` (28px), `ShopItemModal.jsx:110` (28px) | **BLOCKING** |
| **Primitives** | Seven distinct modals independently re-implement backdrops, escape keys, and animations instead of using canonical `Modal.jsx`. | `HabitModal.jsx:200`, `DailyModal.jsx:274`, `QuestModal.jsx:105`, `ShopItemModal.jsx:95`, `AuthModal.jsx:145` | **BLOCKING** |
| **Navigation** | Desktop navigation built as a fixed SaaS vertical sidebar instead of floating 3-zone top bar. | `Sidebar.jsx:50-59` vs Section 2.2 North Star | **BLOCKING** |
| **Navigation** | Mobile bottom nav welded edge-to-edge to bottom window border instead of floating detached pill. | `BottomNav.jsx:28-38` vs Section 2.1 North Star | **BLOCKING** |
| **Colors** | Ad-hoc un-themed `azure-` colors and `obsidian-400` used in Focus Chamber. | `FocusChamberPage.jsx:186, 188, 198, 202, 214` | HIGH |
| **Motion** | Route transitions hard-cut with zero spatial or directional animation. | `App.jsx:43-50` | HIGH |
| **Motion** | Inconsistent card hover physics (`whileHover: { y: -3 }` in Shop vs border flash in Habits vs none in Quests). | `ShopItemCard.jsx:66`, `HabitCard.jsx:97`, `QuestCard.jsx:119` | HIGH |
| **RPG Moments** | Full quest completion has zero celebration or fanfare; identical to checking an item off a todo list. | `QuestCard.jsx:200-210` | HIGH |
| **Typography** | Predefined type tokens (`.text-display-md/sm`) bypassed in favor of raw ad-hoc font sizing strings. | `QuestsPage.jsx:117`, `HabitsPage.jsx:52`, `ShopPage.jsx:100` | MEDIUM |
| **Glass Opacity** | Over 12 arbitrary opacity floats used for glass panels (`0.03`, `0.05`, `0.07`, `0.08`, `0.10`, `0.14`, `0.20`, etc.). | `Card.jsx:23`, `Sidebar.jsx:106`, `OnboardingTopBar.jsx:29`, `OnboardingHero.jsx:194` | MEDIUM |
| **Safe Area** | Missing `env(safe-area-inset-top)` on top Player HUD, causing notch overlap on iOS. | `PlayerHud.jsx:61-73` | MEDIUM |
| **Accessibility** | Form fields lack explicit `<label>` elements, relying entirely on input placeholders. | `HabitModal.jsx:80`, `DailyModal.jsx:120`, `QuestModal.jsx:140` | MEDIUM |
| **Bundle Size** | Monolithic 2.75 MB JavaScript bundle due to un-split dependencies and lack of route lazy-loading. | `client/dist/assets/index-*.js` | MEDIUM |

---

## Step 13 — Global vs. Page-Specific Classification

### A. Current State (Factual)

- **Currently Shared (Global):**
  - Design tokens in `index.css` (partially applied, heavily bypassed).
  - `AppShell`, `PlayerHud`, `Sidebar`, `BottomNav`.
  - Floating combat text portal (`FloatingTextContainer`).
  - Level-up celebration modal (`LevelUpModal`) and Loot drop popup (`LootDropPopup`).
  - Canonical primitives in `components/ui/` (`Button`, `Card`, `Badge`, `Modal`, `Toast`).
- **Currently Local (Page-Specific):**
  - Form modals (`HabitModal`, `DailyModal`, `QuestModal`, `ShopItemModal`).
  - Card implementations (`HabitCard`, `DailyCard`, `QuestCard`, `ShopItemCard`).
  - Drawers (`AttributesDrawer`, `BattleActivityDrawer`, `InventoryDrawer`).
  - Empty states, loading skeletons, and filter tab bars.

### B. Recommended Target (Analysis & Rationale)

```
Target Architecture Split:
┌────────────────────────────────────────────────────────────────────────┐
│ UNIFIED GLOBALLY                                                       │
│ - Design Tokens (@theme colors, 4/8pt spacing, display typography)      │
│ - Canonical UI Primitives (Button, Card tiers, Modal, Sheet, Input)   │
│ - Motion Physics (spring tokens, directional route transitions)        │
│ - Navigation Shell (Floating 3-zone top bar, Floating detached nav pill)│
│ - Accessibility & Focus Rings (44px touch targets, focus trapping)    │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ drives & constrains
┌────────────────────────────────────▼───────────────────────────────────┐
│ AUTHOR-SPECIFIC (PAGE-LOCAL)                                           │
│ - Ambient Atmosphere (Mood lighting, particle field, parallax texture) │
│ - Hero Composition (Intention spotlight vs Quest board vs Focus timer) │
│ - Feedback Character (Zen chime in Focus vs Epic fanfare in Quests)    │
│ - Interactive Domain Mechanics (Draggable habits vs Milestone diamonds)│
└────────────────────────────────────────────────────────────────────────┘
```

1. **Must Be Unified Globally:**
   - **Token System:** Strict `@theme` definition for colors, true mobile/desktop breakpoints, and formal 4pt/8pt spacing. *Rationale:* Eliminates phantom classes and stops typography drift.
   - **Card & Surface Primitives:** Replace 2-variant `Card.jsx` with a 9-tier card system (`surface`, `interactive`, `elevated`, `featured`, `compact`, etc.). *Rationale:* Removes box-in-a-box border clutter and guarantees unified 18px panel / 12px tile radii.
   - **Overlay System (Modal & Sheet):** Refactor all 7 modals to wrap a single, accessible `Modal` primitive with true focus trapping. *Rationale:* Fixes keyboard trapping, escape handling, and backdrop blur across the entire app at once.
   - **App Shell & Floating Navigation:** Implement North Star 2.1 floating pill on mobile and North Star 2.2 floating 3-zone bar on desktop. *Rationale:* Frees viewport edges to allow full-bleed hero artwork.
   - **Motion Language:** Unified spring physics (`spring.snappy/bouncy/gentle`) and directional page transitions. *Rationale:* Eliminates hard-cutting navigation and jarring instant state swaps.

2. **Must Remain Page-Specific:**
   - **Environmental Mood & Ambient Texture:** Deep indigo/violet calm for Reflection, cyan laser grid/clean vacuum for Focus Chamber, gold ember particles for Reward Shop, and mountain twilight for Dashboard/Quests. *Rationale:* Unifying backgrounds flattens the game world into a generic corporate template.
   - **Hero Block Composition:** Daily quest spotlight on Dashboard, circular work ring in Focus Chamber, fanned mission arc on Quests. *Rationale:* Each screen has a fundamentally distinct operational purpose.
   - **Feedback Character:** A quiet breath chime for completing a focus session; an explosive golden fanfare and loot roll for completing an epic multi-stage quest. *Rationale:* Over-homogenizing feedback destroys RPG game satisfaction.

---

## Step 14 — Prioritized Opportunity List & Roadmap Critique

### 14.1 Ranked Opportunity Register

| Rank | Opportunity / Gap Area | Visual / Experiential Impact (1-5) | Implementation Effort (1-5) | Risk to Existing Logic (1-5) | Phase Mapping |
|:---:|:---|:---:|:---:|:---:|:---:|
| **1** | **Design Token Foundation & Phantom Cleanup:** Resolve phantom tokens (`shadow-glass`, `shadow-modal`), define missing spacing and typography scale, and align `@theme` breakpoints to actual 375/768/1440px. | 5 | 2 | 1 | **Phase 1** (Design System) |
| **2** | **App Shell & Floating Navigation Overhaul:** Replace fixed SaaS sidebar and bottom slab with North Star 2.2 floating 3-zone desktop bar and North Star 2.1 detached mobile pill. | 5 | 3 | 2 | **Phase 2** (Shell & Navigation) |
| **3** | **Directional Route Transitions:** Introduce `<AnimatePresence mode="wait">` route orchestration in `App.jsx` with spatial directional sliding. | 5 | 2 | 2 | **Phase 3** (Page Transitions) |
| **4** | **Card Primitive Tier System:** Expand `Card.jsx` into a 9-tier hierarchy and replace ad-hoc card boxes across Habits, Dailies, and Quests. | 4 | 3 | 2 | **Phase 1** (Design System) |
| **5** | **Modal & Overlay Consolidation:** Refactor all 7 ad-hoc modals to wrap canonical `Modal.jsx` with accessible focus trapping. | 4 | 3 | 2 | **Phase 10** (Overlays) *-> Recommended: Move earlier* |
| **6** | **Desktop Fanned Card Arc:** Implement the signature fanned, overlapping 3D card carousel on Quests and Dashboard. | 5 | 4 | 2 | **Phase 6** (Quests) & **Phase 12** (Large Screen) |
| **7** | **Mobile Touch Targets & Safe Areas:** Elevate all sub-44px options and action buttons to 44×44px; add `env(safe-area-inset-top)` to top HUD. | 4 | 2 | 1 | **Phase 11** (Mobile Pass) *-> Recommended: Move earlier* |
| **8** | **Bundle Splitting & Lazy Loading:** Lazy-load `@zxcvbn-ts`, `recharts`, and routes to reduce initial 2.75 MB bundle to < 500 kB. | 4 | 2 | 1 | **Phase 15** (Performance) *-> Recommended: Move earlier* |
| **9** | **Epic Quest Completion Celebration:** Build a high-satisfaction celebration moment for full quest completion (fanfare, banner, audio). | 5 | 3 | 1 | **Phase 6** (Quests) |
| **10**| **Per-Route Ambient Environments:** Introduce distinct ambient moods (vignettes, particle textures, subtle glows) per feature area. | 4 | 3 | 1 | **Phase 13** (Environments) |

### 14.2 Roadmap Sequencing Critique & Recommendations

The existing 17-phase roadmap is structured as:
`1 Tokens -> 2 Shell/Nav -> 3 Transitions -> 4 Dashboard -> 5 Focus -> 6 Quests -> 7 Dailies/Habits -> 8 Shop -> 9 Profile -> 10 Overlays -> 11 Mobile -> 12 Desktop -> 13 Environments -> 14 Micro -> 15 Perf -> 16 A11y -> 17 Polish`

Based on concrete findings in this audit, **three critical sequence adjustments** are strongly recommended:

1. **Move Phase 10 (Overlays) to Phase 3.5 (Immediately After Shell/Transitions):**
   - *Why:* Habits (Phase 7), Quests (Phase 6), Shop (Phase 8), and Focus (Phase 5) all feature complex custom modals (`HabitModal`, `DailyModal`, `QuestModal`, `ShopItemModal`). Redesigning pages in Phases 4–9 while leaving modals to Phase 10 forces developers to either touch modals twice or leave broken legacy modals on newly redesigned pages. Unifying `Modal.jsx` and `Drawer.jsx` first unblocks every subsequent page phase.
2. **Move Sub-44px Touch Targets & Safe-Area Fixes from Phase 11 into Phase 1 & 2:**
   - *Why:* Touch targets are fundamental component geometry. Modifying button paddings in Phase 11 will break card alignments and layouts authored in Phases 4–8. 44px minimums must be baked into the Phase 1 `Button` primitive and Phase 2 `PlayerHud`.
3. **Move Bundle Splitting from Phase 15 into Phase 1 or 2:**
   - *Why:* Splitting `@zxcvbn-ts` and adding `React.lazy` route code-splitting is a low-risk, 30-minute task that immediately cuts initial bundle size from 2.75 MB down to ~450 kB, dramatically speeding up HMR, development iteration, and DevTools profiling across all subsequent phases.
