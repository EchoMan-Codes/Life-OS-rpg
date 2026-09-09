-- Migration 0002: Character Stats & Auto-Initialization Trigger
-- Up migration creates character_stats table, trigger on users insert, and backfills existing users

CREATE TABLE IF NOT EXISTS character_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  level INT NOT NULL DEFAULT 1 CHECK (level >= 1),
  xp INT NOT NULL DEFAULT 0 CHECK (xp >= 0),
  hp INT NOT NULL DEFAULT 50 CHECK (hp >= 0),
  max_hp INT NOT NULL DEFAULT 50 CHECK (max_hp >= 1),
  mana INT NOT NULL DEFAULT 20 CHECK (mana >= 0),
  max_mana INT NOT NULL DEFAULT 20 CHECK (max_mana >= 1),
  gold INT NOT NULL DEFAULT 0 CHECK (gold >= 0),
  strength INT NOT NULL DEFAULT 5 CHECK (strength >= 1),
  intelligence INT NOT NULL DEFAULT 5 CHECK (intelligence >= 1),
  vitality INT NOT NULL DEFAULT 5 CHECK (vitality >= 1),
  willpower INT NOT NULL DEFAULT 5 CHECK (willpower >= 1),
  perception INT NOT NULL DEFAULT 5 CHECK (perception >= 1),
  unallocated_points INT NOT NULL DEFAULT 0 CHECK (unallocated_points >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger function to automatically create a character_stats row when a user registers
CREATE OR REPLACE FUNCTION create_character_stats_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO character_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_character_stats ON users;

CREATE TRIGGER trigger_create_character_stats
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_character_stats_for_user();

-- Backfill existing users who do not yet have a character_stats row
INSERT INTO character_stats (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- DOWN
-- DROP TRIGGER IF EXISTS trigger_create_character_stats ON users;
-- DROP FUNCTION IF EXISTS create_character_stats_for_user();
-- DROP TABLE IF EXISTS character_stats CASCADE;
