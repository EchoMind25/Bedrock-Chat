-- ============================================================
-- Bedrock Chat: Push Subscriptions (Web Push / VAPID)
-- Stores browser push endpoints so the server can send
-- notifications even when the app tab is closed.
-- ============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON push_subscriptions(user_id);

-- RLS: users can only manage their own subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_push_subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);
