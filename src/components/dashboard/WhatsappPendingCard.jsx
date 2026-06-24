import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'

export default function WhatsappPendingCard({ pendingCount, overdueCount }) {
  const total = pendingCount + overdueCount

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/30">
          <MessageCircle size={16} strokeWidth={1.75} className="text-green-600 dark:text-green-400" />
        </div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Cobranças pendentes</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Pendentes</span>
          <span className={`text-sm font-semibold tabular-nums ${pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>
            {pendingCount} pagamento{pendingCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Atrasados</span>
          <span className={`text-sm font-semibold tabular-nums ${overdueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
            {overdueCount} pagamento{overdueCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {total > 0 && (
        <Link
          to="/payments"
          className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 py-2 text-xs font-semibold hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors border border-green-100 dark:border-green-800/40"
        >
          <MessageCircle size={12} />
          Cobrar via WhatsApp
        </Link>
      )}

      {total === 0 && (
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 text-center">
          Nenhum pagamento em aberto.
        </p>
      )}
    </div>
  )
}
