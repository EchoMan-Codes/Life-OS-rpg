-- Migration 0013: Productivity Command Center Upgrade
-- UP

-- 1. Tasks Table (Unified task and deadline manager)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'todo', -- 'inbox', 'todo', 'in_progress', 'completed', 'cancelled'
  priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  difficulty difficulty NOT NULL DEFAULT 'easy',
  due_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  scheduled_time VARCHAR(10),
  estimated_duration_minutes INT DEFAULT 30,
  actual_duration_minutes INT DEFAULT 0,
  project_name VARCHAR(100) DEFAULT 'General',
  tags TEXT[] DEFAULT '{}',
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  position INT DEFAULT 0,
  xp_reward INT NOT NULL DEFAULT 10,
  gold_reward INT NOT NULL DEFAULT 5,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks(user_id, due_date) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(user_id, project_name);

-- 2. Task Completions Audit & Idempotency Table (Zero duplicate XP rewards)
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  xp_awarded INT NOT NULL DEFAULT 0,
  gold_awarded INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_task_completions_task UNIQUE (task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_completions_user ON task_completions(user_id);

-- 3. Calendar Events Table (Events and Task Time Blocks)
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  color VARCHAR(30) DEFAULT '#6366F1',
  location TEXT,
  recurrence_rule TEXT,
  recurrence_series_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  task_type VARCHAR(20) DEFAULT 'task',
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_range ON calendar_events(user_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_series ON calendar_events(recurrence_series_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_task ON calendar_events(task_id);

-- 4. Extend Focus Sessions (Flexible Durations, Pause States, and Task Linkage)
DO $$ BEGIN
  ALTER TABLE focus_sessions DROP CONSTRAINT IF EXISTS focus_sessions_planned_duration_seconds_check;
  ALTER TABLE focus_sessions ADD CONSTRAINT focus_sessions_planned_duration_seconds_check 
    CHECK (planned_duration_seconds BETWEEN 60 AND 14400);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS task_id UUID;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS task_type VARCHAR(20) DEFAULT 'task';
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS task_title TEXT;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS session_type VARCHAR(20) DEFAULT 'focus';
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS total_paused_seconds INT DEFAULT 0;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS actual_duration_seconds INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_focus_sessions_task ON focus_sessions(user_id, task_id);

-- 5. Weekly Reviews Table (Persistent Weekly Reflections & Goals)
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  wins TEXT,
  blockers TEXT,
  lessons TEXT,
  next_week_priorities TEXT[] DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_weekly_reviews_user_week UNIQUE (user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user_week ON weekly_reviews(user_id, week_start_date DESC);

-- 6. AI Action Logs (Idempotent Execution & Audit Tracking)
CREATE TABLE IF NOT EXISTS ai_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  idempotency_key TEXT UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'executed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_action_logs_user ON ai_action_logs(user_id, created_at DESC);

-- DOWN
-- DROP TABLE IF EXISTS ai_action_logs CASCADE;
-- DROP TABLE IF EXISTS weekly_reviews CASCADE;
-- ALTER TABLE focus_sessions DROP COLUMN IF EXISTS actual_duration_seconds;
-- ALTER TABLE focus_sessions DROP COLUMN IF EXISTS total_paused_seconds;
-- ALTER TABLE focus_sessions DROP COLUMN IF EXISTS paused_at;
-- ALTER TABLE focus_sessions DROP COLUMN IF EXISTS session_type;
-- ALTER TABLE focus_sessions DROP COLUMN IF EXISTS task_title;
-- ALTER TABLE focus_sessions DROP COLUMN IF EXISTS task_type;
-- ALTER TABLE focus_sessions DROP COLUMN IF EXISTS task_id;
-- DROP TABLE IF EXISTS calendar_events CASCADE;
-- DROP TABLE IF EXISTS task_completions CASCADE;
-- DROP TABLE IF EXISTS tasks CASCADE;
