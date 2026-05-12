import { CalendarDays } from 'lucide-react'
import { PAYMENT_STATUS, effectiveStatus } from '../../hooks/usePayments.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { groupByDay } from '../../utils/financialReports.js'

export default function PaymentsByDay({ payments }) {
  const groups = groupByDay(payments)

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="font-semibold text-gray-700 dark:text-gray-300">Nenhum pagamento encontrado</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente ajustar os filtros.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map(group => (
        <div key={group.date} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          {/* Day header */}
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2.5">
              <CalendarDays size={14} strokeWidth={1.75} className="text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {group.dateFormatted}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {group.payments.length} pagamento{group.payments.length !== 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
              {formatCurrency(group.total)}
            </span>
          </div>

          {/* Payments of the day */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {group.payments.map(p => {
              const effStatus  = effectiveStatus(p)
              const statusInfo = PAYMENT_STATUS.find(s => s.value === effStatus)
              const badgeStyle = statusInfo?.style ?? 'bg-gray-100 text-gray-500 ring-gray-200'
              const badgeLabel = statusInfo?.label ?? effStatus

              return (
                <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {p.client?.name ?? <span className="text-gray-400 dark:text-gray-500 italic text-xs">Sem cliente</span>}
                    </p>
                    {p.notes && (
                      <p className="hidden sm:block text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px]">
                        {p.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${badgeStyle}`}>
                      {badgeLabel}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums whitespace-nowrap">
                      {formatCurrency(p.amount)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
