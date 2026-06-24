-- Incremental migration: payment type columns
-- Run AFTER schema.sql (adds columns without touching existing data)

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_type       TEXT    NOT NULL DEFAULT 'unico',
  ADD COLUMN IF NOT EXISTS installment_number INTEGER,
  ADD COLUMN IF NOT EXISTS total_installments INTEGER;

-- payment_type values: 'unico' | 'parcelado' | 'entrada' | 'recorrente'
-- installment_number: 1-based index within the group (1/3, 2/3 …)
-- total_installments: total count for the group
