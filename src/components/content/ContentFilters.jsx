import { STATUS_CONFIG } from '../../utils/contentTracking.js'

const STATUS_OPTIONS = [
  { value: 'atrasado',    label: STATUS_CONFIG.atrasado.label },
  { value: 'pendente',    label: STATUS_CONFIG.pendente.label },
  { value: 'em_dia',      label: STATUS_CONFIG.em_dia.label },
  { value: 'meta_batida', label: STATUS_CONFIG.meta_batida.label },
  { value: 'sem_plano',   label: STATUS_CONFIG.sem_plano.label },
]

const selectCls =
  'py-2 pl-3 pr-8 text-sm rounded-lg border border-gray-200 bg-white text-gray-600 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors ' +
  'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'

export default function ContentFilters({
  clientId, onClient,
  status,   onStatus,
  clients,
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      <select value={status} onChange={e => onStatus(e.target.value)} className={selectCls}>
        <option value="">Todos os status</option>
        {STATUS_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        value={clientId}
        onChange={e => onClient(e.target.value)}
        className={`${selectCls} flex-1 min-w-[180px]`}
      >
        <option value="">Todos os clientes</option>
        {clients.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  )
}
