/**
 * Central event management for Level-Up celebrations and Loot Drop popups.
 * Dispatches and listens for application-wide custom events.
 */

export const LIFEOS_LEVEL_UP_EVENT = 'lifeos:level-up';
export const LIFEOS_LOOT_DROP_EVENT = 'lifeos:loot-drop';
export const LIFEOS_OPEN_ATTRIBUTES_EVENT = 'lifeos:open-attributes';
export const LIFEOS_OPEN_BATTLE_LOG_EVENT = 'lifeos:open-battle-log';

/**
 * Trigger the full-screen Level-Up celebration modal.
 *
 * @param {object} params
 * @param {number} [params.previousLevel=1] - Level before the grant
 * @param {number} params.newLevel - Level after the grant
 * @param {number} [params.levelsGained=1] - Number of levels gained
 * @param {number} [params.unallocatedPoints=2] - Newly unlocked or total unallocated points
 */
export function triggerLevelUp({
  previousLevel = 1,
  newLevel = 2,
  levelsGained = 1,
  unallocatedPoints = 2,
}) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(LIFEOS_LEVEL_UP_EVENT, {
      detail: {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        previousLevel,
        newLevel,
        levelsGained: Math.max(1, levelsGained),
        unallocatedPoints,
      },
    })
  );
}

/**
 * Trigger a loot drop notification popup.
 *
 * @param {object} lootItem - The item obtained
 * @param {string} lootItem.name - Item title
 * @param {string} [lootItem.icon] - Icon name
 * @param {string} [lootItem.description] - Item description
 * @param {string} [lootItem.type] - Item type
 */
export function triggerLootDrop(lootItem) {
  if (typeof window === 'undefined' || !lootItem) return;

  window.dispatchEvent(
    new CustomEvent(LIFEOS_LOOT_DROP_EVENT, {
      detail: {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        ...lootItem,
      },
    })
  );
}

/**
 * Dispatches an event to open the Attributes Drawer directly from anywhere in the app.
 */
export function openAttributesDrawer() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LIFEOS_OPEN_ATTRIBUTES_EVENT));
}

/**
 * Dispatches an event to open the Battle Log Drawer from anywhere in the app.
 */
export function openBattleLogDrawer() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LIFEOS_OPEN_BATTLE_LOG_EVENT));
}

/**
 * Inspects any mutation response payload (Habits, Dailies, Quests, etc.)
 * and fires celebrations if level-up or loot drops occurred.
 *
 * @param {object} responseData - JSON payload from API mutation response
 * @returns {{ leveledUp: boolean, lootDropped: boolean }}
 */
export function checkAndTriggerCelebrations(responseData) {
  if (!responseData) return { leveledUp: false, lootDropped: false };

  let leveledUp = false;
  let levelsGained = 0;
  let newLevel = 1;
  let previousLevel = 1;
  let unallocatedPoints = 0;
  let lootItem = null;

  // 1. Check direct progression object (habits, dailies, progression service)
  const prog = responseData.progression || responseData.character;
  const reward = responseData.reward;

  if (prog?.leveledUp || reward?.leveledUp) {
    leveledUp = true;
    levelsGained = prog?.levelsGained || reward?.levelsGained || 1;
    newLevel = prog?.newLevel || prog?.level || (reward?.newLevel ?? 2);
    previousLevel = prog?.previousLevel || reward?.previousLevel || Math.max(1, newLevel - levelsGained);
    unallocatedPoints = prog?.unallocatedPoints ?? reward?.unallocatedPoints ?? (levelsGained * 2);
  }

  // 2. Check battleEvent if attached
  const battleEvent = responseData.battleEvent || prog?.battleEvent;
  if (battleEvent?.lootItem) {
    lootItem = battleEvent.lootItem;
  }

  if (leveledUp) {
    triggerLevelUp({
      previousLevel,
      newLevel,
      levelsGained,
      unallocatedPoints,
    });
  }

  if (lootItem) {
    triggerLootDrop(lootItem);
  }

  return { leveledUp, lootDropped: !!lootItem };
}

// Expose on window in development for testing
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.triggerLevelUp = triggerLevelUp;
  window.triggerLootDrop = triggerLootDrop;
  window.openAttributesDrawer = openAttributesDrawer;
  window.openBattleLogDrawer = openBattleLogDrawer;
}
