-- Migration 0005: Quests, Checklist Subtasks, Milestones, and Audit Tracking
-- UP

-- 1. Create quest priority and status enums if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quest_priority') THEN
    CREATE TYPE quest_priority AS ENUM ('low', 'medium', 'high', 'critical');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quest_status') THEN
    CREATE TYPE quest_status AS ENUM ('active', 'completed', 'archived');
  END IF;
END $$;

-- 2. Create quests table
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority quest_priority NOT NULL DEFAULT 'medium',
  difficulty difficulty NOT NULL DEFAULT 'medium',
  due_date DATE,
  status quest_status NOT NULL DEFAULT 'active',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- 3. Create quest_items table (checklist subtasks)
CREATE TABLE IF NOT EXISTS quest_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  xp_reward INT NOT NULL DEFAULT 2,
  gold_reward INT NOT NULL DEFAULT 1,
  position INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create quest_milestones table (25%, 50%, 75%, 100% threshold rewards)
CREATE TABLE IF NOT EXISTS quest_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  threshold_percent INT NOT NULL,
  is_reached BOOLEAN NOT NULL DEFAULT false,
  xp_bonus INT NOT NULL DEFAULT 5,
  gold_bonus INT NOT NULL DEFAULT 2,
  reached_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_quest_milestone_threshold UNIQUE (quest_id, threshold_percent)
);

-- 5. Create quest_completions audit and idempotency table
CREATE TABLE IF NOT EXISTS quest_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'item_complete', 'milestone_reached', 'quest_complete'
  item_id UUID REFERENCES quest_items(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES quest_milestones(id) ON DELETE CASCADE,
  xp_awarded INT NOT NULL DEFAULT 0,
  gold_awarded INT NOT NULL DEFAULT 0,
  leveled_up BOOLEAN NOT NULL DEFAULT false,
  levels_gained INT NOT NULL DEFAULT 0,
  points_awarded INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Indexes and Unique Partial Constraints for Performance and Zero Double-Rewards
CREATE INDEX IF NOT EXISTS idx_quests_user_id ON quests(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_user_status ON quests(user_id, status) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quest_items_quest_id ON quest_items(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_items_user_id ON quest_items(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_milestones_quest_id ON quest_milestones(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_completions_quest_id ON quest_completions(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_completions_user_id ON quest_completions(user_id);

-- Enforce strict single-grant idempotency at database level
CREATE UNIQUE INDEX IF NOT EXISTS uq_quest_completions_quest_complete ON quest_completions(quest_id) WHERE action_type = 'quest_complete';
CREATE UNIQUE INDEX IF NOT EXISTS uq_quest_completions_item_complete ON quest_completions(item_id) WHERE action_type = 'item_complete';
CREATE UNIQUE INDEX IF NOT EXISTS uq_quest_completions_milestone ON quest_completions(milestone_id) WHERE action_type = 'milestone_reached';

-- DOWN
-- DROP INDEX IF EXISTS uq_quest_completions_milestone;
-- DROP INDEX IF EXISTS uq_quest_completions_item_complete;
-- DROP INDEX IF EXISTS uq_quest_completions_quest_complete;
-- DROP INDEX IF EXISTS idx_quest_completions_user_id;
-- DROP INDEX IF EXISTS idx_quest_completions_quest_id;
-- DROP INDEX IF EXISTS idx_quest_milestones_quest_id;
-- DROP INDEX IF EXISTS idx_quest_items_user_id;
-- DROP INDEX IF EXISTS idx_quest_items_quest_id;
-- DROP INDEX IF EXISTS idx_quests_user_status;
-- DROP INDEX IF EXISTS idx_quests_user_id;
-- DROP TABLE IF EXISTS quest_completions CASCADE;
-- DROP TABLE IF EXISTS quest_milestones CASCADE;
-- DROP TABLE IF EXISTS quest_items CASCADE;
-- DROP TABLE IF EXISTS quests CASCADE;
-- DROP TYPE IF EXISTS quest_status;
-- DROP TYPE IF EXISTS quest_priority;
