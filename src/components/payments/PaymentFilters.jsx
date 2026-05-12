import { useWorkspace } from '../../hooks/useWorkspace.js'
import { PAYMENT_STATUS } from '../../hooks/usePayments.js'

function buildMonthOptions() {
  const options = [{ value: '', label: 'Todos os meses' }]
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const raw = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    options.push({ value, label: raw.charAt(0).toUpperCase() + raw.slice(1) })
  }
  return options
}

const MONTH_OPTIONS = buildMonthOptions()

const selectCls =
  'py-2 pl-3 pr-8 text-sm rounded-lg border border-gray-200 bg-white text-gray-600 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors ' +
  'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'

export default function PaymentFilters({
  status, onStatus,
  clientId, onClient,
  month, onMonth,
  clients,
}) {
  const { workspace } = useWorkspace()
  const p = workspace.payments

  return (
    <div className="flex flex-col sm:flex-row gap-2.5">
      <select value={status} onChange={e => onStatus(e.target.value)} className={selectCls}>
        <option value="">Todos os status</option>
        {PAYMENT_STATUS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select value={clientId} onChange={e => onClient(e.target.value)} className={`${selectCls} flex-1`}>
        <option value="">Todos os {p.clientLabel.toLowerCase()}s</option>
        {clients.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select value={month} onChange={e => onMonth(e.target.value)} className={selectCls}>
        {MONTH_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
