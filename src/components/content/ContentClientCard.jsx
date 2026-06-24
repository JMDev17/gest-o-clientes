import { Plus, History, Settings } from 'lucide-react'
import { computeMetrics, STATUS_CONFIG } from '../../utils/contentTracking.js'

export default function ContentClientCard({
  client,
  plan,
  logs,
  status,
  onRegister,
  onEditPlan,
  onHistory,
}) {
  const metrics   = computeMetrics(plan, logs)
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.sem_plano

  return (
    <div className={[
      'rounded-xl bg-white dark:bg-gray-900 border flex flex-col overflow-hidden',
      status === 'atrasado'
        ? 'border-red-200 dark:border-red-800'
        : 'border-gray-200 dark:border-gray-800',
    ].join(' ')}>

      {/* Body */}
      <div className="px-4 py-3 flex-1">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">{client?.name}</p>
            {client?.company_name && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">{client.company_name}</p>
            )}
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${statusCfg.style}`}>
            {statusCfg.label}
          </span>
        </div>

        {metrics.length > 0 ? (
          <div className="space-y-2">
            {metrics.map(({ type, label, done, goal }) => (
              <MetricRow key={type} label={label} done={done} goal={goal} />
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            {plan ? 'Nenhuma meta configurada.' : 'Sem plano configurado.'}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="grid grid-cols-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/30 divide-x divide-gray-100 dark:divide-gray-800">
        <button
          onClick={() => onRegister(client)}
          className="flex items-center justify-center gap-1 py-2.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
        >
          <Plus size={11} strokeWidth={2.5} />
          Registrar
        </button>
        <button
          onClick={() => onHistory(client)}
          className="flex items-center justify-center gap-1 py-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <History size={12} strokeWidth={2} />
          Histórico
        </button>
        <button
          onClick={() => onEditPlan(client, plan)}
          className="flex items-center justify-center gap-1 py-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Settings size={12} strokeWidth={2} />
          Plano
        </button>
      </div>
    </div>
  )
}

function MetricRow({ label, done, goal }) {
  const pct = goal > 0 ? Math.min(100, Math.round((done / goal) * 100)) : 0
  const met = done >= goal
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{label}</span>
        <span className={`text-[11px] font-bold tabular-nums shrink-0 ml-2 ${met ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
          {done}/{goal}
        </span>
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-1">
        <div
          className={`h-1 rounded-full transition-all ${met ? 'bg-emerald-500' : 'bg-brand-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
