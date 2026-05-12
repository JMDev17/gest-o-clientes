-- ============================================================
-- GESTÃO DE CLIENTES — Tabela appointments
-- Requer: service-catalog.sql executado antes
-- Execute no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS appointments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id        UUID        REFERENCES clients(id) ON DELETE SET NULL,
  service_id       UUID        REFERENCES service_catalog(id) ON DELETE SET NULL,
  contract_id      UUID        REFERENCES contracts(id) ON DELETE SET NULL,
  title            TEXT        NOT NULL,
  description      TEXT,
  appointment_date DATE        NOT NULL,
  start_time       TIME,
  end_time         TIME,
  status           TEXT        NOT NULL DEFAULT 'agendado'
                               CHECK (status IN ('agendado', 'confirmado', 'realizado', 'faltou', 'cancelado')),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id          ON appointments (user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_date ON appointments (appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id        ON appointments (client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_contract_id      ON appointments (contract_id);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments: select own" ON appointments;
DROP POLICY IF EXISTS "appointments: insert own" ON appointments;
DROP POLICY IF EXISTS "appointments: update own" ON appointments;
DROP POLICY IF EXISTS "appointments: delete own" ON appointments;

CREATE POLICY "appointments: select own"
  ON appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "appointments: insert own"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "appointments: update own"
  ON appointments FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "appointments: delete own"
  ON appointments FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON appointments;
CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
