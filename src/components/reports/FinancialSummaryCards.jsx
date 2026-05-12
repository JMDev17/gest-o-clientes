import {
  TrendingUp, Clock, AlertTriangle, Target,
  BarChart3, Percent, Users, CalendarClock,
} from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency.js'

const CARD_DEFS = [
  { key: 'totalReceived',  label: 'Recebido',        icon: TrendingUp,    color: 'emerald' },
  { key: 'totalPending',   label: 'Pendente',         icon: Clock,         color: 'amber'   },
  { key: 'totalOverdue',   label: 'Atrasado',         icon: AlertTriangle, color: 'red'     },
  { key: 'totalForecast',  label: 'Previsão do mês',  icon: Target,        color: 'blue'    },
  { key: 'avgTicket',      label: 'Ticket médio',     icon: BarChart3,     color: 'violet'  },
  { key: 'defaultRate',    label: 'Inadimplência',    icon: Percent,       color: 'red'     },
  { key: 'payingClients',  label: 'Clientes pagantes',icon: Users,         color: 'emerald' },
  { key: 'dueNext7Days',   label: 'Vence em 7 dias',  icon: CalendarClock, color: 'amber'   },
]

const COLORS = {
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', icon: 'text-emerald-600 dark:text-emerald-400' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-900/30',   icon: 'text-amber-600 dark:text-amber-400' },
  red:     { bg: 'bg-red-50 dark:bg-red-900/30',     icon: 'text-red-600 dark:text-red-400' },
  blue:    { bg: 'bg-blue-50 dark:bg-blue-900/30',    icon: 'text-blue-600 dark:text-blue-400' },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-900/30',  icon: 'text-violet-600 dark:text-violet-400' },
}

function formatValue(key, value) {
  if (key === 'defaultRate') return `${value.toFixed(1)}%`
  if (key === 'payingClients' || key === 'dueNext7Days' || key === 'paymentCount') return value
  return formatCurrency(value)
}

export default function FinancialSummaryCards({ metrics, reportsConfig }) {
  if (!metrics) return null

  const cards = CARD_DEFS.map(c => ({
    ...c,
    label: c.key === 'payingClients'
      ? `${reportsConfig?.clientLabel || 'Clientes'} pagantes`
      : c.label,
  }))

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map(({ key, label, icon: Icon, color }) => {
        const c = COLORS[color] ?? COLORS.violet
        const val = metrics[key] ?? 0

        return (
          <div key={key} className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-tight">
                  {label}
                </p>
                <p className="mt-1.5 text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
                  {formatValue(key, val)}
                </p>
              </div>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.bg}`}>
                <Icon size={16} strokeWidth={1.75} className={c.icon} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
