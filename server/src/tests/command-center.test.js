import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../app.js';
import { query } from '../db/pool.js';
import { AuthService } from '../services/auth.service.js';
import { taskService } from '../services/task.service.js';
import { calendarService } from '../services/calendar.service.js';
import { focusService } from '../services/focus.service.js';
import { insightsService } from '../services/insights.service.js';
import { aiService } from '../services/ai.service.js';

const authService = new AuthService();

async function runCommandCenterTests() {
  console.log('\n═════════════════════════════════════════════════════════');
  console.log(' Starting Productivity Command Center Backend Test Suite ');
  console.log('═════════════════════════════════════════════════════════\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  // Helper fetch
  async function api(path, options = {}, token = null) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, data: json.data, error: json.error };
  }

  try {
    // 1. Setup Test User
    console.log('1. Setting up test user...');
    const userEmail = `hero-cmd-${Date.now()}@lifeos.game`;
    const regRes = await authService.register({
      email: userEmail,
      password: 'CommandCenterPassword123!',
      displayName: 'CmdCommander',
    });
    const user = regRes.user;
    const token = regRes.accessToken;
    console.log(`   ✅ User registered: ${user.id} (${user.email})`);

    // 2. Test Tasks Module
    console.log('\n2. Testing Unified Tasks & Deadline Manager...');
    // A. Create task with subtasks
    const createRes = await api('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Launch Apollo Mission',
        description: 'Complete high priority project',
        priority: 'high',
        difficulty: 'medium',
        projectName: 'Aerospace',
        dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        subtasks: ['Pre-flight checklist', 'Fuel tank calibration', 'Ignition sequence'],
      }),
    }, token);

    assert.equal(createRes.status, 201, 'Task should be created with 201');
    assert.equal(createRes.data.title, 'Launch Apollo Mission');
    assert.equal(createRes.data.subtasks.length, 3, 'Should create 3 subtasks');
    const taskId = createRes.data.id;
    console.log(`   ✅ Task created with 3 subtasks (ID: ${taskId})`);

    // B. List tasks with project filter
    const listRes = await api('/tasks?projectName=Aerospace', { method: 'GET' }, token);
    assert.equal(listRes.status, 200);
    assert.equal(listRes.data.length, 1);
    console.log('   ✅ Filtered tasks by project successfully');

    // C. Task completion & progression reward
    const charBefore = await query('SELECT xp, gold FROM character_stats WHERE user_id = $1', [user.id]);
    const xpBefore = charBefore.rows[0].xp;
    const goldBefore = charBefore.rows[0].gold;

    const compRes = await api(`/tasks/${taskId}/complete`, { method: 'POST' }, token);
    assert.equal(compRes.status, 200);
    assert.equal(compRes.data.task.status, 'completed');
    assert.equal(compRes.data.reward.xp, 20, 'Medium task awards 20 XP');

    const charAfter = await query('SELECT xp, gold FROM character_stats WHERE user_id = $1', [user.id]);
    assert.equal(charAfter.rows[0].xp, xpBefore + 20, 'Character stats updated by applyReward');
    assert.equal(charAfter.rows[0].gold, goldBefore + 10, 'Character gold updated by applyReward');
    console.log('   ✅ Task completed and progression reward applied atomically');

    // D. Idempotent completion check (repeat completion should award 0 additional XP)
    const repeatComp = await api(`/tasks/${taskId}/complete`, { method: 'POST' }, token);
    assert.equal(repeatComp.status, 200);
    assert.equal(repeatComp.data.alreadyCompleted, true);
    assert.equal(repeatComp.data.reward.xp, 0, 'Zero XP on repeat completion');
    console.log('   ✅ Strict idempotency verified: zero duplicate XP awards');

    // 3. Test Calendar & Time Blocking Module
    console.log('\n3. Testing Smart Calendar & Time Blocking...');
    const now = new Date();
    const startSlot = new Date(now.getTime() + 2 * 3600 * 1000);
    const endSlot = new Date(startSlot.getTime() + 60 * 60 * 1000);

    // A. Create calendar event
    const eventRes = await api('/calendar/events', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Deep Architecture Sync',
        startTime: startSlot.toISOString(),
        endTime: endSlot.toISOString(),
        category: 'architecture',
        color: '#6366F1',
      }),
    }, token);

    assert.equal(eventRes.status, 201);
    assert.equal(eventRes.data.title, 'Deep Architecture Sync');
    const eventId = eventRes.data.id;
    console.log(`   ✅ Calendar event created (ID: ${eventId})`);

    // B. Conflict Detection
    const conflictRes = await api(
      `/calendar/conflicts?startTime=${startSlot.toISOString()}&endTime=${endSlot.toISOString()}`,
      { method: 'GET' },
      token
    );
    assert.equal(conflictRes.status, 200);
    assert.equal(conflictRes.data.hasConflict, true);
    assert.equal(conflictRes.data.conflictCount, 1);
    console.log('   ✅ Conflict detection caught overlapping time slot');

    // C. Schedule Task Time Block
    const timeBlockRes = await api('/calendar/time-block', {
      method: 'POST',
      body: JSON.stringify({
        taskId,
        startTime: new Date(startSlot.getTime() + 3 * 3600 * 1000).toISOString(),
        durationMinutes: 45,
      }),
    }, token);
    assert.equal(timeBlockRes.status, 201);
    assert(timeBlockRes.data.event.id, 'Time block event created');
    console.log('   ✅ Task time block scheduled on calendar');

    // 4. Test Focus Chamber Module
    console.log('\n4. Testing Upgraded Focus Chamber...');
    // A. Start custom duration focus session with task link
    const focusStart = await api('/focus/start', {
      method: 'POST',
      body: JSON.stringify({
        plannedDurationSeconds: 120, // 2 mins custom test
        ambientSound: 'lofi',
        taskId,
        taskTitle: 'Launch Apollo Mission',
        sessionType: 'focus',
      }),
    }, token);
    assert.equal(focusStart.status, 201);
    assert.equal(focusStart.data.plannedDurationSeconds, 120);
    assert.equal(focusStart.data.taskTitle, 'Launch Apollo Mission');
    const sessionId = focusStart.data.id;
    console.log(`   ✅ Custom focus session started linked to task (ID: ${sessionId})`);

    // B. Pause and resume session
    const pauseRes = await api(`/focus/${sessionId}/pause`, { method: 'POST' }, token);
    assert.equal(pauseRes.status, 200);
    assert.equal(pauseRes.data.isPaused, true);

    const resumeRes = await api(`/focus/${sessionId}/resume`, { method: 'POST' }, token);
    assert.equal(resumeRes.status, 200);
    assert.equal(resumeRes.data.isPaused, false);
    console.log('   ✅ Session pause and resume flow validated');

    // C. Clean up by abandoning session
    const abandonRes = await api(`/focus/${sessionId}/abandon`, { method: 'POST' }, token);
    assert.equal(abandonRes.status, 200);
    assert.equal(abandonRes.data.completed, false);
    console.log('   ✅ Session abandoned without penalty');

    // D. Focus summary metrics
    const summaryRes = await api('/focus/summary', { method: 'GET' }, token);
    assert.equal(summaryRes.status, 200);
    assert(typeof summaryRes.data.todayMinutes === 'number');
    console.log('   ✅ Focus summary analytics retrieved');

    // 5. Test Weekly Review & Personal Analytics (Insights)
    console.log('\n5. Testing Weekly Review & Insights...');
    // A. Weekly Insights
    const weeklyRes = await api('/insights/weekly', { method: 'GET' }, token);
    assert.equal(weeklyRes.status, 200);
    assert(weeklyRes.data.metrics.tasksCompleted >= 1);
    console.log('   ✅ Weekly insights authoritative metrics calculated');

    // B. Trends
    const trendsRes = await api('/insights/trends?weeks=4', { method: 'GET' }, token);
    assert.equal(trendsRes.status, 200);
    assert(Array.isArray(trendsRes.data.dailyTrends));
    console.log(`   ✅ 4-Week trends retrieved (${trendsRes.data.dailyTrends.length} days)`);

    // C. Save Weekly Review
    const reviewRes = await api('/insights/reviews', {
      method: 'POST',
      body: JSON.stringify({
        weekStartDate: weeklyRes.data.weekRange.startDate,
        weekEndDate: weeklyRes.data.weekRange.endDate,
        wins: 'Shipped the rocket and calibrated engines',
        blockers: 'Minor weather delays',
        lessons: 'Double check fuel caps early',
        nextWeekPriorities: ['Orbit insertion', 'Deploy solar panels'],
        followUpTasks: ['Refuel auxiliary batteries'],
      }),
    }, token);
    assert.equal(reviewRes.status, 200);
    assert.equal(reviewRes.data.wins, 'Shipped the rocket and calibrated engines');
    console.log('   ✅ Weekly review saved with follow-up task generation');

    // Verify follow-up task was auto-created in tasks table
    const followUpRes = await api('/tasks?search=Refuel', { method: 'GET' }, token);
    assert.equal(followUpRes.status, 200);
    assert.equal(followUpRes.data.length, 1);
    console.log('   ✅ Follow-up task auto-created in Tasks backlog');

    // 6. Test Action-Oriented AI Integration
    console.log('\n6. Testing Action-Oriented AI Actions...');
    // A. Execute AI action: breakdown_project
    const breakdownRes = await api('/ai/execute-action', {
      method: 'POST',
      body: JSON.stringify({
        actionType: 'breakdown_project',
        payload: {
          projectName: 'Mars Colony One',
          tasks: [
            { title: 'Habitation dome blueprints', priority: 'high', estimatedDurationMinutes: 60 },
            { title: 'Oxygen generation setup', priority: 'critical', estimatedDurationMinutes: 90 },
          ],
        },
      }),
    }, token);
    assert.equal(breakdownRes.status, 200);
    assert.equal(breakdownRes.data.tasks.length, 2);
    console.log('   ✅ AI breakdown_project action executed');

    // Verify action was logged to ai_action_logs
    const auditRes = await query(
      `SELECT id, action_type, status FROM ai_action_logs WHERE user_id = $1 AND action_type = 'breakdown_project'`,
      [user.id]
    );
    assert.equal(auditRes.rows.length, 1, 'Action logged in ai_action_logs');
    console.log('   ✅ Audit entry verified in ai_action_logs table');

    console.log('\n═════════════════════════════════════════════════════════');
    console.log(' 🎉 All Productivity Command Center Backend Tests Passed! ');
    console.log('═════════════════════════════════════════════════════════\n');
  } finally {
    server.close();
  }
}

runCommandCenterTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
