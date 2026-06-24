-- ================================================================
-- MÓDULO FINANCEIRO — Migration SQL
-- Execute este script no Supabase SQL Editor
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 1. CATEGORIAS FINANCEIRAS
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_categories (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope      TEXT        NOT NULL CHECK (scope IN ('company', 'personal')),
  name       TEXT        NOT NULL,
  color      TEXT        NOT NULL DEFAULT '#6b7280',
  is_system  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS financial_categories_user_idx
  ON financial_categories(user_id);

CREATE INDEX IF NOT EXISTS financial_categories_scope_idx
  ON financial_categories(user_id, scope);

ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'financial_categories'
      AND policyname = 'Users manage own categories'
  ) THEN
    CREATE POLICY "Users manage own categories"
      ON financial_categories
      FOR ALL
      TO authenticated
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────
-- 2. TRANSAÇÕES FINANCEIRAS
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_transactions (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope             TEXT         NOT NULL CHECK (scope IN ('company', 'personal')),
  type              TEXT         NOT NULL CHECK (type IN ('income', 'expense')),
  description       TEXT         NOT NULL,
  amount            NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category_id       UUID         REFERENCES financial_categories(id) ON DELETE SET NULL,
  category_name     TEXT,
  date              DATE         NOT NULL,
  payment_method    TEXT         CHECK (
                      payment_method IN (
                        'pix','cartao_credito','cartao_debito',
                        'boleto','dinheiro','transferencia','outro'
                      )
                    ),
  status            TEXT         NOT NULL DEFAULT 'paid'
                      CHECK (status IN ('paid','pending')),
  notes             TEXT,
  receipt_url       TEXT,
  transfer_group_id UUID,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS financial_transactions_user_idx
  ON financial_transactions(user_id);

CREATE INDEX IF NOT EXISTS financial_transactions_scope_idx
  ON financial_transactions(user_id, scope);

CREATE INDEX IF NOT EXISTS financial_transactions_date_idx
  ON financial_transactions(user_id, date DESC);

CREATE INDEX IF NOT EXISTS financial_transactions_type_idx
  ON financial_transactions(user_id, scope, type);

CREATE INDEX IF NOT EXISTS financial_transactions_transfer_idx
  ON financial_transactions(transfer_group_id)
  WHERE transfer_group_id IS NOT NULL;

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'financial_transactions'
      AND policyname = 'Users manage own transactions'
  ) THEN
    CREATE POLICY "Users manage own transactions"
      ON financial_transactions
      FOR ALL
      TO authenticated
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────
-- 3. AUTO-UPDATE updated_at
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS financial_transactions_updated_at ON financial_transactions;
CREATE TRIGGER financial_transactions_updated_at
  BEFORE UPDATE ON financial_transactions
  FOR EACH ROW EXECUTE FUNCTION _update_updated_at();
