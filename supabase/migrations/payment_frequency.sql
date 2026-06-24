-- =============================================================================
-- Payment Frequency Support
-- Adds recurrence_frequency column to payments table.
-- Existing rows get NULL (backward compatible — treated as 'mensal').
-- Run this in the Supabase SQL Editor.
-- =============================================================================

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS recurrence_frequency TEXT
  CHECK (
    recurrence_frequency IS NULL OR
    recurrence_frequency IN ('semanal','quinzenal','mensal','trimestral','semestral','anual')
  );

COMMENT ON COLUMN payments.recurrence_frequency IS
  'Frequency used when generating recurring payments. NULL = legacy monthly.';
