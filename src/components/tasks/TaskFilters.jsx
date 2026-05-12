import { useWorkspace } from '../../hooks/useWorkspace.js'
import { TASK_STATUS, TASK_PRIORITY } from '../../hooks/useTasks.js'

const PERIOD_OPTIONS = [
  { value: 'todas',       label: 'Todos os períodos' },
  { value: 'hoje',        label: 'Hoje' },
  { value: 'esta_semana', label: 'Esta semana' },
  { value: 'este_mes',    label: 'Este mês' },
  { value: 'atrasadas',   label: 'Atrasadas' },
]

const selectCls =
  'py-2 pl-3 pr-8 text-sm rounded-lg border border-gray-200 bg-white text-gray-600 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors ' +
  'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'

export default function TaskFilters({
  status,   onStatus,
  priority, onPriority,
  clientId, onClient,
  type,     onType,
  period,   onPeriod,
  clients,
}) {
  const { workspace } = useWorkspace()
  const t = workspace.tasks

  return (
    <div className="flex flex-wrap gap-2.5">
      <select value={period} onChange={e => onPeriod(e.target.value)} className={selectCls}>
        {PERIOD_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select value={status} onChange={e => onStatus(e.target.value)} className={selectCls}>
        <option value="">Todos os status</option>
        {TASK_STATUS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
        <option value="atrasada">Atrasada</option>
      </select>

      <select value={priority} onChange={e => onPriority(e.target.value)} className={selectCls}>
        <option value="">Todas as prioridades</option>
        {TASK_PRIORITY.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select value={type} onChange={e => onType(e.target.value)} className={`${selectCls} flex-1 min-w-[160px]`}>
        <option value="">Todos os tipos</option>
        {t.types.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select value={clientId} onChange={e => onClient(e.target.value)} className={`${selectCls} flex-1 min-w-[160px]`}>
        <option value="">Todos os {t.clientLabel.toLowerCase()}s</option>
        {clients.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  )
}
