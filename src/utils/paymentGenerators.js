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

// Returns a date for (year, 0-based month, day), clamping overflow.
function clampDay(year, month0, day) {
  const d = new Date(year, month0, day)
  if (d.getMonth() !== month0) d.setDate(0)
  return d
}

export function generateSingle({ client_id, notes, amount, due_date, status, paid_date }) {
  return [{
    payment_type:       'unico',
    client_id:          client_id || null,
    notes:              notes     || null,
    amount:             Number(amount),
    due_date:           due_date  || null,
    status,
    paid_date:          status === 'pago' ? (paid_date || null) : null,
    installment_number: null,
    total_installments: null,
  }]
}

export function generateInstallments({ client_id, notes, total_amount, installments, first_due_date }) {
  const n     = Math.max(2, parseInt(installments, 10))
  const total = Number(total_amount)
  const base  = Math.floor(total * 100 / n) / 100
  const extra = Math.round((total - base * n) * 100) / 100 // rounding remainder goes on last installment

  return Array.from({ length: n }, (_, i) => ({
    payment_type:       'parcelado',
    client_id:          client_id || null,
    notes:              notes     || null,
    amount:             i === n - 1 ? Math.round((base + extra) * 100) / 100 : base,
    due_date:           addMonths(first_due_date, i),
    status:             'pendente',
    paid_date:          null,
    installment_number: i + 1,
    total_installments: n,
  }))
}

export function generateDownPayment({ client_id, notes, total_amount, down_pct, down_date, remainder_date }) {
  const total   = Number(total_amount)
  const downAmt = Math.round(total * Number(down_pct) / 100 * 100) / 100
  const remAmt  = Math.round((total - downAmt) * 100) / 100
  const label   = notes || ''

  return [
    {
      payment_type:       'entrada',
      client_id:          client_id || null,
      notes:              label ? `${label} — Entrada` : 'Entrada',
      amount:             downAmt,
      due_date:           down_date      || null,
      status:             'pendente',
      paid_date:          null,
      installment_number: 1,
      total_installments: 2,
    },
    {
      payment_type:       'entrada',
      client_id:          client_id || null,
      notes:              label ? `${label} — Restante` : 'Restante',
      amount:             remAmt,
      due_date:           remainder_date || null,
      status:             'pendente',
      paid_date:          null,
      installment_number: 2,
      total_installments: 2,
    },
  ]
}

export function generateRecurring({ client_id, notes, monthly_amount, start_month, num_months, recurrence_day }) {
  const n           = Math.max(1, parseInt(num_months, 10))
  const day         = Math.max(1, Math.min(31, parseInt(recurrence_day, 10)))
  const [sy, sm]    = start_month.split('-').map(Number)
  const startMonth0 = sm - 1 // 0-based

  return Array.from({ length: n }, (_, i) => {
    const totalMonth = startMonth0 + i
    const year       = sy + Math.floor(totalMonth / 12)
    const month0     = totalMonth % 12
    const d          = clampDay(year, month0, day)

    return {
      payment_type:       'recorrente',
      client_id:          client_id || null,
      notes:              notes     || null,
      amount:             Number(monthly_amount),
      due_date:           toDateStr(d),
      status:             'pendente',
      paid_date:          null,
      installment_number: i + 1,
      total_installments: n,
    }
  })
}
