import { TrendingUp, Clock, AlertTriangle, CreditCard } from 'lucide-react'
import { effectiveStatus } from '../../hooks/usePayments.js'
import { formatCurrency } from '../../utils/formatCurrency.js'

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function PaymentSummaryCards({ payments }) {
  const month = currentMonthKey()

  const monthRevenue = payments
    .filter(p => p.status === 'pago' && p.paid_date?.startsWith(month))
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const pending = payments.filter(p => effectiveStatus(p) === 'pendente')
  const overdue = payments.filter(p => effectiveStatus(p) === 'atrasado')

  const pendingTotal = pending.reduce((sum, p) => sum + Number(p.amount), 0)
  const overdueTotal = overdue.reduce((sum, p) => sum + Number(p.amount), 0)

  const cards = [
    {
      label:   'Recebido no mês',
      value:   formatCurrency(monthRevenue),
      icon:    TrendingUp,
      iconCls: 'text-emerald-600 dark:text-emerald-400',
      bgCls:   'bg-emerald-50 dark:bg-emerald-900/30',
    },
    {
      label:   'Pendente',
      value:   formatCurrency(pendingTotal),
      sub:     `${pending.length} pagamento${pending.length !== 1 ? 's' : ''}`,
      icon:    Clock,
      iconCls: 'text-amber-600 dark:text-amber-400',
      bgCls:   'bg-amber-50 dark:bg-amber-900/30',
    },
    {
      label:   'Atrasado',
      value:   formatCurrency(overdueTotal),
      sub:     `${overdue.length} pagamento${overdue.length !== 1 ? 's' : ''}`,
      icon:    AlertTriangle,
      iconCls: 'text-red-600 dark:text-red-400',
      bgCls:   'bg-red-50 dark:bg-red-900/30',
    },
    {
      label:   'Total de pagamentos',
      value:   payments.length,
      icon:    CreditCard,
      iconCls: 'text-brand-600 dark:text-brand-400',
      bgCls:   'bg-brand-50 dark:bg-brand-900/30',
    },
  ]

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {cards.map(({ label, value, sub, icon: Icon, iconCls, bgCls }) => (
        <div key={label} className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-tight">
                {label}
              </p>
              <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white tabular-nums">
                {value}
              </p>
              {sub && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>
              )}
            </div>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bgCls}`}>
              <Icon size={18} strokeWidth={1.75} className={iconCls} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
