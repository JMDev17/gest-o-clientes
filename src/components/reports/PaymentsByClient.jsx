import { useState, useMemo } from 'react'
import { ChevronRight, ArrowLeft, TrendingUp, Clock, AlertTriangle, Wallet } from 'lucide-react'
import { PAYMENT_STATUS, effectiveStatus } from '../../hooks/usePayments.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { formatDateBR } from '../../utils/dateHelpers.js'
import { computeClientHistory } from '../../utils/financialReports.js'

export default function PaymentsByClient({ allPayments, filteredPayments, reportsConfig }) {
  const clientLabel = reportsConfig?.clientLabel || 'Cliente'
  const [selectedClientId, setSelectedClientId] = useState(null)

  // Build list of clients with activity in the filtered set
  const clientList = useMemo(() => {
    const map = new Map()
    for (const p of filteredPayments) {
      if (!p.client_id || !p.client?.name) continue
      if (!map.has(p.client_id)) {
        map.set(p.client_id, {
          id: p.client_id,
          name: p.client.name,
          total: 0,
          paid: 0,
          count: 0,
        })
      }
      const entry = map.get(p.client_id)
      entry.total += Number(p.amount)
      entry.count += 1
      if (effectiveStatus(p) === 'pago') entry.paid += Number(p.amount)
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [filteredPayments])

  // Full history when a client is selected (across ALL payments, not filtered)
  const history = useMemo(() => {
    if (!selectedClientId) return null
    return computeClientHistory(allPayments, selectedClientId)
  }, [allPayments, selectedClientId])

  const selectedClient = clientList.find(c => c.id === selectedClientId)

  if (selectedClientId && history) {
    return (
      <ClientDetail
        client={selectedClient}
        history={history}
        onBack={() => setSelectedClientId(null)}
        clientLabel={clientLabel}
      />
    )
  }

  // Client list view
  if (clientList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="font-semibold text-gray-700 dark:text-gray-300">Nenhum {clientLabel.toLowerCase()} com pagamentos</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente ajustar os filtros.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {clientList.length} {clientLabel.toLowerCase()}{clientList.length !== 1 ? 's' : ''} com pagamentos
        </p>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {clientList.map(c => {
          const paidPct = c.total > 0 ? (c.paid / c.total) * 100 : 0
          return (
            <button
              key={c.id}
              onClick={() => setSelectedClientId(c.id)}
              className="flex items-center justify-between gap-4 w-full px-5 py-4 text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {c.count} pagamento{c.count !== 1 ? 's' : ''} · {formatCurrency(c.total)}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {/* Mini progress bar */}
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(paidPct, 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums w-10 text-right">
                    {paidPct.toFixed(0)}%
                  </span>
                </div>
                <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Client Detail Panel ─────────────────────────────────────────────────────

function ClientDetail({ client, history, onBack, clientLabel }) {
  const cards = [
    { label: 'Total contratado', value: formatCurrency(history.totalContracted), icon: Wallet,        color: 'blue' },
    { label: 'Total pago',       value: formatCurrency(history.totalPaid),       icon: TrendingUp,    color: 'emerald' },
    { label: 'Total pendente',   value: formatCurrency(history.totalPending),    icon: Clock,         color: 'amber' },
    { label: 'Total atrasado',   value: formatCurrency(history.totalOverdue),    icon: AlertTriangle, color: 'red' },
  ]

  const COLORS = {
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400' },
    amber:   { bg: 'bg-amber-50 dark:bg-amber-900/20',     icon: 'text-amber-600 dark:text-amber-400' },
    red:     { bg: 'bg-red-50 dark:bg-red-900/20',         icon: 'text-red-600 dark:text-red-400' },
    blue:    { bg: 'bg-blue-50 dark:bg-blue-900/20',       icon: 'text-blue-600 dark:text-blue-400' },
  }

  return (
    <div className="space-y-5">
      {/* Back button + client name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={2} />
        </button>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{client?.name || clientLabel}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {history.count} pagamento{history.count !== 1 ? 's' : ''} no histórico
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ label, value, icon: Icon, color }) => {
          const c = COLORS[color]
          return (
            <div key={label} className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-tight">{label}</p>
                  <p className="mt-1.5 text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{value}</p>
                </div>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.bg}`}>
                  <Icon size={16} strokeWidth={1.75} className={c.icon} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Last payment / Next due */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Último pagamento</p>
          {history.lastPaid ? (
            <>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(history.lastPaid.amount)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                em {formatDateBR(history.lastPaid.paid_date || history.lastPaid.due_date)}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum pagamento registrado</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Próximo vencimento</p>
          {history.nextDue ? (
            <>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(history.nextDue.amount)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                vence em {formatDateBR(history.nextDue.due_date)}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum vencimento pendente</p>
          )}
        </div>
      </div>

      {/* Full payment history */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Histórico cronológico
          </p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {history.payments.map(p => {
            const effStatus  = effectiveStatus(p)
            const statusInfo = PAYMENT_STATUS.find(s => s.value === effStatus)
            const badgeStyle = statusInfo?.style ?? 'bg-gray-100 text-gray-500 ring-gray-200'
            const badgeLabel = statusInfo?.label ?? effStatus

            return (
              <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums shrink-0 w-[72px]">
                    {formatDateBR(p.due_date)}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{p.notes || '—'}</p>
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
    </div>
  )
}
