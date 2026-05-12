-- ============================================================
-- GESTÃO DE CLIENTES — Schema
-- Execute no Supabase: SQL Editor › New Query › Cole tudo › Run
--
-- O script é idempotente: pode ser rodado mais de uma vez
-- sem erro (DROP IF EXISTS antes de cada CREATE).
-- ============================================================


-- ============================================================
-- FUNÇÃO reutilizável: atualiza updated_at em qualquer tabela
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- ============================================================
-- TABELA: clients
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID      NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT      NOT NULL,
  company_name TEXT,
  niche        TEXT,
  city         TEXT,
  whatsapp     TEXT,
  status       TEXT      NOT NULL DEFAULT 'ativo',
  notes        TEXT,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients (user_id);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients: select own" ON clients;
DROP POLICY IF EXISTS "clients: insert own" ON clients;
DROP POLICY IF EXISTS "clients: update own" ON clients;
DROP POLICY IF EXISTS "clients: delete own" ON clients;

CREATE POLICY "clients: select own"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "clients: insert own"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients: update own"
  ON clients FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients: delete own"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_clients_updated_at ON clients;
CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- TABELA: payments
-- client_id ON DELETE CASCADE: apagar cliente apaga seus pagamentos.
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID      NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id  UUID      REFERENCES clients(id) ON DELETE CASCADE,
  amount     NUMERIC   NOT NULL,
  due_date   DATE,
  paid_date  DATE,
  status     TEXT      NOT NULL DEFAULT 'pendente',
  notes      TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id   ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments (client_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments: select own" ON payments;
DROP POLICY IF EXISTS "payments: insert own" ON payments;
DROP POLICY IF EXISTS "payments: update own" ON payments;
DROP POLICY IF EXISTS "payments: delete own" ON payments;

CREATE POLICY "payments: select own"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "payments: insert own"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payments: update own"
  ON payments FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payments: delete own"
  ON payments FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- TABELA: tasks
-- client_id ON DELETE CASCADE: apagar cliente apaga suas tarefas.
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID      NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id   UUID      REFERENCES clients(id) ON DELETE CASCADE,
  title       TEXT      NOT NULL,
  description TEXT,
  type        TEXT,
  due_date    DATE,
  status      TEXT      NOT NULL DEFAULT 'pendente',
  priority    TEXT      NOT NULL DEFAULT 'media',
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id   ON tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks (client_id);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks: select own" ON tasks;
DROP POLICY IF EXISTS "tasks: insert own" ON tasks;
DROP POLICY IF EXISTS "tasks: update own" ON tasks;
DROP POLICY IF EXISTS "tasks: delete own" ON tasks;

CREATE POLICY "tasks: select own"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "tasks: insert own"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks: update own"
  ON tasks FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks: delete own"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
