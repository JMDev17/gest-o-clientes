import { Trophy, Clock, AlertTriangle, Users } from 'lucide-react'

const COLOR_MAP = {
  violet:  { bg: 'bg-violet-50 dark:bg-violet-900/30',  icon: 'text-violet-500 dark:text-violet-400',  text: 'text-violet-700 dark:text-violet-400'  },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', icon: 'text-emerald-500 dark:text-emerald-400', text: 'text-emerald-700 dark:text-emerald-400' },
  blue:    { bg: 'bg-blue-50 dark:bg-blue-900/30',    icon: 'text-blue-500 dark:text-blue-400',    text: 'text-blue-700 dark:text-blue-400'    },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-900/30',   icon: 'text-amber-500 dark:text-amber-400',   text: 'text-amber-700 dark:text-amber-400'   },
}

export default function ContentWeeklySummary({ clientsData }) {
  const total    = clientsData.length
  const batida   = clientsData.filter(d => d.status === 'meta_batida').length
  const emDia    = clientsData.filter(d => d.status === 'em_dia').length
  const problema = clientsData.filter(d => d.status === 'atrasado' || d.status === 'pendente').length

  const cards = [
    { label: 'Monitorados', value: total,    icon: Users,         color: 'violet'  },
    { label: 'Meta batida', value: batida,   icon: Trophy,        color: 'emerald' },
    { label: 'Em dia',      value: emDia,    icon: Clock,         color: 'blue'    },
    { label: 'Pendentes',   value: problema, icon: AlertTriangle, color: 'amber'   },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {cards.map(({ label, value, icon: Icon, color }) => {
        const c = COLOR_MAP[color]
        return (
          <div key={label} className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
              <div className={`flex h-6 w-6 items-center justify-center rounded-md ${c.bg}`}>
                <Icon size={12} className={c.icon} strokeWidth={2} />
              </div>
            </div>
            <p className={`text-lg font-bold tabular-nums ${c.text}`}>{value}</p>
          </div>
        )
      })}
    </div>
  )
}
