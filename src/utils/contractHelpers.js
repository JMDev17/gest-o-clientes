function pad(v) { return String(v).padStart(2, '0') }

// Returns the number of whole calendar months from today until endDate.
// Returns null when endDate is absent, 0 when the contract has already expired.
export function getRemainingMonths(_startDate, endDate) {
  if (!endDate) return null

  const today = new Date()
  const [ey, em, ed] = endDate.split('-').map(Number)

  // Whole months between today's month and end month
  let months = (ey - today.getFullYear()) * 12 + (em - 1 - today.getMonth())

  // If end day hasn't yet reached today's day, the last month is incomplete
  if (ed < today.getDate()) months -= 1

  return Math.max(0, months)
}

export function addMonthsToDate(dateStr, n) {
  const orig = new Date(dateStr + 'T00:00:00')
  const totalMonths = orig.getMonth() + n
  const month0 = totalMonths % 12
  const year = orig.getFullYear() + Math.floor(totalMonths / 12)
  const d = new Date(year, month0, orig.getDate())
  if (d.getMonth() !== month0) d.setDate(0)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function calcContractEndDate(startDate, durationMonths) {
  if (!startDate || !durationMonths) return ''
  const d = new Date(addMonthsToDate(startDate, Number(durationMonths)) + 'T00:00:00')
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function generateMarketingPayments(clientId, contract) {
  const payments = []
  const startDate = contract.start_date || new Date().toISOString().split('T')[0]
  const day = parseInt(startDate.split('-')[2], 10)

  if (Number(contract.setup_fee) > 0) {
    payments.push({
      payment_type: 'unico',
      client_id: clientId,
      notes: 'Taxa de setup',
      amount: Number(contract.setup_fee),
      due_date: startDate,
      status: 'pendente',
      paid_date: null,
      installment_number: null,
      total_installments: null,
    })
  }

  const n = Number(contract.contract_duration_months) || 0
  const monthly = Number(contract.recurring_amount) || 0

  if (n > 0 && monthly > 0) {
    const [sy, sm] = startDate.split('-').map(Number)
    for (let i = 0; i < n; i++) {
      const totalMonth = (sm - 1) + i
      const year = sy + Math.floor(totalMonth / 12)
      const month0 = totalMonth % 12
      const d = new Date(year, month0, day)
      if (d.getMonth() !== month0) d.setDate(0)
      payments.push({
        payment_type: 'recorrente',
        client_id: clientId,
        notes: `Mensalidade ${i + 1}/${n}`,
        amount: monthly,
        due_date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        status: 'pendente',
        paid_date: null,
        installment_number: i + 1,
        total_installments: n,
      })
    }
  }

  return payments
}
