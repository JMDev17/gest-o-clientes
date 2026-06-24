import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { formatDateBR } from '../../utils/dateHelpers.js'
import { useWorkspace } from '../../hooks/useWorkspace.js'

export default function ContractsEndingWidget({ contracts }) {
  const { workspaceType } = useWorkspace()
  const isEstetica = workspaceType === 'estetica'
  const title = isEstetica ? 'Pacotes próximos do fim' : 'Contratos próximos do fim'
  const linkLabel = isEstetica ? 'Ver pacotes →' : 'Ver contratos →'

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</p>
        <Link to="/contracts" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
          {linkLabel}
        </Link>
      </div>

      {contracts.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4">
          {isEstetica ? 'Nenhum pacote vencendo em breve.' : 'Nenhum contrato vencendo em breve.'}
        </p>
      )}

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {contracts.map(c => {
          const clientName = c.clients?.name ?? '—'
          const remaining = isEstetica
            ? `${Math.max(0, (c.total_sessions || 0) - (c.completed_sessions || 0))} sessões restantes`
            : `Término: ${formatDateBR(c.end_date)}`

          return (
            <div key={c.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {c.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {clientName} · {remaining}
                </p>
              </div>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-50 dark:bg-amber-900/30">
                <Clock size={12} strokeWidth={2} className="text-amber-500 dark:text-amber-400" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
