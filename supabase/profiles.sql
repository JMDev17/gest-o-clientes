-- ── Tabela profiles ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     text,
  business_type text NOT NULL CHECK (business_type IN ('marketing', 'estetica')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Trigger updated_at ───────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

CREATE POLICY "profiles_select"
  ON profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete"
  ON profiles FOR DELETE USING (auth.uid() = user_id);

-- ── Índice ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles (user_id);
