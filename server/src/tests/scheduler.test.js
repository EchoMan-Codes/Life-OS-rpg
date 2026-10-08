import assert from 'node:assert';
import {
  parseTimeString,
  localWallTimeToUtc,
  getLocalDateString,
  getLocalDayOfWeek,
  computeNextFireTimes,
  generateOccurrenceKey,
  isWithinQuietHours,
} from '../utils/scheduler.js';

console.log('\n═══════════════════════════════════════════════════════');
console.log(' Starting Authoritative Scheduling Engine Unit Tests   ');
console.log('═══════════════════════════════════════════════════════\n');

// 1. Test parseTimeString
console.log('1. Testing parseTimeString parsing...');
assert.deepStrictEqual(parseTimeString('11:00 AM'), { hours: 11, minutes: 0 });
assert.deepStrictEqual(parseTimeString('11:00 PM'), { hours: 23, minutes: 0 });
assert.deepStrictEqual(parseTimeString('12:00 AM'), { hours: 0, minutes: 0 });
assert.deepStrictEqual(parseTimeString('12:00 PM'), { hours: 12, minutes: 0 });
assert.deepStrictEqual(parseTimeString('19:45'), { hours: 19, minutes: 45 });
assert.deepStrictEqual(parseTimeString('07:30 am'), { hours: 7, minutes: 30 });
assert.strictEqual(parseTimeString('invalid'), null);
assert.strictEqual(parseTimeString(''), null);
console.log('   ✅ parseTimeString passed.');

// 2. Test localWallTimeToUtc and timezone conversion
console.log('2. Testing localWallTimeToUtc across timezones...');
// UTC: 2026-10-12 11:00 UTC -> 2026-10-12T11:00:00.000Z
const utcDate = localWallTimeToUtc(2026, 10, 12, 11, 0, 'UTC');
assert.strictEqual(utcDate.toISOString(), '2026-10-12T11:00:00.000Z');

// Asia/Kolkata (+05:30): 2026-10-12 11:00 IST -> 2026-10-12 05:30:00.000Z
const istDate = localWallTimeToUtc(2026, 10, 12, 11, 0, 'Asia/Kolkata');
assert.strictEqual(istDate.toISOString(), '2026-10-12T05:30:00.000Z');

// America/New_York (EDT, UTC-4 in October): 2026-10-12 11:00 EDT -> 2026-10-12 15:00:00.000Z
const edtDate = localWallTimeToUtc(2026, 10, 12, 11, 0, 'America/New_York');
assert.strictEqual(edtDate.toISOString(), '2026-10-12T15:00:00.000Z');
console.log('   ✅ localWallTimeToUtc passed.');

// 3. CORE REQUIREMENT TEST:
// An item set for Mon, Tue, Wed at 11:00 AM with a 5-minute-before reminder
// MUST produce fire times ONLY on Mon, Tue, Wed at 10:55 and 11:00,
// and ZERO on Thursday, Friday, Saturday, Sunday!
console.log('3. Testing Mon/Tue/Wed recurrence rule with 5m and 0m offsets...');

// Suppose "now" is Sunday, Oct 11, 2026 at 09:00 AM UTC
const sundayNow = new Date('2026-10-11T09:00:00.000Z');

const testDaily = {
  id: 'daily-mtw-11am',
  title: 'DSA Practice',
  activeDays: [1, 2, 3], // Mon (1), Tue (2), Wed (3) ONLY
  scheduledTime: '11:00 AM',
  reminderEnabled: true,
  reminderOffsets: [5, 0], // 5m before and at-time
};

const fireTimes = computeNextFireTimes({
  item: testDaily,
  itemType: 'daily',
  now: sundayNow,
  timezone: 'UTC',
  limit: 6, // 3 days * 2 offsets = 6 fire times
});

assert.strictEqual(fireTimes.length, 6, 'Should compute exactly 6 occurrences');

// Check Days:
// 1st: Mon Oct 12, 10:55 (5m before)
// 2nd: Mon Oct 12, 11:00 (at time)
// 3rd: Tue Oct 13, 10:55 (5m before)
// 4th: Tue Oct 13, 11:00 (at time)
// 5th: Wed Oct 14, 10:55 (5m before)
// 6th: Wed Oct 14, 11:00 (at time)

assert.strictEqual(fireTimes[0].occurrenceDate, '2026-10-12');
assert.strictEqual(fireTimes[0].offsetMinutes, 5);
assert.strictEqual(fireTimes[0].fireTimeIso, '2026-10-12T10:55:00.000Z');

assert.strictEqual(fireTimes[1].occurrenceDate, '2026-10-12');
assert.strictEqual(fireTimes[1].offsetMinutes, 0);
assert.strictEqual(fireTimes[1].fireTimeIso, '2026-10-12T11:00:00.000Z');

assert.strictEqual(fireTimes[2].occurrenceDate, '2026-10-13');
assert.strictEqual(fireTimes[2].offsetMinutes, 5);
assert.strictEqual(fireTimes[2].fireTimeIso, '2026-10-13T10:55:00.000Z');

assert.strictEqual(fireTimes[3].occurrenceDate, '2026-10-13');
assert.strictEqual(fireTimes[3].offsetMinutes, 0);
assert.strictEqual(fireTimes[3].fireTimeIso, '2026-10-13T11:00:00.000Z');

assert.strictEqual(fireTimes[4].occurrenceDate, '2026-10-14');
assert.strictEqual(fireTimes[4].offsetMinutes, 5);
assert.strictEqual(fireTimes[4].fireTimeIso, '2026-10-14T10:55:00.000Z');

assert.strictEqual(fireTimes[5].occurrenceDate, '2026-10-14');
assert.strictEqual(fireTimes[5].offsetMinutes, 0);
assert.strictEqual(fireTimes[5].fireTimeIso, '2026-10-14T11:00:00.000Z');

// Verify that NO occurrences landed on Sunday (Oct 11), Thursday (Oct 15), Friday (Oct 16), or Saturday (Oct 17)
const nonActiveDates = ['2026-10-11', '2026-10-15', '2026-10-16', '2026-10-17'];
for (const ft of fireTimes) {
  assert.ok(!nonActiveDates.includes(ft.occurrenceDate), `Occurrence should never land on inactive day ${ft.occurrenceDate}`);
}
console.log('   ✅ Strict recurrence filtering passed: zero notifications on Thu-Sun.');

// 4. Test Stable Occurrence Keys & Idempotency
console.log('4. Testing occurrence key stability...');
const key1 = generateOccurrenceKey('daily', 'd123', '2026-10-12', 5);
const key2 = generateOccurrenceKey('daily', 'd123', '2026-10-12', 5);
assert.strictEqual(key1, 'daily_d123_2026-10-12_5m');
assert.strictEqual(key1, key2);
console.log('   ✅ Occurrence key generation is deterministic.');

// 5. Test Grace Window handling
console.log('5. Testing grace window (near-past vs stale)...');
// Scheduled for 10:55 AM
// Now is 11:00 AM (5 minutes after fire time -> inside 10m grace window)
const nowWithinGrace = new Date('2026-10-12T11:00:00.000Z');
const graceResults = computeNextFireTimes({
  item: {
    id: 'd1',
    scheduledTime: '11:00 AM',
    reminderMinutesBefore: 5,
    activeDays: [1],
    reminderEnabled: true,
  },
  itemType: 'daily',
  now: nowWithinGrace,
  timezone: 'UTC',
  limit: 1,
});
assert.strictEqual(graceResults.length, 1);
assert.strictEqual(graceResults[0].occurrenceDate, '2026-10-12');
assert.strictEqual(graceResults[0].isPast, true);
assert.strictEqual(graceResults[0].isWithinGraceWindow, true);

// Now is 11:20 AM (25 minutes after fire time -> outside 10m grace window)
// It should skip today's fire time and jump to next week's Monday!
const nowBeyondGrace = new Date('2026-10-12T11:20:00.000Z');
const beyondGraceResults = computeNextFireTimes({
  item: {
    id: 'd1',
    scheduledTime: '11:00 AM',
    reminderMinutesBefore: 5,
    activeDays: [1],
    reminderEnabled: true,
  },
  itemType: 'daily',
  now: nowBeyondGrace,
  timezone: 'UTC',
  limit: 1,
});
assert.strictEqual(beyondGraceResults.length, 1);
assert.strictEqual(beyondGraceResults[0].occurrenceDate, '2026-10-19', 'Should skip stale occurrence and advance to next active week');
console.log('   ✅ Grace window correctly accepts near-past and skips stale past.');

// 6. Test Quest with due date and reminderDaysBefore
console.log('6. Testing Quest due date and reminder computation...');
const questItem = {
  id: 'quest-dbms-final',
  title: 'Finish DBMS Project',
  dueDate: '2026-10-20',
  reminderTime: '18:00',
  reminderDaysBefore: 1,
  reminderEnabled: true,
  status: 'active',
};
const questTimes = computeNextFireTimes({
  item: questItem,
  itemType: 'quest',
  now: new Date('2026-10-15T12:00:00.000Z'),
  timezone: 'UTC',
  limit: 1,
});
assert.strictEqual(questTimes.length, 1);
assert.strictEqual(questTimes[0].occurrenceDate, '2026-10-19', '1 day before Oct 20 is Oct 19');
assert.strictEqual(questTimes[0].fireTimeIso, '2026-10-19T18:00:00.000Z');
console.log('   ✅ Quest reminders calculated accurately from due date.');

// 7. Test Completed items (Daily already complete today)
console.log('7. Testing completed Daily skipping today...');
const completedDaily = {
  id: 'daily-completed',
  title: 'Workout',
  scheduledTime: '06:00 PM',
  activeDays: [0, 1, 2, 3, 4, 5, 6],
  reminderMinutesBefore: 10,
  reminderEnabled: true,
  isCompleteToday: true,
};
const completedTimes = computeNextFireTimes({
  item: completedDaily,
  itemType: 'daily',
  now: new Date('2026-10-12T10:00:00.000Z'),
  timezone: 'UTC',
  limit: 1,
});
assert.strictEqual(completedTimes.length, 1);
assert.strictEqual(completedTimes[0].occurrenceDate, '2026-10-13', 'Should advance to tomorrow because today is already completed');
console.log('   ✅ Completed task today is cleanly skipped.');

// 8. Test Quiet Hours
console.log('8. Testing Quiet Hours detection...');
const quietConfig = { enabled: true, start: '22:00', end: '07:00' };
const midnightDate = new Date('2026-10-12T00:30:00.000Z');
const afternoonDate = new Date('2026-10-12T14:30:00.000Z');
assert.strictEqual(isWithinQuietHours(midnightDate, quietConfig, 'UTC'), true);
assert.strictEqual(isWithinQuietHours(afternoonDate, quietConfig, 'UTC'), false);
console.log('   ✅ Quiet Hours correctly detected.');

console.log('\n═══════════════════════════════════════════════════════');
console.log(' 🎉 All Scheduling Engine Unit Tests Passed Cleanly!   ');
console.log('═══════════════════════════════════════════════════════\n');
