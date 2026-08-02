-- =============================================================================
-- PAYMENTS — Consolidated column migration
-- Adds all columns required by the payment type feature.
-- Safe to run multiple times (idempotent via IF NOT EXISTS).
--
-- Run this once in the Supabase SQL Editor if payment creation returns an error
-- like: column "payment_type" of relation "payments" does not exist
-- =============================================================================

-- 1. Payment type tracking columns
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_type       TEXT    NOT NULL DEFAULT 'unico',
  ADD COLUMN IF NOT EXISTS installment_number INTEGER,
  ADD COLUMN IF NOT EXISTS total_installments INTEGER;

-- 2. Recurrence frequency column
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS recurrence_frequency TEXT
  CHECK (
    recurrence_frequency IS NULL OR
    recurrence_frequency IN ('semanal', 'quinzenal', 'mensal', 'trimestral', 'semestral', 'anual')
  );
