-- Migration 0011: Quest Reminders, User Feedback, Support Channels, and Extended Preferences
-- UP

-- 1. Quest Reminders
ALTER TABLE quests ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS reminder_time VARCHAR(10);
ALTER TABLE quests ADD COLUMN IF NOT EXISTS reminder_date DATE;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS reminder_frequency VARCHAR(20) DEFAULT 'days_before';
ALTER TABLE quests ADD COLUMN IF NOT EXISTS reminder_days_before INT DEFAULT 1;

-- 2. User Feedback & Support submissions
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  app_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  platform VARCHAR(20) NOT NULL DEFAULT 'web',
  attachment_url TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'Submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_user ON user_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);

-- DOWN
-- DROP TABLE IF EXISTS user_feedback CASCADE;
-- ALTER TABLE quests DROP COLUMN IF EXISTS reminder_days_before;
-- ALTER TABLE quests DROP COLUMN IF EXISTS reminder_frequency;
-- ALTER TABLE quests DROP COLUMN IF EXISTS reminder_date;
-- ALTER TABLE quests DROP COLUMN IF EXISTS reminder_time;
-- ALTER TABLE quests DROP COLUMN IF EXISTS reminder_enabled;
