import { Plus, AlertCircle, Pencil, Trash2, MessageCircle } from 'lucide-react'
import { useWorkspace } from '../../hooks/useWorkspace.js'
import { PAYMENT_STATUS, effectiveStatus } from '../../hooks/usePayments.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { formatDate } from '../../utils/formatDate.js'

export default function PaymentList({
  payments,
  loading,
  error,
  hasActiveFilters,
  onEdit,
  onDelete,
  onWhatsapp,
  onNew,
}) {
  const { workspace } = useWorkspace()
  const p = workspace.payments

  if (loading) {
    return (
      <div className="flex justify-center py-24">
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
    return hasActiveFilters ? (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-semibold text-gray-700 dark:text-gray-300">Nenhum resultado encontrado</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente ajustar os filtros.</p>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <Plus size={22} strokeWidth={1.5} className="text-gray-400 dark:text-gray-500" />
        </div>
        <p className="font-semibold text-gray-700 dark:text-gray-300">Nenhum pagamento cadastrado</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-6">Comece registrando um pagamento.</p>
        <button
          onClick={onNew}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          Novo pagamento
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header — desktop only */}
      <div className="hidden sm:grid grid-cols-[1fr_1fr_116px_106px_96px_96px] gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        <span>{p.clientLabel}</span>
        <span>{p.descriptionLabel}</span>
        <span className="text-right">{p.amountLabel}</span>
        <span>{p.dueDateLabel}</span>
        <span>Status</span>
        <span />
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {payments.map(payment => (
          <PaymentRow
            key={payment.id}
            payment={payment}
            onEdit={onEdit}
            onDelete={onDelete}
            onWhatsapp={onWhatsapp}
          />
        ))}
      </div>
    </div>
  )
}

function PaymentRow({ payment, onEdit, onDelete, onWhatsapp }) {
  const effStatus  = effectiveStatus(payment)
  const statusInfo = PAYMENT_STATUS.find(s => s.value === effStatus)
  const badgeStyle = statusInfo?.style ?? 'bg-gray-100 text-gray-500 ring-gray-200'
  const badgeLabel = statusInfo?.label ?? effStatus

  const clientName   = payment.client?.name
  const installBadge = payment.installment_number && payment.total_installments
    ? `${payment.installment_number}/${payment.total_installments}`
    : null

  const showWhatsapp = onWhatsapp && (effStatus === 'pendente' || effStatus === 'atrasado')

  return (
    <div className="px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
      {/* Desktop */}
      <div className="hidden sm:grid grid-cols-[1fr_1fr_116px_106px_96px_96px] items-center gap-4">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {clientName ?? <span className="text-gray-400 italic text-xs">Sem cliente</span>}
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
        <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(payment.due_date)}</p>
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${badgeStyle}`}>
          {badgeLabel}
        </span>
        <div className="flex items-center justify-end gap-1">
          {showWhatsapp && (
            <WhatsappBtn
              onClick={() => onWhatsapp(payment)}
              overdue={effStatus === 'atrasado'}
            />
          )}
          <ActionBtn onClick={() => onEdit(payment)}   icon={Pencil}  label="Editar"  />
          <ActionBtn onClick={() => onDelete(payment)} icon={Trash2}  label="Excluir" danger />
        </div>
      </div>

      {/* Mobile */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {clientName ?? <span className="text-gray-400 italic text-xs">Sem cliente</span>}
            </p>
            {payment.notes && (
              <div className="flex items-center gap-1 mt-0.5">
                {installBadge && (
                  <span className="shrink-0 text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 dark:text-gray-500 rounded px-1 py-0.5 tabular-nums">
                    {installBadge}
                  </span>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{payment.notes}</p>
              </div>
            )}
          </div>
          <p className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
            {formatCurrency(payment.amount)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${badgeStyle}`}>
              {badgeLabel}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(payment.due_date)}</span>
          </div>
          <div className="flex items-center gap-1">
            {showWhatsapp && (
              <WhatsappBtn
                onClick={() => onWhatsapp(payment)}
                overdue={effStatus === 'atrasado'}
              />
            )}
            <ActionBtn onClick={() => onEdit(payment)}   icon={Pencil}  label="Editar"  />
            <ActionBtn onClick={() => onDelete(payment)} icon={Trash2}  label="Excluir" danger />
          </div>
        </div>
      </div>
    </div>
  )
}

function WhatsappBtn({ onClick, overdue }) {
  return (
    <button
      onClick={onClick}
      title={overdue ? 'Cobrar via WhatsApp (Atrasado)' : 'Enviar cobrança via WhatsApp'}
      className={[
        'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
        overdue
          ? 'text-orange-500 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/30'
          : 'text-green-500 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/30',
      ].join(' ')}
    >
      <MessageCircle size={13} strokeWidth={2} />
    </button>
  )
}

function ActionBtn({ onClick, icon: Icon, label, danger = false }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={[
        'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
        danger
          ? 'text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30'
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200',
      ].join(' ')}
    >
      <Icon size={13} strokeWidth={2} />
    </button>
  )
}
