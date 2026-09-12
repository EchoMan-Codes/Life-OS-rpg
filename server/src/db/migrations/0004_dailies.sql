-- Migration 0004: Dailies, Daily Completions, and User Timezone
-- UP

-- 1. Add timezone column to users table with UTC default
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';

-- 2. Create dailies table
CREATE TABLE IF NOT EXISTS dailies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  difficulty difficulty NOT NULL DEFAULT 'easy',
  active_days SMALLINT[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}', -- 0=Sun..6=Sat
  streak_current INT NOT NULL DEFAULT 0,
  streak_best INT NOT NULL DEFAULT 0,
  streak_shield_charges INT NOT NULL DEFAULT 0,
  is_complete_today BOOLEAN NOT NULL DEFAULT false,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

-- 3. Create daily_completions table with reward audit tracking for safe undo
CREATE TABLE IF NOT EXISTS daily_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_id UUID NOT NULL REFERENCES dailies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  for_date DATE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_shield BOOLEAN NOT NULL DEFAULT false,
  xp_awarded INT NOT NULL DEFAULT 0,
  gold_awarded INT NOT NULL DEFAULT 0,
  leveled_up BOOLEAN NOT NULL DEFAULT false,
  levels_gained INT NOT NULL DEFAULT 0,
  points_awarded INT NOT NULL DEFAULT 0,
  UNIQUE (daily_id, for_date)
);

-- 4. Indexes for tenant isolation and query performance
CREATE INDEX IF NOT EXISTS idx_dailies_user_id ON dailies(user_id);
CREATE INDEX IF NOT EXISTS idx_dailies_user_active ON dailies(user_id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_daily_completions_user_date ON daily_completions(user_id, for_date);
CREATE INDEX IF NOT EXISTS idx_daily_completions_daily_date ON daily_completions(daily_id, for_date);

-- DOWN
-- DROP INDEX IF EXISTS idx_daily_completions_daily_date;
-- DROP INDEX IF EXISTS idx_daily_completions_user_date;
-- DROP INDEX IF EXISTS idx_dailies_user_active;
-- DROP INDEX IF EXISTS idx_dailies_user_id;
-- DROP TABLE IF EXISTS daily_completions CASCADE;
-- DROP TABLE IF EXISTS dailies CASCADE;
-- ALTER TABLE users DROP COLUMN IF EXISTS timezone;
