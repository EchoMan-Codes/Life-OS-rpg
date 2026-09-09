-- Migration 0003: Habits & Habit Logs
-- UP

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'habit_direction') THEN
    CREATE TYPE habit_direction AS ENUM ('positive', 'negative', 'both');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty') THEN
    CREATE TYPE difficulty AS ENUM ('trivial', 'easy', 'medium', 'hard');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  direction habit_direction NOT NULL DEFAULT 'positive',
  difficulty difficulty NOT NULL DEFAULT 'easy',
  current_streak INT NOT NULL DEFAULT 0,
  best_streak INT NOT NULL DEFAULT 0,
  last_scored_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direction habit_direction NOT NULL,
  xp_awarded INT NOT NULL,
  gold_awarded INT NOT NULL,
  hp_change INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_active ON habits(user_id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id_created ON habit_logs(habit_id, created_at);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id_created ON habit_logs(user_id, created_at);

-- DOWN
-- DROP TABLE IF EXISTS habit_logs CASCADE;
-- DROP TABLE IF EXISTS habits CASCADE;
-- DROP TYPE IF EXISTS difficulty CASCADE;
-- DROP TYPE IF EXISTS habit_direction CASCADE;
