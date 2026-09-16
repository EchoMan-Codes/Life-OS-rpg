-- Migration 0008: Deep Work Focus Chamber (Pomodoro)
-- UP

CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  planned_duration_seconds INT NOT NULL CHECK (planned_duration_seconds IN (900, 1500, 3000)),
  ambient_sound TEXT CHECK (ambient_sound IN ('rain', 'lofi', 'silence')),
  completed BOOLEAN NOT NULL DEFAULT false,
  mana_regenerated INT NOT NULL DEFAULT 0 CHECK (mana_regenerated >= 0)
);

-- Database-level constraint: at most ONE active (unended) session per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_focus_sessions_active_user
  ON focus_sessions(user_id)
  WHERE ended_at IS NULL;

-- Chronological index for history queries
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_started
  ON focus_sessions(user_id, started_at DESC);

-- DOWN
-- DROP INDEX IF EXISTS idx_focus_sessions_user_started;
-- DROP INDEX IF EXISTS idx_focus_sessions_active_user;
-- DROP TABLE IF EXISTS focus_sessions CASCADE;
