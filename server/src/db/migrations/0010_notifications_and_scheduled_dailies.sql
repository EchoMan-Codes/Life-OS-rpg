-- Migration 0010: Notifications, Scheduled Dailies, Password Reset Tokens, and Account Preferences
-- UP

-- 1. Notifications table for in-app notification center and reminder history
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'daily_reminder', -- 'daily_reminder', 'habit_reminder', 'quest_deadline', 'achievement', 'ai_recommendation', 'system'
  action_url VARCHAR(255),
  is_read BOOLEAN NOT NULL DEFAULT false,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- 2. Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);

-- 3. Extend dailies with scheduling, priority and reminder fields
ALTER TABLE dailies ADD COLUMN IF NOT EXISTS scheduled_time VARCHAR(10);
ALTER TABLE dailies ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 30;
ALTER TABLE dailies ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
ALTER TABLE dailies ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false;
ALTER TABLE dailies ADD COLUMN IF NOT EXISTS reminder_minutes_before INT DEFAULT 10;
ALTER TABLE dailies ADD COLUMN IF NOT EXISTS target_date DATE;

-- 4. Extend users with profile motto, preferences, and onboarding status
ALTER TABLE users ADD COLUMN IF NOT EXISTS motto TEXT DEFAULT 'Disciplined today. A better tomorrow.';
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"dailyReminders": true, "habitReminders": true, "questReminders": true, "reminderMinutesBefore": 10, "soundEnabled": true}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_preferences JSONB DEFAULT '{"customApiKey": "", "autoPlanEnabled": false}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- DOWN
-- ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed;
-- ALTER TABLE users DROP COLUMN IF EXISTS ai_preferences;
-- ALTER TABLE users DROP COLUMN IF EXISTS notification_preferences;
-- ALTER TABLE users DROP COLUMN IF EXISTS motto;
-- ALTER TABLE dailies DROP COLUMN IF EXISTS target_date;
-- ALTER TABLE dailies DROP COLUMN IF EXISTS reminder_minutes_before;
-- ALTER TABLE dailies DROP COLUMN IF EXISTS reminder_enabled;
-- ALTER TABLE dailies DROP COLUMN IF EXISTS priority;
-- ALTER TABLE dailies DROP COLUMN IF EXISTS duration_minutes;
-- ALTER TABLE dailies DROP COLUMN IF EXISTS scheduled_time;
-- DROP TABLE IF EXISTS password_reset_tokens CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
