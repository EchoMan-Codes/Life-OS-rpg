# LifeOS — Primitive Migration Backlog (§14)

This document tracks all remaining raw `<button>` elements, ad-hoc card containers, and ad-hoc modals across the application. Per Phase 1 bounded migration boundaries, these items are inventoried here and grouped by the future phase that will naturally touch and refactor each surface.

---

## 1. Phase 3.5 — Overlays & Modals Consolidation

All form modals and overlay sheets should be refactored to wrap the canonical `Modal` and `Sheet` primitives (`client/src/components/ui/Modal.jsx` and `Sheet.jsx`) to inherit keyboard focus trapping, Escape key handling, and zero-layout-shift scroll locking.

| File Path | Element / Component | Current Implementation | Target Primitive Replacement |
|:---|:---|:---|:---|
| `client/src/components/habits/HabitModal.jsx` | Dialog container & backdrop | Ad-hoc `fixed inset-0` div + raw form buttons | `<Modal size="md">` + `<Button>` + `<Input>` |
| `client/src/components/dailies/DailyModal.jsx` | Dialog container & backdrop | Ad-hoc `fixed inset-0` div + raw form buttons | `<Modal size="md">` + `<Button>` + `<Input>` |
| `client/src/components/quests/QuestModal.jsx` | Dialog container & backdrop | Ad-hoc `fixed inset-0` div + raw form buttons | `<Modal size="lg">` + `<Button>` + `<Input>` |
| `client/src/components/shop/ShopItemModal.jsx`| Dialog container & backdrop | Ad-hoc `fixed inset-0` div + raw form buttons | `<Modal size="md">` + `<Button>` + `<Input>` |
| `client/src/components/shop/ItemInspectionModal.jsx` | Dialog container & backdrop | Ad-hoc `fixed inset-0` div | `<Modal size="md">` + `<Button>` |
| `client/src/components/celebration/LevelUpModal.jsx` | Dialog container & backdrop | Ad-hoc celebration modal | `<Modal size="lg">` + `<Button>` |
| `client/src/components/celebration/LootDropPopup.jsx` | Popup overlay | Ad-hoc popup div | `<Modal size="sm">` + `<Button>` |
| `client/src/components/dashboard/DashboardCustomizerModal.jsx` | Dialog container | Ad-hoc customizer modal | `<Modal size="md">` + `<Button>` |

---

## 2. Phase 4 — Dashboard Page & Widgets

| File Path | Element / Control | Current Implementation | Target Primitive Replacement |
|:---|:---|:---|:---|
| `client/src/components/dashboard/FocusCommandSection.jsx` | Start Focus Session CTA | Raw `<button>` with inline padding | `<Button variant="primary" size="md">` |
| `client/src/components/dashboard/GoalsProgressSection.jsx` | Add Goal CTA | Raw `<button>` icon control | `<Button variant="ghost" size="sm" iconOnly>` |
| `client/src/components/dashboard/HabitsFocusSection.jsx` | Quick score steppers | Raw `<button>` plus/minus controls | `<Button size="xs">` with `hit-area-expand` |
| `client/src/components/dashboard/TodayPrioritiesSection.jsx` | Priority task checkboxes | Raw `<button>` check circle | `<Checkbox>` primitive |
| `client/src/components/dashboard/TodayTimelineSection.jsx` | Timeline action links | Raw `<button>` controls | `<Button variant="ghost" size="sm">` |

---

## 3. Phase 5 — Focus Chamber

| File Path | Element / Control | Current Implementation | Target Primitive Replacement |
|:---|:---|:---|:---|
| `client/src/pages/FocusChamberPage.jsx` | Play / Pause Timer CTA | Large raw circular `<button>` | `<Button variant="primary" size="lg" iconOnly>` |
| `client/src/pages/FocusChamberPage.jsx` | Preset Duration Chips | Raw pill `<button>` elements | `<Tabs>` or `<Button variant="secondary" size="sm">` |
| `client/src/pages/FocusChamberPage.jsx` | Ambient Sound Toggles | Raw icon `<button>` elements | `<Toggle>` or `<Button variant="ghost">` |

---

## 4. Phase 6 — Quests Board & Milestone Arcs

| File Path | Element / Control | Current Implementation | Target Primitive Replacement |
|:---|:---|:---|:---|
| `client/src/components/quests/QuestCard.jsx` | Subtask checklist items | Raw check `<button>` elements | `<Checkbox>` primitive |
| `client/src/components/quests/QuestCard.jsx` | Card option dropdown | Raw `<button>` controls | `<Button variant="ghost" size="xs">` |
| `client/src/components/quests/QuestItemRow.jsx`| Delete subtask button | Raw `<button>` with `<Trash2>` | `<Button variant="destructive" size="xs" iconOnly>` |
| `client/src/pages/QuestsPage.jsx` | Filter tab chips | Raw `<button>` pills | `<Tabs>` primitive |
| `client/src/pages/QuestsPage.jsx` | "New Quest" Header CTA | Raw gradient `<button>` | `<Button variant="primary" size="md">` |

---

## 5. Phase 7 — Habits & Dailies Pages

| File Path | Element / Control | Current Implementation | Target Primitive Replacement |
|:---|:---|:---|:---|
| `client/src/components/dailies/DailyCard.jsx` | Complete daily check circle | Large raw check button | `<Checkbox>` or `<Button variant="success">` |
| `client/src/components/dailies/DailyCard.jsx` | Menu action buttons | Raw `<button>` dropdown items | `<Button variant="ghost" size="xs">` |
| `client/src/pages/HabitsPage.jsx` | "New Habit" Header CTA | Raw gradient `<button>` | `<Button variant="primary" size="md">` |
| `client/src/pages/HabitsPage.jsx` | Filter tab row | Raw `<button>` pills | `<Tabs>` primitive |
| `client/src/pages/DailiesPage.jsx` | "New Daily" Header CTA | Raw gradient `<button>` | `<Button variant="primary" size="md">` |
| `client/src/pages/DailiesPage.jsx` | Filter tab row | Raw `<button>` pills | `<Tabs>` primitive |

---

## 6. Phase 8 — Reward Shop & Inventory

| File Path | Element / Control | Current Implementation | Target Primitive Replacement |
|:---|:---|:---|:---|
| `client/src/components/shop/ShopItemCard.jsx` | Buy item CTA | Raw gold button | `<Button variant="primary" size="sm">` |
| `client/src/components/shop/InventoryDrawer.jsx`| Use / Consume item button | Raw `<button>` | `<Button variant="success" size="sm">` |
| `client/src/pages/ShopPage.jsx` | Filter tabs & category chips | Raw `<button>` elements | `<Tabs>` primitive |
| `client/src/pages/ShopPage.jsx` | "Add Reward" Header CTA | Raw `<button>` | `<Button variant="primary" size="md">` |

---

## 7. Phase 9 — Reflection & User Profile

| File Path | Element / Control | Current Implementation | Target Primitive Replacement |
|:---|:---|:---|:---|
| `client/src/components/reflection/EveningReflectionCard.jsx` | Mood / Energy score buttons | Raw circular numbered buttons | `<Button variant="secondary" size="md">` |
| `client/src/pages/ReflectionPage.jsx` | Save Reflection CTA | Raw `<button>` | `<Button variant="primary" size="md">` |
