-- Migration 0009: Evening Reflection & Anti-Burnout Rest Mode
-- UP

CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  for_date DATE NOT NULL,
  mood_score SMALLINT NOT NULL CHECK (mood_score BETWEEN 1 AND 5),
  energy_score SMALLINT NOT NULL CHECK (energy_score BETWEEN 1 AND 5),
  focus_score SMALLINT NOT NULL CHECK (focus_score BETWEEN 1 AND 5),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, for_date)
);

CREATE TABLE IF NOT EXISTS rest_mode (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  activated_at TIMESTAMPTZ,
  reason TEXT,
  auto_deactivate_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reflections_user_date ON reflections(user_id, for_date DESC);
CREATE INDEX IF NOT EXISTS idx_rest_mode_active ON rest_mode(user_id) WHERE is_active = true;

-- Backfill default rest_mode rows for existing users
INSERT INTO rest_mode (user_id, is_active)
SELECT id, false FROM users
ON CONFLICT (user_id) DO NOTHING;

-- DOWN
-- DROP INDEX IF EXISTS idx_rest_mode_active;
-- DROP INDEX IF EXISTS idx_reflections_user_date;
-- DROP TABLE IF EXISTS rest_mode CASCADE;
-- DROP TABLE IF EXISTS reflections CASCADE;
