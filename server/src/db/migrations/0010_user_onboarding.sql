-- Migration 0010: User Onboarding & Section Preferences
-- Up migration adds onboarding persistence fields to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_answers JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_section TEXT DEFAULT 'habits-study';

-- DOWN
-- ALTER TABLE users DROP COLUMN IF EXISTS selected_section;
-- ALTER TABLE users DROP COLUMN IF EXISTS onboarding_answers;
-- ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed;
