# LifeOS — Phase 3 Implementation Report
## Spatial Page Transitions & Card-Driven Navigation

**Phase:** Phase 3 — Spatial Navigation & Motion Architecture  
**Status:** Complete  
**Date:** September 18, 2026  

---

### Section 1: Route Relationship Map

Phase 3 establishes a canonical Information Architecture (IA) depth and spatial relationship map in `client/src/lib/routeRelationships.js`. This serves as the single source of truth for all directional motion and depth perception across LifeOS.

| Route | IA Depth | Type | Sibling Index | Label | Transition Relationship |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `/` | 1 | `root` | 0 | Dashboard | Primary Canvas Sibling |
| `/dashboard` | 1 | `root` | 0 | Dashboard | Canonical Alias / Redirect to `/` |
| `/habits` | 1 | `root` | 1 | Habits | Primary Canvas Sibling |
| `/dailies` | 1 | `root` | 2 | Dailies | Primary Canvas Sibling |
| `/quests` | 1 | `root` | 3 | Quests | Primary Canvas Sibling |
| `/shop` | 1 | `root` | 4 | Shop | Primary Canvas Sibling |
| `/profile` | 1 | `root` | 5 | Profile | Primary Canvas Sibling |
| `/reflection` | 1 | `calm` | 6 | Reflection | Lateral Calm (Gentle Settle) |
| `/focus` | 2 | `deeper` | — | Focus Chamber | Deepen Push (Scale/Blur chamber entrance) |
| `/onboarding` | — | `excluded` | — | Onboarding | Zero spatial movement (standalone) |
| `/auth/callback` | — | `excluded` | — | OAuth Callback | Zero spatial movement (instant) |
| `/dev/*` | — | `excluded` | — | Dev Galleries | Zero spatial movement (instant) |

---

### Section 2: Transition Variants Implemented

All transition variants live in `client/src/lib/pageTransitionVariants.js` and consume the Phase 1 spring physics tokens (`spring.snappy`, `spring.smooth`, `spring.settle`):

1. **`siblingSlide` (Root-to-Root Navigation):**
   - **Horizontal displacement:** Moving forward shifts exiting view to `x: -32px` (desktop) / `-100%` (mobile) with opacity `1 -> 0`. Entering view shifts in from `x: 32px` (desktop) / `100%` (mobile) to `x: 0` with opacity `0 -> 1`.
   - **Scale depth:** Subtle depth scale (`scale: 0.985` on exit, `0.99 -> 1.0` on entrance) to create tactile native layering without motion sickness.
   - **Spring physics:** Consumes `spring.snappy` (`stiffness: 400`, `damping: 30`, `mass: 0.8`).

2. **`deepenPush` (Root-to-Deeper Navigation into `/focus`):**
   - **Entrance into Chamber:** Canvas recedes with subtle scale-down (`scale: 0.96`), gentle blur (`filter: blur(8px) -> blur(0px)`), and gentle rise (`y: 20px -> 0px`).
   - **True Spatial Inverse (Exit Chamber / Back-Out):** Chamber descends downward (`y: 20px`) and fades out, while the background root canvas scales back up from `0.96 -> 1.0` and clears from blur to sharp.
   - **Spring physics:** Consumes `spring.smooth` (`stiffness: 300`, `damping: 28`, `mass: 1.0`).

3. **`lateralCalm` (Any-to-Calm Navigation for `/reflection`):**
   - **Gentle Settle:** Zero aggressive sliding. Pure atmospheric breathing room with subtle vertical drift (`y: 8px -> 0px`) and smooth opacity cross-fade (`opacity: 0 -> 1`).
   - **Spring physics:** Consumes `spring.settle` (`stiffness: 180`, `damping: 24`, `mass: 1.0`).

4. **`none` (Fallback & Accessibility):**
   - Pure instantaneous fade transition (`opacity: 0 -> 1` over 120ms) used for direct deep links, hard reloads, and `prefers-reduced-motion: reduce`.

---

### Section 3: Navigation-Direction Handling

The navigation transition architecture does **NOT** naively guess direction based on route index alone:
1. **Actual Browser Navigation History (`PUSH` vs `POP`):**
   - `NavigationTransitionContext.jsx` observes both `navigationType` from React Router v7 (`PUSH`, `POP`, `REPLACE`) and the numeric index delta stored in `window.history.state.idx`.
   - When the user presses the browser Back button or invokes `navigate(-1)`, `navigationType === 'POP'` and `historyDelta < 0` triggers an explicit history Back animation regardless of destination URL.
2. **Sibling Canvas Axis for `PUSH` Navigation:**
   - When moving forward via links, buttons, or programmatically, direction is resolved from the stable sibling ordering on the horizontal canvas axis (`toIndex >= fromIndex ? 1 : -1`).
3. **Scroll & Focus Reset:**
   - Upon route transition start, `window.scrollTo({ top: 0, left: 0, behavior: 'instant' })` resets the scroll position to prevent scroll-anchor jumps.
   - Upon transition completion, focus moves smoothly to the page's primary `<h1>` heading (or `#page-stage`), ensuring screen-reader accessibility and keyboard navigation flow.

---

### Section 4: Shell Persistence Verification

A core mandate of Phase 2 and Phase 3 is that the **AppShell chrome must survive every transition untouched**:
- Desktop top 3-zone command bar (identity, player badge, navigation pill, and combat telemetry) and mobile top HUD / bottom floating pill remain mounted across all route transitions.
- **Verification Method:** Verified using headless Chromium via Puppeteer.
- **Results:**
  - Initial mount count on app boot: `1` (or `2` in dev React 19 `StrictMode`).
  - Navigating between `Dashboard -> Habits -> Dailies -> Quests -> Shop -> Focus -> Reflection -> Dashboard`:
    - Shell mount count: **2 throughout all navigations** (`0` unmounts, `0` remounts).
    - Status: **PASSED (100% Persistence)**.
- **Drawer / Modal Auto-Close:** Open modal dialogs (`AuthModal`) and HUD drawers (`AttributesDrawer`, `BattleActivityDrawer`) auto-dismiss instantly upon route change via route listeners.

---

### Section 5: Performance Results

- **Properties Animated:** Strictly GPU-composited properties (`transform`, `opacity`, `filter`). No layout thrashing (`width`, `height`, `margin`, `padding` are completely un-animated).
- **Blur Restraint:** Limited to $\le 2$ surfaces (`filter: blur(8px)`) exclusively during `deepenPush` transitions.
- **Hardware Acceleration:** Managed `will-change: transform, opacity` applied exclusively during the active animation window and cleanly unset on `onAnimationComplete`.
- **Bundle & Production Build:**
  - `oxlint`: Passed with 0 errors.
  - `vite build`: Succeeded in 1.01s.
  - Route code-splitting with `lazy()` and `Suspense` preserves initial bundle budget.

---

### Section 6: Files Changed / Added

#### Added:
1. `client/src/lib/routeRelationships.js`: IA depth hierarchy, sibling indices, and relationship resolver.
2. `client/src/lib/pageTransitionVariants.js`: Spring-driven Framer Motion transition variant definitions.
3. `client/src/context/navigationTransitionContextDefinition.js`: Pure context definition file for Vite Fast Refresh compliance.
4. `client/src/context/NavigationTransitionContext.jsx`: Navigation tracking provider (history delta, navigation type, scroll reset).
5. `client/src/hooks/useNavigationTransition.js` & `client/src/hooks/useNavigationTransition.jsx`: Transition consumer hooks.
6. `client/src/components/transitions/PageTransition.jsx`: Canonical motion wrapper with focus management, `aria-hidden` management, and GPU optimization.
7. `client/src/components/transitions/index.js`: Barrel export for transition primitives.

#### Modified:
1. `client/src/App.jsx`: Wrapped protected routes inside `NavigationTransitionProvider`, `AppShell`, `AnimatePresence mode="popLayout"`, and `PageTransition key={location.pathname}`. Added explicit `/dashboard` redirect and fallback routes.
2. `client/src/components/layout/AppShell.jsx`: Configured `#page-stage` with `overflow-x-clip`, added modal route dismissal on navigation.
3. `client/src/components/hud/PlayerHud.jsx`: Added drawer route dismissal on navigation.

---

### Section 7: Notes for Phase 4

1. **Dashboard Stage Mount:**
   The Dashboard is mounted as the root sibling (`/` and `/dashboard`) at IA depth 1. In Phase 4, the internal dashboard grid (Daily Rituals, Quests, Habit streaks, Attribute radar, Rest banner) will render directly into the stable `#page-stage` without modifying the outer spatial transition wrapper.
2. **Interruptibility:**
   `AnimatePresence mode="popLayout"` ensures that rapid user clicking between tabs immediately interrupts outgoing exit animations without visual stacking or clipping artifacts.
3. **Chamber Isolation:**
   The Focus Chamber (`/focus`) now participates in the spatial depth architecture via `deepenPush` and true spatial inverse exiting back to the canvas.
