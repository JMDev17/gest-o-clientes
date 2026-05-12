-- Content Tracking module — run AFTER schema.sql
-- Requires: set_updated_at() trigger function (created in schema.sql)

-- ─── content_plans ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_plans (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id                UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  photos_per_week          INTEGER     DEFAULT 0,
  posts_per_week           INTEGER     DEFAULT 0,
  reviews_reply_per_week   INTEGER     DEFAULT 0,
  products_update_per_week INTEGER     DEFAULT 0,
  is_active                BOOLEAN     DEFAULT TRUE,
  notes                    TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, client_id)
);

ALTER TABLE content_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_plans_select" ON content_plans;
DROP POLICY IF EXISTS "content_plans_insert" ON content_plans;
DROP POLICY IF EXISTS "content_plans_update" ON content_plans;
DROP POLICY IF EXISTS "content_plans_delete" ON content_plans;

CREATE POLICY "content_plans_select" ON content_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "content_plans_insert" ON content_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "content_plans_update" ON content_plans FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "content_plans_delete" ON content_plans FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS content_plans_user_id_idx   ON content_plans(user_id);
CREATE INDEX IF NOT EXISTS content_plans_client_id_idx ON content_plans(client_id);

DROP TRIGGER IF EXISTS set_content_plans_updated_at ON content_plans;
CREATE TRIGGER set_content_plans_updated_at
  BEFORE UPDATE ON content_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── content_logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id    UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  content_type TEXT        NOT NULL CHECK (content_type IN (
                             'photo', 'post', 'review_reply',
                             'product_update', 'service_update', 'other')),
  quantity     INTEGER     DEFAULT 1,
  performed_at DATE        NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_logs_select" ON content_logs;
DROP POLICY IF EXISTS "content_logs_insert" ON content_logs;
DROP POLICY IF EXISTS "content_logs_update" ON content_logs;
DROP POLICY IF EXISTS "content_logs_delete" ON content_logs;

CREATE POLICY "content_logs_select" ON content_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "content_logs_insert" ON content_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "content_logs_update" ON content_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "content_logs_delete" ON content_logs FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS content_logs_user_id_idx      ON content_logs(user_id);
CREATE INDEX IF NOT EXISTS content_logs_client_id_idx    ON content_logs(client_id);
CREATE INDEX IF NOT EXISTS content_logs_performed_at_idx ON content_logs(performed_at);

DROP TRIGGER IF EXISTS set_content_logs_updated_at ON content_logs;
CREATE TRIGGER set_content_logs_updated_at
  BEFORE UPDATE ON content_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
