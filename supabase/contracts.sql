-- ============================================================
-- GESTÃO DE CLIENTES — Tabela Contracts
-- ============================================================

CREATE TABLE IF NOT EXISTS contracts (
  id                       UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID      NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id                UUID      NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contract_type            TEXT      CHECK (contract_type IN ('marketing', 'estetica')),
  name                     TEXT      NOT NULL,
  description              TEXT,
  setup_fee                NUMERIC,
  recurring_amount         NUMERIC,
  contract_duration_months INTEGER,
  start_date               DATE,
  end_date                 DATE,
  auto_renew               BOOLEAN   DEFAULT false,
  total_sessions           INTEGER,
  completed_sessions       INTEGER   DEFAULT 0,
  total_value              NUMERIC,
  status                   TEXT      NOT NULL DEFAULT 'ativo',
  notes                    TEXT,
  created_at               TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_user_id   ON contracts (user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts (client_id);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contracts: select own" ON contracts;
DROP POLICY IF EXISTS "contracts: insert own" ON contracts;
DROP POLICY IF EXISTS "contracts: update own" ON contracts;
DROP POLICY IF EXISTS "contracts: delete own" ON contracts;

CREATE POLICY "contracts: select own"
  ON contracts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "contracts: insert own"
  ON contracts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contracts: update own"
  ON contracts FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contracts: delete own"
  ON contracts FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_contracts_updated_at ON contracts;
CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Alterando a tabela payments para suportar contract_id
-- ============================================================
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON payments (contract_id);
