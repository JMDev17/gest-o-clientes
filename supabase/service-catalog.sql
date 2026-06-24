-- ============================================================
-- GESTÃO DE CLIENTES — Tabela service_catalog
-- Execute no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS service_catalog (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  category         TEXT        CHECK (category IN ('facial', 'corporal', 'injetavel', 'massagem', 'pacote', 'outro')),
  description      TEXT,
  price            NUMERIC,
  promo_price      NUMERIC,
  sessions_count   INTEGER,
  duration_minutes INTEGER,
  status           TEXT        NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_catalog_user_id ON service_catalog (user_id);

ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_catalog: select own" ON service_catalog;
DROP POLICY IF EXISTS "service_catalog: insert own" ON service_catalog;
DROP POLICY IF EXISTS "service_catalog: update own" ON service_catalog;
DROP POLICY IF EXISTS "service_catalog: delete own" ON service_catalog;

CREATE POLICY "service_catalog: select own"
  ON service_catalog FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "service_catalog: insert own"
  ON service_catalog FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "service_catalog: update own"
  ON service_catalog FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "service_catalog: delete own"
  ON service_catalog FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_service_catalog_updated_at ON service_catalog;
CREATE TRIGGER trg_service_catalog_updated_at
  BEFORE UPDATE ON service_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
