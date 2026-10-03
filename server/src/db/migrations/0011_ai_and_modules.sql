-- Migration 0011: Jeevan AI, StudySmart, and Finance Persistence
-- UP

-- 1. Expenses Table for Finance Module
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  category TEXT NOT NULL DEFAULT 'other',
  note TEXT,
  spent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_spent ON expenses(user_id, spent_at DESC);

-- 2. Study Logs Table for StudySmart Module
CREATE TABLE IF NOT EXISTS study_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  notes TEXT,
  xp_earned INT NOT NULL DEFAULT 0,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_logs_user_logged ON study_logs(user_id, logged_at DESC);

-- 3. AI Messages Table for Global Intelligence Layer
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  action_type TEXT,
  action_payload JSONB,
  action_status TEXT DEFAULT 'none' CHECK (action_status IN ('none', 'proposed', 'confirmed', 'executed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_user_created ON ai_messages(user_id, created_at ASC);

-- DOWN
-- DROP TABLE IF EXISTS ai_messages CASCADE;
-- DROP TABLE IF EXISTS study_logs CASCADE;
-- DROP TABLE IF EXISTS expenses CASCADE;
