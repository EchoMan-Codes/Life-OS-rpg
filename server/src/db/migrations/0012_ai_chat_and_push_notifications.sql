-- Migration 0012: AI Chat History, Web Push Subscriptions, and Notification Deduplication Deliveries
-- UP

-- 1. AI Chat Messages Table for persistent multi-turn conversations
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  structured_action JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user_created ON ai_chat_messages(user_id, created_at ASC);

-- 2. Web Push Subscriptions Table for multi-device background push delivery
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- 3. Notification Deliveries Table for strict idempotency and deduplication across tabs/devices
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  occurrence_key TEXT NOT NULL UNIQUE,
  item_type VARCHAR(50) NOT NULL, -- 'daily', 'quest', 'habit', 'system', 'test'
  item_id UUID,
  fire_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'delivered', -- 'delivered', 'missed', 'snoozed'
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user_fire ON notification_deliveries(user_id, fire_time DESC);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_key ON notification_deliveries(occurrence_key);

-- DOWN
-- DROP TABLE IF EXISTS notification_deliveries CASCADE;
-- DROP TABLE IF EXISTS push_subscriptions CASCADE;
-- DROP TABLE IF EXISTS ai_chat_messages CASCADE;
