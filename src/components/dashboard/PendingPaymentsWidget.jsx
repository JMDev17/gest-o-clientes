import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { effectiveStatus } from '../../hooks/usePayments.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { formatDateBR } from '../../utils/dateHelpers.js'

export default function PendingPaymentsWidget({ pending, overdue }) {
  const all = [...overdue, ...pending]

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Pagamentos pendentes</p>
        <Link to="/financeiro" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
          Ver todos →
        </Link>
      </div>

      {all.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4">Nenhum pagamento pendente.</p>
      )}

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {all.map(p => {
          const eff = effectiveStatus(p)
          const isOverdue = eff === 'atrasado'
          return (
            <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {isOverdue && <AlertTriangle size={12} className="text-red-500 shrink-0" />}
                  <p className={`text-sm font-medium truncate ${isOverdue ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {p.client?.name ?? 'Sem cliente'}
                  </p>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Venc: {formatDateBR(p.due_date)}
                  {p.notes && ` · ${p.notes}`}
                </p>
              </div>
              <span className={`text-sm font-semibold tabular-nums whitespace-nowrap ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                {formatCurrency(p.amount)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
