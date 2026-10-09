import { query, withTransaction } from '../db/pool.js';
import { taskService } from './task.service.js';
import { dailyService } from './daily.service.js';
import { questService } from './quest.service.js';
import { localWallTimeToUtc, getLocalDateString } from '../utils/scheduler.js';

export class CalendarService {
  /**
   * List all calendar events, time blocks, and scheduled items for a date range
   */
  async getEventsForRange(userId, { startDate, endDate, timezone = 'UTC', includeTasks = true, includeDailies = true, includeQuests = true }) {
    if (!startDate || !endDate) {
      const err = new Error('startDate and endDate query parameters are required (ISO format or YYYY-MM-DD)');
      err.status = 400;
      err.code = 'INVALID_DATE_RANGE';
      throw err;
    }

    const startUtc = new Date(startDate);
    const endUtc = new Date(endDate);

    // 1. Fetch native calendar events and time blocks
    const eventsRes = await query(
      `SELECT
        id, user_id as "userId", title, description,
        start_time as "startTime", end_time as "endTime",
        all_day as "allDay", category, color, location,
        recurrence_rule as "recurrenceRule",
        recurrence_series_id as "recurrenceSeriesId",
        task_id as "taskId", task_type as "taskType",
        status, created_at as "createdAt", updated_at as "updatedAt"
       FROM calendar_events
       WHERE user_id = $1
         AND (
           (start_time <= $3 AND end_time >= $2)
           OR (recurrence_rule IS NOT NULL)
         )
       ORDER BY start_time ASC`,
      [userId, startUtc, endUtc]
    );

    const events = [...eventsRes.rows];

    // Expand recurring events within the requested window
    const expandedEvents = [];
    for (const ev of events) {
      if (ev.recurrenceRule && !ev.recurrenceSeriesId) {
        const instances = this.expandRecurrence(ev, startUtc, endUtc);
        expandedEvents.push(...instances);
      } else {
        expandedEvents.push(ev);
      }
    }

    // 2. Fetch scheduled tasks as calendar time blocks if requested
    if (includeTasks) {
      const tasks = await query(
        `SELECT
          id, title, description, status, priority, due_date as "dueDate",
          start_date as "startDate", scheduled_time as "scheduledTime",
          estimated_duration_minutes as "estimatedDurationMinutes",
          project_name as "projectName"
         FROM tasks
         WHERE user_id = $1
           AND parent_id IS NULL
           AND (
             (start_date IS NOT NULL AND start_date <= $3 AND start_date >= $2)
             OR (due_date IS NOT NULL AND due_date <= $3 AND due_date >= $2)
           )`,
        [userId, startUtc, endUtc]
      );

      for (const t of tasks.rows) {
        // Only add if not already scheduled as an explicit calendar_event
        const hasExplicitEvent = expandedEvents.some((e) => e.taskId === t.id);
        if (!hasExplicitEvent) {
          const anchorDate = t.startDate ? new Date(t.startDate) : new Date(t.dueDate);
          const durationMins = t.estimatedDurationMinutes || 30;
          const endBlock = new Date(anchorDate.getTime() + durationMins * 60 * 1000);

          expandedEvents.push({
            id: `task-block-${t.id}`,
            userId,
            title: `[Task] ${t.title}`,
            description: t.description,
            startTime: anchorDate.toISOString(),
            endTime: endBlock.toISOString(),
            allDay: !t.scheduledTime,
            category: 'task',
            color: '#10B981', // Emerald for tasks
            location: t.projectName,
            taskId: t.id,
            taskType: 'task',
            status: t.status,
            isTaskBlock: true,
            isDeadline: Boolean(t.dueDate && !t.startDate),
          });
        }
      }
    }

    // 3. Fetch active dailies for the range
    if (includeDailies) {
      const dailies = await dailyService.listDailies(userId);
      for (const d of dailies || []) {
        if (d.scheduledTime) {
          const [h, m] = d.scheduledTime.split(':').map((v) => parseInt(v, 10));
          if (!isNaN(h) && !isNaN(m)) {
            // Project into dates in range matching activeDays
            let cur = new Date(startUtc);
            while (cur <= endUtc) {
              const dayOfWeek = cur.getUTCDay();
              const activeDays = Array.isArray(d.activeDays) && d.activeDays.length > 0 ? d.activeDays : [0, 1, 2, 3, 4, 5, 6];
              if (activeDays.includes(dayOfWeek)) {
                const s = new Date(cur);
                s.setUTCHours(h, m, 0, 0);
                const dur = d.durationMinutes || 30;
                const e = new Date(s.getTime() + dur * 60 * 1000);

                expandedEvents.push({
                  id: `daily-${d.id}-${s.toISOString().slice(0, 10)}`,
                  userId,
                  title: `[Daily] ${d.title}`,
                  description: d.description || d.notes,
                  startTime: s.toISOString(),
                  endTime: e.toISOString(),
                  allDay: false,
                  category: 'daily',
                  color: '#F59E0B', // Amber for dailies
                  location: null,
                  taskId: d.id,
                  taskType: 'daily',
                  status: d.isCompleteToday ? 'completed' : 'todo',
                  isDailyBlock: true,
                });
              }
              cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
            }
          }
        }
      }
    }

    // 4. Fetch quest deadlines and reminders for the range
    if (includeQuests) {
      const quests = await questService.listQuests(userId, { status: 'all' });
      for (const q of quests || []) {
        // Quest Deadline
        if (q.dueDate) {
          const questDate = new Date(`${q.dueDate}T10:00:00Z`);
          if (questDate >= startUtc && questDate <= endUtc) {
            const hasExplicitEvent = expandedEvents.some((e) => e.taskId === q.id && e.taskType === 'quest');
            if (!hasExplicitEvent) {
              const endBlock = new Date(questDate.getTime() + 60 * 60 * 1000);
              expandedEvents.push({
                id: `quest-${q.id}`,
                userId,
                title: `[Quest Deadline] ${q.title}`,
                description: q.description,
                startTime: questDate.toISOString(),
                endTime: endBlock.toISOString(),
                allDay: true,
                category: 'quest',
                color: '#8B5CF6', // Purple for quests
                location: null,
                taskId: q.id,
                taskType: 'quest',
                status: q.status,
                isQuestBlock: true,
                isDeadline: true,
              });
            }
          }
        }

        // Quest Reminder
        if (q.reminderEnabled && q.reminderDate) {
          const reminderDateStr = q.reminderDate;
          const timeStr = q.reminderTime || '09:00';
          const [rh, rm] = timeStr.split(':').map((v) => parseInt(v, 10));
          const remStart = new Date(`${reminderDateStr}T${String(rh || 9).padStart(2, '0')}:${String(rm || 0).padStart(2, '0')}:00Z`);
          if (remStart >= startUtc && remStart <= endUtc) {
            const remEnd = new Date(remStart.getTime() + 30 * 60 * 1000);
            expandedEvents.push({
              id: `quest-reminder-${q.id}`,
              userId,
              title: `[Reminder] ${q.title}`,
              description: `Quest deadline reminder`,
              startTime: remStart.toISOString(),
              endTime: remEnd.toISOString(),
              allDay: false,
              category: 'reminder',
              color: '#EC4899',
              location: null,
              taskId: q.id,
              taskType: 'quest',
              status: q.status,
              isQuestBlock: true,
              isReminder: true,
            });
          }
        }
      }
    }

    // Sort chronologically
    expandedEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return expandedEvents;
  }

  /**
   * Helper to expand recurring series instances inside view window
   */
  expandRecurrence(baseEvent, windowStart, windowEnd) {
    const instances = [];
    const rule = (baseEvent.recurrenceRule || '').toLowerCase();
    const eventStart = new Date(baseEvent.startTime);
    const eventEnd = new Date(baseEvent.endTime);
    const durationMs = eventEnd.getTime() - eventStart.getTime();

    // Support 'daily', 'weekly', 'weekdays', 'monthly'
    let stepMs = 24 * 60 * 60 * 1000;
    let maxSteps = 90;

    let curStart = new Date(eventStart);
    let step = 0;

    while (curStart <= windowEnd && step < maxSteps) {
      if (curStart >= windowStart) {
        let isValid = true;
        if (rule === 'weekdays') {
          const day = curStart.getUTCDay();
          if (day === 0 || day === 6) isValid = false;
        }

        if (isValid) {
          const curEnd = new Date(curStart.getTime() + durationMs);
          instances.push({
            ...baseEvent,
            id: `${baseEvent.id}-${curStart.toISOString().slice(0, 10)}`,
            startTime: curStart.toISOString(),
            endTime: curEnd.toISOString(),
            recurrenceSeriesId: baseEvent.id,
            isRecurringInstance: true,
          });
        }
      }

      if (rule === 'weekly') {
        curStart = new Date(curStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (rule === 'monthly') {
        curStart = new Date(curStart.setUTCMonth(curStart.getUTCMonth() + 1));
      } else {
        curStart = new Date(curStart.getTime() + stepMs);
      }
      step++;
    }

    return instances;
  }

  /**
   * Create a new calendar event
   */
  async createEvent(userId, data) {
    const title = (data.title || '').trim();
    if (!title) {
      const err = new Error('Event title is required');
      err.status = 400;
      err.code = 'INVALID_TITLE';
      throw err;
    }

    if (!data.startTime || !data.endTime) {
      const err = new Error('startTime and endTime are required');
      err.status = 400;
      err.code = 'INVALID_TIMESTAMPS';
      throw err;
    }

    const startUtc = new Date(data.startTime);
    const endUtc = new Date(data.endTime);

    if (endUtc <= startUtc && !data.allDay) {
      const err = new Error('endTime must be after startTime');
      err.status = 400;
      err.code = 'INVALID_DURATION';
      throw err;
    }

    const res = await query(
      `INSERT INTO calendar_events (
        user_id, title, description, start_time, end_time, all_day,
        category, color, location, recurrence_rule, task_id, task_type, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING
        id, user_id as "userId", title, description,
        start_time as "startTime", end_time as "endTime",
        all_day as "allDay", category, color, location,
        recurrence_rule as "recurrenceRule",
        task_id as "taskId", task_type as "taskType",
        status, created_at as "createdAt", updated_at as "updatedAt"`,
      [
        userId,
        title,
        data.description || null,
        startUtc,
        endUtc,
        Boolean(data.allDay),
        (data.category || 'general').trim(),
        data.color || '#6366F1',
        data.location || null,
        data.recurrenceRule || null,
        data.taskId || null,
        data.taskType || 'task',
        data.status || 'confirmed',
      ]
    );

    return res.rows[0];
  }

  /**
   * Check for scheduling conflicts in a given time slot
   */
  async checkConflicts(userId, { startTime, endTime, excludeEventId = null }) {
    const startUtc = new Date(startTime);
    const endUtc = new Date(endTime);

    const params = [userId, startUtc, endUtc];
    let sql = `
      SELECT
        id, title, start_time as "startTime", end_time as "endTime", category, color
      FROM calendar_events
      WHERE user_id = $1
        AND all_day = false
        AND (start_time < $3 AND end_time > $2)
    `;

    if (excludeEventId) {
      sql += ` AND id != $4`;
      params.push(excludeEventId);
    }

    const { rows } = await query(sql, params);
    return {
      hasConflict: rows.length > 0,
      conflictCount: rows.length,
      conflicts: rows,
    };
  }

  /**
   * Update calendar event (supports rescheduling / resizing across native and virtual events)
   */
  async updateEvent(userId, eventId, data) {
    // 1. Handle Virtual Task Block
    if (eventId.startsWith('task-block-')) {
      const taskId = eventId.replace('task-block-', '');
      const startTime = data.startTime ? new Date(data.startTime) : undefined;
      const endTime = data.endTime ? new Date(data.endTime) : undefined;
      let durationMins = undefined;
      if (startTime && endTime) {
        durationMins = Math.max(15, Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000)));
      }

      const updatedTask = await taskService.updateTask(userId, taskId, {
        startDate: startTime ? startTime.toISOString() : undefined,
        dueDate: endTime ? endTime.toISOString() : undefined,
        estimatedDurationMinutes: durationMins,
        title: data.title ? data.title.replace(/^\[Task\]\s*/, '') : undefined,
      });

      return {
        id: eventId,
        userId,
        title: `[Task] ${updatedTask.title}`,
        description: updatedTask.description,
        startTime: updatedTask.startDate || updatedTask.dueDate,
        endTime: updatedTask.dueDate || updatedTask.startDate,
        allDay: false,
        category: 'task',
        color: '#10B981',
        taskId: updatedTask.id,
        taskType: 'task',
        status: updatedTask.status,
        isTaskBlock: true,
      };
    }

    // 2. Handle Virtual Daily Block
    if (eventId.startsWith('daily-')) {
      const parts = eventId.split('-');
      // UUID is 5 segments: 8-4-4-4-12
      const dailyId = parts.slice(1, 6).join('-');
      if (data.startTime) {
        const d = new Date(data.startTime);
        const timeStr = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
        await dailyService.updateDaily(userId, dailyId, { scheduledTime: timeStr });
      }

      return {
        id: eventId,
        userId,
        taskId: dailyId,
        taskType: 'daily',
        status: 'confirmed',
        ...data,
      };
    }

    // 3. Handle Virtual Quest Block
    if (eventId.startsWith('quest-')) {
      const questId = eventId.replace(/^quest-reminder-/, '').replace(/^quest-/, '');
      if (data.startTime) {
        const dueDate = new Date(data.startTime).toISOString().slice(0, 10);
        await questService.updateQuest(userId, questId, { dueDate });
      }

      return {
        id: eventId,
        userId,
        taskId: questId,
        taskType: 'quest',
        status: 'confirmed',
        ...data,
      };
    }

    // 4. Native calendar_events Table Event
    const existingRes = await query(
      `SELECT * FROM calendar_events WHERE id = $1 AND user_id = $2`,
      [eventId, userId]
    );

    if (existingRes.rows.length === 0) {
      const err = new Error('Calendar event not found');
      err.status = 404;
      err.code = 'EVENT_NOT_FOUND';
      throw err;
    }

    const ex = existingRes.rows[0];
    const title = data.title !== undefined ? data.title.trim() : ex.title;
    const description = data.description !== undefined ? data.description : ex.description;
    const startTime = data.startTime ? new Date(data.startTime) : ex.start_time;
    const endTime = data.endTime ? new Date(data.endTime) : ex.end_time;
    const allDay = data.allDay !== undefined ? Boolean(data.allDay) : ex.all_day;
    const category = data.category !== undefined ? data.category.trim() : ex.category;
    const color = data.color !== undefined ? data.color : ex.color;
    const location = data.location !== undefined ? data.location : ex.location;
    const recurrenceRule = data.recurrenceRule !== undefined ? data.recurrenceRule : ex.recurrence_rule;
    const status = data.status !== undefined ? data.status : ex.status;

    // Two-way synchronization with originating entity if linked
    if (ex.task_id) {
      if (ex.task_type === 'task') {
        const dur = Math.max(15, Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000)));
        await taskService.updateTask(userId, ex.task_id, {
          startDate: startTime.toISOString(),
          estimatedDurationMinutes: dur,
        }).catch(() => null);
      } else if (ex.task_type === 'daily' && data.startTime) {
        const d = new Date(startTime);
        const timeStr = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
        await dailyService.updateDaily(userId, ex.task_id, { scheduledTime: timeStr }).catch(() => null);
      } else if (ex.task_type === 'quest' && data.startTime) {
        const dueDate = new Date(startTime).toISOString().slice(0, 10);
        await questService.updateQuest(userId, ex.task_id, { dueDate }).catch(() => null);
      }
    }

    const res = await query(
      `UPDATE calendar_events
       SET title = $1, description = $2, start_time = $3, end_time = $4,
           all_day = $5, category = $6, color = $7, location = $8,
           recurrence_rule = $9, status = $10, updated_at = now()
       WHERE id = $11 AND user_id = $12
       RETURNING
        id, user_id as "userId", title, description,
        start_time as "startTime", end_time as "endTime",
        all_day as "allDay", category, color, location,
        recurrence_rule as "recurrenceRule",
        task_id as "taskId", task_type as "taskType",
        status, created_at as "createdAt", updated_at as "updatedAt"`,
      [
        title, description, startTime, endTime, allDay,
        category, color, location, recurrenceRule, status,
        eventId, userId
      ]
    );

    return res.rows[0];
  }

  /**
   * Schedule task as a time block into the calendar
   */
  async scheduleTimeBlock(userId, { taskId, taskType = 'task', startTime, durationMinutes = 45, checkConflict = true }) {
    const startUtc = new Date(startTime);
    const endUtc = new Date(startUtc.getTime() + durationMinutes * 60 * 1000);

    // 1. Conflict detection warning
    let conflictInfo = { hasConflict: false, conflicts: [] };
    if (checkConflict) {
      conflictInfo = await this.checkConflicts(userId, { startTime: startUtc, endTime: endUtc });
    }

    // 2. Fetch task title & project
    let taskTitle = 'Scheduled Task';
    let projectName = 'General';

    if (taskType === 'task') {
      const task = await taskService.getTask(userId, taskId);
      taskTitle = task.title;
      projectName = task.projectName || 'General';

      // Update task's start_date and estimated duration
      await taskService.updateTask(userId, taskId, {
        startDate: startUtc.toISOString(),
        estimatedDurationMinutes: durationMinutes,
      });
    }

    // 3. Insert or update calendar_event time-block
    const res = await query(
      `INSERT INTO calendar_events (
        user_id, title, description, start_time, end_time, all_day,
        category, color, location, task_id, task_type, status
      ) VALUES ($1, $2, $3, $4, $5, false, 'time_block', '#6366F1', $6, $7, $8, 'confirmed')
      RETURNING
        id, user_id as "userId", title, description,
        start_time as "startTime", end_time as "endTime",
        all_day as "allDay", category, color, location,
        task_id as "taskId", task_type as "taskType",
        status, created_at as "createdAt", updated_at as "updatedAt"`,
      [
        userId,
        `[Block] ${taskTitle}`,
        `Dedicated focus block for ${taskTitle}`,
        startUtc,
        endUtc,
        projectName,
        taskId,
        taskType,
      ]
    );

    return {
      event: res.rows[0],
      conflictWarning: conflictInfo.hasConflict ? conflictInfo.conflicts : null,
    };
  }

  /**
   * Delete calendar event with two-way sync
   */
  async deleteEvent(userId, eventId) {
    if (eventId.startsWith('task-block-')) {
      const taskId = eventId.replace('task-block-', '');
      await taskService.updateTask(userId, taskId, { startDate: null, scheduledTime: null }).catch(() => null);
      return { success: true, id: eventId };
    }

    if (eventId.startsWith('daily-')) {
      const parts = eventId.split('-');
      const dailyId = parts.slice(1, 6).join('-');
      await dailyService.updateDaily(userId, dailyId, { scheduledTime: null }).catch(() => null);
      return { success: true, id: eventId };
    }

    if (eventId.startsWith('quest-')) {
      const questId = eventId.replace(/^quest-reminder-/, '').replace(/^quest-/, '');
      await questService.updateQuest(userId, questId, { dueDate: null, reminderEnabled: false }).catch(() => null);
      return { success: true, id: eventId };
    }

    const res = await query(
      `DELETE FROM calendar_events WHERE id = $1 AND user_id = $2 RETURNING id, task_id as "taskId", task_type as "taskType"`,
      [eventId, userId]
    );

    if (res.rows.length === 0) {
      const err = new Error('Calendar event not found');
      err.status = 404;
      err.code = 'EVENT_NOT_FOUND';
      throw err;
    }

    const deleted = res.rows[0];
    if (deleted.taskId && deleted.taskType === 'task') {
      await taskService.updateTask(userId, deleted.taskId, { startDate: null }).catch(() => null);
    }

    return { success: true, id: eventId };
  }

  /**
   * Toggle item completion directly from Calendar
   */
  async toggleComplete(userId, eventId) {
    if (eventId.startsWith('task-block-')) {
      const taskId = eventId.replace('task-block-', '');
      const task = await taskService.getTask(userId, taskId);
      if (task.status === 'completed') {
        return await taskService.uncompleteTask(userId, taskId);
      }
      return await taskService.completeTask(userId, taskId);
    }

    if (eventId.startsWith('daily-')) {
      const parts = eventId.split('-');
      const dailyId = parts.slice(1, 6).join('-');
      const daily = await dailyService.getDailyById(userId, dailyId);
      if (daily.isCompleteToday) {
        return await dailyService.undoDaily(userId, dailyId);
      }
      return await dailyService.completeDaily(userId, dailyId);
    }

    if (eventId.startsWith('quest-')) {
      const questId = eventId.replace(/^quest-reminder-/, '').replace(/^quest-/, '');
      return await questService.completeQuest(userId, questId);
    }

    // Native event
    const existingRes = await query(
      `SELECT * FROM calendar_events WHERE id = $1 AND user_id = $2`,
      [eventId, userId]
    );
    if (existingRes.rows.length === 0) {
      const err = new Error('Calendar event not found');
      err.status = 404;
      err.code = 'EVENT_NOT_FOUND';
      throw err;
    }

    const ex = existingRes.rows[0];
    if (ex.task_id && ex.task_type === 'task') {
      const task = await taskService.getTask(userId, ex.task_id);
      if (task.status === 'completed') {
        return await taskService.uncompleteTask(userId, ex.task_id);
      }
      return await taskService.completeTask(userId, ex.task_id);
    }

    const newStatus = ex.status === 'completed' ? 'confirmed' : 'completed';
    const updated = await query(
      `UPDATE calendar_events SET status = $1, updated_at = now() WHERE id = $2 AND user_id = $3 RETURNING *`,
      [newStatus, eventId, userId]
    );
    return { success: true, event: updated.rows[0] };
  }
}

export const calendarService = new CalendarService();
