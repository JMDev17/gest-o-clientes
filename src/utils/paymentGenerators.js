function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Adds n months to a date string, clamping to the last valid day of the target month.
function addMonths(dateStr, n) {
  const orig = new Date(dateStr + 'T00:00:00')
  const totalMonths = orig.getMonth() + n
  const intendedMonth = totalMonths % 12
  const intendedYear  = orig.getFullYear() + Math.floor(totalMonths / 12)
  const d = new Date(intendedYear, intendedMonth, orig.getDate())
  if (d.getMonth() !== intendedMonth) d.setDate(0) // clamp overflow to last valid day
  return toDateStr(d)
}

// Adds n days to a date string.
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

// Returns a date for (year, 0-based month, day), clamping overflow.
function clampDay(year, month0, day) {
  const d = new Date(year, month0, day)
  if (d.getMonth() !== month0) d.setDate(0)
  return d
}

// Given a first_due_date and a 0-based iteration index, returns the next due date.
function stepDate(first_due_date, frequency, i) {
  switch (frequency) {
    case 'semanal':    return addDays(first_due_date, 7  * i)
    case 'quinzenal':  return addDays(first_due_date, 15 * i)
    case 'trimestral': return addMonths(first_due_date, 3  * i)
    case 'semestral':  return addMonths(first_due_date, 6  * i)
    case 'anual':      return addMonths(first_due_date, 12 * i)
    case 'mensal':
    default:           return addMonths(first_due_date, i)
  }
}

export function generateSingle({ client_id, notes, amount, due_date, status, paid_date }) {
  return [{
    payment_type:         'unico',
    client_id:            client_id || null,
    notes:                notes     || null,
    amount:               Number(amount),
    due_date:             due_date  || null,
    status,
    paid_date:            status === 'pago' ? (paid_date || null) : null,
    installment_number:   null,
    total_installments:   null,
    recurrence_frequency: null,
  }]
}

export function generateInstallments({ client_id, notes, total_amount, installments, first_due_date }) {
  const n     = Math.max(2, parseInt(installments, 10))
  const total = Number(total_amount)
  const base  = Math.floor(total * 100 / n) / 100
  const extra = Math.round((total - base * n) * 100) / 100 // rounding remainder goes on last installment

  return Array.from({ length: n }, (_, i) => ({
    payment_type:         'parcelado',
    client_id:            client_id || null,
    notes:                notes     || null,
    amount:               i === n - 1 ? Math.round((base + extra) * 100) / 100 : base,
    due_date:             addMonths(first_due_date, i),
    status:               'pendente',
    paid_date:            null,
    installment_number:   i + 1,
    total_installments:   n,
    recurrence_frequency: null,
  }))
}

export function generateDownPayment({ client_id, notes, total_amount, down_pct, down_date, remainder_date }) {
  const total   = Number(total_amount)
  const downAmt = Math.round(total * Number(down_pct) / 100 * 100) / 100
  const remAmt  = Math.round((total - downAmt) * 100) / 100
  const label   = notes || ''

  return [
    {
      payment_type:         'entrada',
      client_id:            client_id || null,
      notes:                label ? `${label} — Entrada` : 'Entrada',
      amount:               downAmt,
      due_date:             down_date      || null,
      status:               'pendente',
      paid_date:            null,
      installment_number:   1,
      total_installments:   2,
      recurrence_frequency: null,
    },
    {
      payment_type:         'entrada',
      client_id:            client_id || null,
      notes:                label ? `${label} — Restante` : 'Restante',
      amount:               remAmt,
      due_date:             remainder_date || null,
      status:               'pendente',
      paid_date:            null,
      installment_number:   2,
      total_installments:   2,
      recurrence_frequency: null,
    },
  ]
}

/**
 * Generates recurring payment records for any supported frequency.
 * Uses first_due_date as the anchor — each subsequent date is computed
 * relative to it (not the previous date), preventing drift accumulation.
 */
export function generateRecurring({
  client_id,
  notes,
  periodic_amount,
  first_due_date,
  num_occurrences,
  frequency = 'mensal',
}) {
  const n = Math.max(1, parseInt(num_occurrences, 10))

  return Array.from({ length: n }, (_, i) => ({
    payment_type:         'recorrente',
    client_id:            client_id || null,
    notes:                notes     || null,
    amount:               Number(periodic_amount),
    due_date:             stepDate(first_due_date, frequency, i),
    status:               'pendente',
    paid_date:            null,
    installment_number:   i + 1,
    total_installments:   n,
    recurrence_frequency: frequency,
  }))
}
