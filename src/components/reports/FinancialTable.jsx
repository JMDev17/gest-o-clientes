import { AlertCircle } from 'lucide-react'
import { PAYMENT_STATUS, effectiveStatus } from '../../hooks/usePayments.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { formatDateBR } from '../../utils/dateHelpers.js'

const TYPE_LABELS = {
  unico:     'Único',
  parcelado: 'Parcelado',
  entrada:   'Entrada',
  recorrente:'Recorrente',
}

export default function FinancialTable({ payments, loading, error, reportsConfig }) {
  const clientLabel   = reportsConfig?.clientLabel   || 'Cliente'

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-5 py-4">
        <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="font-semibold text-gray-700 dark:text-gray-300">Nenhum pagamento encontrado</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente ajustar os filtros.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Desktop header */}
      <div className="hidden lg:grid grid-cols-[100px_90px_1fr_1fr_100px_88px_88px] gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        <span>Vencimento</span>
        <span>Pagamento</span>
        <span>{clientLabel}</span>
        <span>Descrição</span>
        <span className="text-right">Valor</span>
        <span>Status</span>
        <span>Tipo</span>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {payments.map(p => (
          <Row key={p.id} payment={p} clientLabel={clientLabel} />
        ))}
      </div>
    </div>
  )
}

function Row({ payment }) {
  const effStatus  = effectiveStatus(payment)
  const statusInfo = PAYMENT_STATUS.find(s => s.value === effStatus)
  const badgeStyle = statusInfo?.style ?? 'bg-gray-100 text-gray-500 ring-gray-200'
  const badgeLabel = statusInfo?.label ?? effStatus

  const installBadge = payment.installment_number && payment.total_installments
    ? `${payment.installment_number}/${payment.total_installments}`
    : null

  return (
    <div className="px-5 py-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
      {/* Desktop */}
      <div className="hidden lg:grid grid-cols-[100px_90px_1fr_1fr_100px_88px_88px] items-center gap-3">
        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{formatDateBR(payment.due_date)}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{formatDateBR(payment.paid_date)}</span>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {payment.client?.name ?? <span className="text-gray-400 italic text-xs">—</span>}
        </p>
        <div className="flex items-center gap-1.5 min-w-0">
          {installBadge && (
            <span className="shrink-0 text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 dark:text-gray-500 rounded px-1.5 py-0.5 tabular-nums">
              {installBadge}
            </span>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{payment.notes || '—'}</p>
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums text-right whitespace-nowrap">
          {formatCurrency(payment.amount)}
        </p>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset w-fit ${badgeStyle}`}>
          {badgeLabel}
        </span>
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          {TYPE_LABELS[payment.payment_type || 'unico'] || '—'}
        </span>
      </div>

      {/* Mobile */}
      <div className="lg:hidden space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {payment.client?.name ?? '—'}
            </p>
            {payment.notes && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{payment.notes}</p>
            )}
          </div>
          <p className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
            {formatCurrency(payment.amount)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${badgeStyle}`}>
            {badgeLabel}
          </span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            Venc: {formatDateBR(payment.due_date)}
          </span>
          {payment.paid_date && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              Pago: {formatDateBR(payment.paid_date)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
