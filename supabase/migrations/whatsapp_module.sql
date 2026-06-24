-- =============================================================================
-- WhatsApp Charging Module
-- Run this in the Supabase SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id   UUID         REFERENCES clients(id)  ON DELETE SET NULL,
  payment_id  UUID         REFERENCES payments(id) ON DELETE SET NULL,
  phone       TEXT,
  message     TEXT         NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_user_id    ON whatsapp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_client_id  ON whatsapp_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_payment_id ON whatsapp_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at ON whatsapp_logs(created_at DESC);

ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_logs: isolado por usuário" ON whatsapp_logs
  FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);
