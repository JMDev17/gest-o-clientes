import { X } from 'lucide-react'
import { PAYMENT_STATUS } from '../../hooks/usePayments.js'

const TYPE_OPTIONS = [
  { value: 'unico',     label: 'Único' },
  { value: 'parcelado', label: 'Parcelado' },
  { value: 'entrada',   label: 'Entrada' },
  { value: 'recorrente', label: 'Recorrente' },
]

const selectCls =
  'py-2 pl-3 pr-8 text-sm rounded-lg border border-gray-200 bg-white text-gray-600 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors ' +
  'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'

export default function FinancialFilters({
  month, onMonth,
  clientId, onClient,
  status, onStatus,
  paymentType, onPaymentType,
  clients,
  reportsConfig,
}) {
  const clientLabel = reportsConfig?.clientLabel || 'Cliente'

  const hasFilters = month !== '' || clientId !== '' || status !== '' || paymentType !== ''

  function clearAll() {
    onMonth('')
    onClient('')
    onStatus('')
    onPaymentType('')
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 mb-5">
      <input
        type="month"
        value={month}
        onChange={e => onMonth(e.target.value)}
        className={selectCls}
      />

      <select value={clientId} onChange={e => onClient(e.target.value)} className={selectCls}>
        <option value="">Todos os {clientLabel.toLowerCase()}s</option>
        {clients.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select value={status} onChange={e => onStatus(e.target.value)} className={selectCls}>
        <option value="">Todos os status</option>
        {PAYMENT_STATUS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select value={paymentType} onChange={e => onPaymentType(e.target.value)} className={selectCls}>
        <option value="">Todos os tipos</option>
        {TYPE_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <X size={13} strokeWidth={2} />
          Limpar filtros
        </button>
      )}
    </div>
  )
}
