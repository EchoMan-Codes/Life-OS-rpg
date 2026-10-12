-- Migration 0014: Jeevan Quests Unified System Upgrade
-- UP

-- 1. Create custom enums if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quest_type') THEN
    CREATE TYPE quest_type AS ENUM ('weekly', 'monthly', 'yearly', 'custom');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quest_category') THEN
    CREATE TYPE quest_category AS ENUM ('learning', 'projects', 'wellbeing', 'personal_growth', 'other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quest_progress_mode') THEN
    CREATE TYPE quest_progress_mode AS ENUM ('count', 'task', 'manual');
  END IF;
END $$;

-- 2. Add 'epic' to difficulty enum and 'expired', 'cancelled' to quest_status enum
DO $$ BEGIN
  ALTER TYPE difficulty ADD VALUE IF NOT EXISTS 'epic';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE quest_status ADD VALUE IF NOT EXISTS 'expired';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE quest_status ADD VALUE IF NOT EXISTS 'cancelled';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Extend quests table
ALTER TABLE quests ADD COLUMN IF NOT EXISTS quest_type quest_type NOT NULL DEFAULT 'weekly';
ALTER TABLE quests ADD COLUMN IF NOT EXISTS limit_category VARCHAR(20) NOT NULL DEFAULT 'weekly';
ALTER TABLE quests ADD COLUMN IF NOT EXISTS category quest_category NOT NULL DEFAULT 'other';
ALTER TABLE quests ADD COLUMN IF NOT EXISTS objective TEXT;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS progress_mode quest_progress_mode NOT NULL DEFAULT 'task';
ALTER TABLE quests ADD COLUMN IF NOT EXISTS target_value INT NOT NULL DEFAULT 1;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS current_value INT NOT NULL DEFAULT 0;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS reward_xp INT NOT NULL DEFAULT 200;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS reward_coins INT NOT NULL DEFAULT 40;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE quests ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Backfill objective from title/description for existing legacy rows
UPDATE quests SET objective = COALESCE(description, title) WHERE objective IS NULL;

-- 4. Create quest_extensions table for deadline audit history
CREATE TABLE IF NOT EXISTS quest_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  previous_due_date DATE,
  new_due_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create quest_progress_events table for idempotent event tracking
CREATE TABLE IF NOT EXISTS quest_progress_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL,
  source_id UUID,
  idempotency_key TEXT,
  delta INT NOT NULL DEFAULT 1,
  current_value INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint for source idempotency
CREATE UNIQUE INDEX IF NOT EXISTS uq_quest_progress_source ON quest_progress_events(quest_id, source_type, source_id)
  WHERE source_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_quest_progress_idempotency ON quest_progress_events(quest_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 6. Link tasks table to quests
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS quest_id UUID REFERENCES quests(id) ON DELETE SET NULL;

-- 7. High-performance indexes
CREATE INDEX IF NOT EXISTS idx_quests_user_limits ON quests(user_id, limit_category, status)
  WHERE status = 'active' AND archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quests_user_type ON quests(user_id, quest_type);
CREATE INDEX IF NOT EXISTS idx_tasks_quest_id ON tasks(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_extensions_quest ON quest_extensions(quest_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quest_progress_events_quest ON quest_progress_events(quest_id, created_at DESC);

-- DOWN
-- DROP INDEX IF EXISTS idx_quest_progress_events_quest;
-- DROP INDEX IF EXISTS idx_quest_extensions_quest;
-- DROP INDEX IF EXISTS idx_tasks_quest_id;
-- DROP INDEX IF EXISTS idx_quests_user_type;
-- DROP INDEX IF EXISTS idx_quests_user_limits;
-- DROP INDEX IF EXISTS uq_quest_progress_idempotency;
-- DROP INDEX IF EXISTS uq_quest_progress_source;
-- DROP TABLE IF EXISTS quest_progress_events CASCADE;
-- DROP TABLE IF EXISTS quest_extensions CASCADE;
-- ALTER TABLE tasks DROP COLUMN IF EXISTS quest_id;
-- ALTER TABLE quests DROP COLUMN IF EXISTS cancelled_at;
-- ALTER TABLE quests DROP COLUMN IF EXISTS starts_at;
-- ALTER TABLE quests DROP COLUMN IF EXISTS reward_coins;
-- ALTER TABLE quests DROP COLUMN IF EXISTS reward_xp;
-- ALTER TABLE quests DROP COLUMN IF EXISTS current_value;
-- ALTER TABLE quests DROP COLUMN IF EXISTS target_value;
-- ALTER TABLE quests DROP COLUMN IF EXISTS progress_mode;
-- ALTER TABLE quests DROP COLUMN IF EXISTS objective;
-- ALTER TABLE quests DROP COLUMN IF EXISTS category;
-- ALTER TABLE quests DROP COLUMN IF EXISTS limit_category;
-- ALTER TABLE quests DROP COLUMN IF EXISTS quest_type;
-- DROP TYPE IF EXISTS quest_progress_mode;
-- DROP TYPE IF EXISTS quest_category;
-- DROP TYPE IF EXISTS quest_type;
--- Note: 'expired' and 'cancelled' in quest_status and 'epic' in difficulty remain if rolled back as PostgreSQL does not support dropping enum values without recreating the type.
