-- Migration 0006: Custom Reward Shop, Inventory, and Purchases
-- UP

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reward_type') THEN
    CREATE TYPE reward_type AS ENUM ('custom', 'equipment', 'streak_shield');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS reward_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cost_gold INT NOT NULL CHECK (cost_gold >= 0),
  type reward_type NOT NULL DEFAULT 'custom',
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_item_id UUID NOT NULL REFERENCES reward_items(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_item_id UUID NOT NULL REFERENCES reward_items(id) ON DELETE CASCADE,
  gold_spent INT NOT NULL CHECK (gold_spent >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reward_items_user_id ON reward_items(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_items_active ON reward_items(user_id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);

-- DOWN
-- DROP INDEX IF EXISTS idx_purchases_user_id;
-- DROP INDEX IF EXISTS idx_inventory_user_id;
-- DROP INDEX IF EXISTS idx_reward_items_active;
-- DROP INDEX IF EXISTS idx_reward_items_user_id;
-- DROP TABLE IF EXISTS purchases CASCADE;
-- DROP TABLE IF EXISTS inventory CASCADE;
-- DROP TABLE IF EXISTS reward_items CASCADE;
-- DROP TYPE IF EXISTS reward_type;
