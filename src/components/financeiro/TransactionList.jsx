import { useState } from 'react'
import { Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, Link2 } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { formatDateBR } from '../../utils/dateHelpers.js'
import { paymentMethodLabel } from '../../utils/financial.js'

function StatusBadge({ status }) {
  const map = {
    paid:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    pending: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  }
  const label = status === 'paid' ? 'Pago' : 'Pendente'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[status] ?? map.pending}`}>
      {label}
    </span>
  )
}

function CategoryDot({ color, name }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color || '#6b7280' }} />
      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{name || '—'}</span>
    </span>
  )
}

export default function TransactionList({
  transactions = [],
  loading = false,
  error = null,
  onEdit,
  onDelete,
  emptyMessage = 'Nenhuma transação encontrada.',
}) {
  const [deleting, setDeleting] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  async function handleDelete(id) {
    setDeleting(id)
    try {
      await onDelete(id)
    } finally {
      setDeleting(null)
      setConfirmId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 animate-pulse">
            <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
        {error}
      </div>
    )
  }

  if (!transactions.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 py-12 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Data</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Descrição</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Categoria</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Pagamento</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Valor</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatDateBR(tx.date)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {tx.type === 'income'
                      ? <ArrowUpCircle size={14} className="shrink-0 text-emerald-500" />
                      : <ArrowDownCircle size={14} className="shrink-0 text-red-400" />
                    }
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                        {tx.description}
                      </p>
                      {tx.transfer_group_id && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-brand-500 dark:text-brand-400">
                          <Link2 size={10} /> pró-labore
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <CategoryDot color={tx.category?.color} name={tx.category_name} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                  {paymentMethodLabel(tx.payment_method)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-semibold tabular-nums text-sm ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={tx.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && !tx.transfer_group_id && (
                      <button
                        onClick={() => onEdit(tx)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                    {onDelete && (
                      confirmId === tx.id
                        ? (
                          <span className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(tx.id)}
                              disabled={deleting === tx.id}
                              className="text-[10px] font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                            >
                              {deleting === tx.id ? '…' : 'Confirmar'}
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="text-[10px] text-gray-400 hover:text-gray-600"
                            >
                              Cancelar
                            </button>
                          </span>
                        )
                        : (
                          <button
                            onClick={() => setConfirmId(tx.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={13} />
                          </button>
                        )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
        {transactions.map(tx => (
          <div key={tx.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {tx.type === 'income'
                  ? <ArrowUpCircle size={16} className="shrink-0 text-emerald-500" />
                  : <ArrowDownCircle size={16} className="shrink-0 text-red-400" />
                }
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{tx.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatDateBR(tx.date)}</span>
                    {tx.category_name && (
                      <CategoryDot color={tx.category?.color} name={tx.category_name} />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`font-semibold tabular-nums text-sm ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
                <StatusBadge status={tx.status} />
              </div>
            </div>
            {(onEdit || onDelete) && (
              <div className="flex items-center gap-2 mt-2">
                {onEdit && !tx.transfer_group_id && (
                  <button
                    onClick={() => onEdit(tx)}
                    className="text-xs text-gray-400 hover:text-brand-600 transition-colors"
                  >
                    Editar
                  </button>
                )}
                {onDelete && (
                  confirmId === tx.id
                    ? (
                      <span className="flex items-center gap-2">
                        <button onClick={() => handleDelete(tx.id)} className="text-xs font-semibold text-red-600">Confirmar</button>
                        <button onClick={() => setConfirmId(null)} className="text-xs text-gray-400">Cancelar</button>
                      </span>
                    )
                    : (
                      <button onClick={() => setConfirmId(tx.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                        Excluir
                      </button>
                    )
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
