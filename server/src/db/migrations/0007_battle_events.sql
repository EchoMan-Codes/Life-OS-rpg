-- Migration 0007: RPG Battle Events & Activity Feed
-- UP

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'battle_source') THEN
    CREATE TYPE battle_source AS ENUM ('habit', 'daily', 'quest', 'boss');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS battle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type battle_source NOT NULL,
  source_id UUID,
  xp_awarded INT NOT NULL DEFAULT 0,
  gold_awarded INT NOT NULL DEFAULT 0,
  hp_change INT NOT NULL DEFAULT 0,
  loot_item_id UUID REFERENCES reward_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_battle_events_user_created ON battle_events(user_id, created_at DESC);

-- DOWN
-- DROP INDEX IF EXISTS idx_battle_events_user_created;
-- DROP TABLE IF EXISTS battle_events CASCADE;
-- DROP TYPE IF EXISTS battle_source;
