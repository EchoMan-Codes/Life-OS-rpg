/**
 * Client-Side Authoritative Scheduling & Occurrence Engine for Jeevan (LifeOS)
 * Mirrors server/src/utils/scheduler.js 1:1.
 * Guaranteed single source of truth for both live UI preview and in-app scheduling.
 */

const DEFAULT_TIMEZONE = typeof Intl !== 'undefined'
  ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  : 'UTC';
const DEFAULT_GRACE_WINDOW_MS = 10 * 60 * 1000;

export function isValidTimezone(timeZone) {
  if (!timeZone || typeof timeZone !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function parseTimeString(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const clean = timeStr.trim().toUpperCase();

  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');
  const digitsOnly = clean.replace(/[APM\s]/g, '');
  const parts = digitsOnly.split(':');
  if (parts.length < 2) return null;

  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes) || minutes < 0 || minutes > 59) return null;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  if (hours < 0 || hours > 23) return null;

  return { hours, minutes };
}

export function localWallTimeToUtc(year, month, day, hour, minute, timeZone = DEFAULT_TIMEZONE) {
  const safeTz = isValidTimezone(timeZone) ? timeZone : DEFAULT_TIMEZONE;
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));

  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const getWallParts = (d) => {
    const parts = dtf.formatToParts(d);
    const map = {};
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = parseInt(p.value, 10);
    }
    if (map.hour === 24) map.hour = 0;
    return map;
  };

  const wall1 = getWallParts(guess);
  const wallUtc1 = Date.UTC(wall1.year, wall1.month - 1, wall1.day, wall1.hour, wall1.minute, 0);
  const targetUtc = Date.UTC(year, month - 1, day, hour, minute, 0);

  const offsetDiff = targetUtc - wallUtc1;
  const result = new Date(guess.getTime() + offsetDiff);

  const wall2 = getWallParts(result);
  const wallUtc2 = Date.UTC(wall2.year, wall2.month - 1, wall2.day, wall2.hour, wall2.minute, 0);
  if (wallUtc2 !== targetUtc) {
    const secondDiff = targetUtc - wallUtc2;
    return new Date(result.getTime() + secondDiff);
  }

  return result;
}

export function getLocalDateString(date, timeZone = DEFAULT_TIMEZONE) {
  const safeTz = isValidTimezone(timeZone) ? timeZone : DEFAULT_TIMEZONE;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

export function getLocalDayOfWeek(date, timeZone = DEFAULT_TIMEZONE) {
  const safeTz = isValidTimezone(timeZone) ? timeZone : DEFAULT_TIMEZONE;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz,
    weekday: 'short',
  });
  const shortDay = formatter.format(date);
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return dayMap[shortDay] ?? date.getUTCDay();
}

export function formatDisplayTime(date, timeZone = DEFAULT_TIMEZONE, { includeWeekday = true, includeDate = true } = {}) {
  const safeTz = isValidTimezone(timeZone) ? timeZone : DEFAULT_TIMEZONE;
  const options = {
    timeZone: safeTz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  if (includeWeekday) options.weekday = 'short';
  if (includeDate) {
    options.month = 'short';
    options.day = 'numeric';
  }
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

export function generateOccurrenceKey(itemType, itemId, occurrenceDate, offsetMinutes) {
  const safeId = itemId || 'unknown';
  const safeOffset = offsetMinutes ?? 0;
  return `${itemType}_${safeId}_${occurrenceDate}_${safeOffset}m`;
}

export function isWithinQuietHours(date, quietHours, timeZone = DEFAULT_TIMEZONE) {
  if (!quietHours || !quietHours.enabled) return false;
  const start = parseTimeString(quietHours.start || '22:00');
  const end = parseTimeString(quietHours.end || '07:00');
  if (!start || !end) return false;

  const safeTz = isValidTimezone(timeZone) ? timeZone : DEFAULT_TIMEZONE;
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  let curH = 0;
  let curM = 0;
  for (const p of parts) {
    if (p.type === 'hour') curH = parseInt(p.value, 10);
    if (p.type === 'minute') curM = parseInt(p.value, 10);
  }
  if (curH === 24) curH = 0;

  const curTotal = curH * 60 + curM;
  const startTotal = start.hours * 60 + start.minutes;
  const endTotal = end.hours * 60 + end.minutes;

  if (startTotal <= endTotal) {
    return curTotal >= startTotal && curTotal < endTotal;
  }
  return curTotal >= startTotal || curTotal < endTotal;
}

export function computeNextFireTimes({
  item,
  itemType = 'daily',
  now = new Date(),
  timezone = DEFAULT_TIMEZONE,
  limit = 5,
  quietHours = null,
  graceWindowMs = DEFAULT_GRACE_WINDOW_MS,
}) {
  if (!item) return [];

  const nowDate = now instanceof Date ? now : new Date(now);
  const safeTz = isValidTimezone(timezone) ? timezone : DEFAULT_TIMEZONE;

  const isEnabled = itemType === 'daily'
    ? Boolean(item.reminderEnabled)
    : itemType === 'quest'
      ? Boolean(item.reminderEnabled)
      : true;

  if (!isEnabled) return [];

  let offsets = [];
  if (Array.isArray(item.reminderOffsets) && item.reminderOffsets.length > 0) {
    offsets = item.reminderOffsets.map(Number);
  } else if (item.reminderMinutesBefore !== undefined && item.reminderMinutesBefore !== null) {
    offsets = [Number(item.reminderMinutesBefore)];
  } else if (itemType === 'quest' && item.reminderDaysBefore !== undefined) {
    offsets = [0];
  } else {
    offsets = [10];
  }

  offsets = Array.from(new Set(offsets)).sort((a, b) => b - a);
  const results = [];

  // DAILY
  if (itemType === 'daily') {
    const scheduledTime = item.scheduledTime;
    if (!scheduledTime) return [];

    const parsedTime = parseTimeString(scheduledTime);
    if (!parsedTime) return [];

    const rawActiveDays = Array.isArray(item.activeDays) && item.activeDays.length > 0
      ? item.activeDays
      : [0, 1, 2, 3, 4, 5, 6];
    const activeDaysSet = new Set(rawActiveDays.map(Number));

    const todayStr = getLocalDateString(nowDate, safeTz);
    const [startYear, startMonth, startDay] = todayStr.split('-').map(Number);

    if (item.targetDate) {
      const targetStr = String(item.targetDate).slice(0, 10);
      const [tYear, tMonth, tDay] = targetStr.split('-').map(Number);

      for (const offsetMin of offsets) {
        const eventUtc = localWallTimeToUtc(tYear, tMonth, tDay, parsedTime.hours, parsedTime.minutes, safeTz);
        const fireTime = new Date(eventUtc.getTime() - offsetMin * 60 * 1000);

        const diffFromNow = fireTime.getTime() - nowDate.getTime();
        const isPast = diffFromNow < 0;
        const isWithinGrace = isPast && Math.abs(diffFromNow) <= graceWindowMs;

        if (!isPast || isWithinGrace) {
          results.push(createFireTimeRecord({
            item,
            itemType,
            occurrenceDate: targetStr,
            scheduledTime,
            offsetMinutes: offsetMin,
            fireTime,
            isPast,
            isWithinGrace,
            safeTz,
            quietHours,
          }));
        }
      }

      return results.slice(0, limit);
    }

    let searchDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 12, 0, 0));

    for (let dayStep = 0; dayStep < 60 && results.length < limit; dayStep++) {
      const currentCalendarDate = new Date(searchDate.getTime() + dayStep * 24 * 60 * 60 * 1000);
      const calendarDateStr = currentCalendarDate.toISOString().slice(0, 10);
      const [curYear, curMonth, curDay] = calendarDateStr.split('-').map(Number);

      const sampleWallDate = localWallTimeToUtc(curYear, curMonth, curDay, 12, 0, safeTz);
      const localDayOfWeek = getLocalDayOfWeek(sampleWallDate, safeTz);

      if (!activeDaysSet.has(localDayOfWeek)) {
        continue;
      }

      if (calendarDateStr === todayStr && item.isCompleteToday) {
        continue;
      }

      for (const offsetMin of offsets) {
        if (results.length >= limit) break;

        const eventUtc = localWallTimeToUtc(curYear, curMonth, curDay, parsedTime.hours, parsedTime.minutes, safeTz);
        const fireTime = new Date(eventUtc.getTime() - offsetMin * 60 * 1000);

        const diffFromNow = fireTime.getTime() - nowDate.getTime();
        const isPast = diffFromNow < 0;
        const isWithinGrace = isPast && Math.abs(diffFromNow) <= graceWindowMs;

        if (!isPast || isWithinGrace) {
          results.push(createFireTimeRecord({
            item,
            itemType,
            occurrenceDate: calendarDateStr,
            scheduledTime,
            offsetMinutes: offsetMin,
            fireTime,
            isPast,
            isWithinGrace,
            safeTz,
            quietHours,
          }));
        }
      }
    }

    return results.slice(0, limit);
  }

  // QUEST
  if (itemType === 'quest') {
    if (item.status === 'completed' || item.status === 'archived') {
      return [];
    }

    const dueDateStr = item.dueDate ? String(item.dueDate).slice(0, 10) : null;
    const reminderTimeStr = item.reminderTime || '19:00';
    const parsedTime = parseTimeString(reminderTimeStr) || { hours: 19, minutes: 0 };
    const daysBefore = item.reminderDaysBefore !== undefined ? Number(item.reminderDaysBefore) : 1;

    let targetDateStr = dueDateStr;

    if (dueDateStr && daysBefore > 0) {
      const [dYear, dMonth, dDay] = dueDateStr.split('-').map(Number);
      const dueAnchor = new Date(Date.UTC(dYear, dMonth - 1, dDay, 12, 0, 0));
      const targetAnchor = new Date(dueAnchor.getTime() - daysBefore * 24 * 60 * 60 * 1000);
      targetDateStr = targetAnchor.toISOString().slice(0, 10);
    } else if (!dueDateStr) {
      targetDateStr = getLocalDateString(nowDate, safeTz);
    }

    const [tYear, tMonth, tDay] = targetDateStr.split('-').map(Number);
    const eventUtc = localWallTimeToUtc(tYear, tMonth, tDay, parsedTime.hours, parsedTime.minutes, safeTz);

    for (const offsetMin of offsets) {
      const fireTime = new Date(eventUtc.getTime() - offsetMin * 60 * 1000);
      const diffFromNow = fireTime.getTime() - nowDate.getTime();
      const isPast = diffFromNow < 0;
      const isWithinGrace = isPast && Math.abs(diffFromNow) <= graceWindowMs;

      if (!isPast || isWithinGrace) {
        results.push(createFireTimeRecord({
          item,
          itemType,
          occurrenceDate: targetDateStr,
          scheduledTime: reminderTimeStr,
          offsetMinutes: offsetMin,
          fireTime,
          isPast,
          isWithinGrace,
          safeTz,
          quietHours,
        }));
      }
    }

    return results.slice(0, limit);
  }

  return [];
}

function createFireTimeRecord({
  item,
  itemType,
  occurrenceDate,
  scheduledTime,
  offsetMinutes,
  fireTime,
  isPast,
  isWithinGrace,
  safeTz,
  quietHours,
}) {
  const relativeLabel = offsetMinutes === 0
    ? 'At event time'
    : offsetMinutes >= 60 && offsetMinutes % 60 === 0
      ? `${offsetMinutes / 60}h before`
      : `${offsetMinutes}m before`;

  const inQuietHours = isWithinQuietHours(fireTime, quietHours, safeTz);

  return {
    itemType,
    itemId: item.id || null,
    title: item.title || 'Untitled',
    occurrenceDate,
    scheduledTime,
    offsetMinutes,
    fireTime,
    fireTimeIso: fireTime.toISOString(),
    displayTime: formatDisplayTime(fireTime, safeTz),
    displayTimeCompact: formatDisplayTime(fireTime, safeTz, { includeDate: false }),
    relativeLabel,
    occurrenceKey: generateOccurrenceKey(itemType, item.id, occurrenceDate, offsetMinutes),
    isPast,
    isWithinGraceWindow: isWithinGrace,
    isQuietHours: inQuietHours,
  };
}
