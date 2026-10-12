-- Migration 0015: Focus Chamber & Anti-Cheat Commitment System
-- UP

-- 1. Create focus_profiles table (reusable distraction shield profiles)
CREATE TABLE IF NOT EXISTS focus_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  restricted_apps JSONB NOT NULL DEFAULT '[]'::jsonb,
  restricted_domains JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_duration_seconds INT NOT NULL DEFAULT 1500 CHECK (default_duration_seconds BETWEEN 60 AND 14400),
  commitment_level INT NOT NULL DEFAULT 1 CHECK (commitment_level IN (1, 2, 3)),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_focus_profiles_user ON focus_profiles(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_focus_profiles_user_default ON focus_profiles(user_id) WHERE is_default = true;

-- 2. Extend focus_sessions table with commitment, shield, and reward tracking
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS commitment_level INT NOT NULL DEFAULT 1 CHECK (commitment_level IN (1, 2, 3));
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'interrupted', 'abandoned'));
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS goal_description TEXT;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS linked_entity_type VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (linked_entity_type IN ('none', 'task', 'quest', 'daily', 'habit'));
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS linked_entity_id UUID;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS shield_profile_id UUID REFERENCES focus_profiles(id) ON DELETE SET NULL;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS shield_status VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (shield_status IN ('none', 'active', 'degraded', 'failed', 'released'));
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS interruption_count INT NOT NULL DEFAULT 0 CHECK (interruption_count >= 0);
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS early_exit_requested BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS emergency_exit_used BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS xp_awarded INT NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0);
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS gold_awarded INT NOT NULL DEFAULT 0 CHECK (gold_awarded >= 0);

-- Sync status for pre-existing rows
UPDATE focus_sessions 
SET status = CASE 
  WHEN completed = true THEN 'completed' 
  WHEN ended_at IS NOT NULL THEN 'abandoned' 
  ELSE 'active' 
END 
WHERE status = 'active' AND ended_at IS NOT NULL;

-- 3. Create focus_session_events table (append-oriented audit trail for sessions)
CREATE TABLE IF NOT EXISTS focus_session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES focus_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_focus_events_session ON focus_session_events(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_focus_events_user ON focus_session_events(user_id, created_at DESC);

-- DOWN
-- DROP TABLE IF EXISTS focus_session_events CASCADE;
-- ALTER TABLE focus_sessions DROP COLUMN IF EXISTS gold_awarded;
-- ALTER TABLE focus_sessions DROP COLUMN IF EXISTS xp_awarded;
-- ALTER TABLE focus_sessions DROP COLUMN IF EXISTS emergency_exit_used;
-- ALTER TABLE focus_sessions DROP COLUMN IF EXISTS early_exit_requested;
-- ALTER TABLE focus_sessions DROP COLUMN IF EXISTS interruption_count;
-- ALTER TABLE focus_sessions DROP COLUMN IF EXISTS shield_status;
-- ALTER TABLE focus_sessions DROP COLUMN IF EXISTS shield_profile_id;
-- ALTER TABLE focus_sessions DROP COLUMN IF EXISTS linked_entity_id;
-- ALTER TABLE focus_sessions DROP COLUMN IF EXISTS linked_entity_type;
-- ALTER TABLE focus_sessions DROP COLUMN IF EXISTS goal_description;
-- ALTER TABLE focus_sessions DROP COLUMN IF EXISTS status;
-- ALTER TABLE focus_sessions DROP COLUMN IF EXISTS commitment_level;
-- DROP TABLE IF EXISTS focus_profiles CASCADE;
