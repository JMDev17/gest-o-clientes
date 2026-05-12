import { Clock, AlertTriangle, CalendarDays, CheckCircle2 } from 'lucide-react'
import { effectiveTaskStatus } from '../../hooks/useTasks.js'
import { todayISO } from '../../utils/dateHelpers.js'

function todayKey() {
  return todayISO()
}

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function TaskSummaryCards({ tasks }) {
  const today = todayKey()
  const month = currentMonthKey()

  const pending  = tasks.filter(t => effectiveTaskStatus(t) === 'pendente').length
  const overdue  = tasks.filter(t => effectiveTaskStatus(t) === 'atrasada').length
  const dueToday = tasks.filter(t => {
    const eff = effectiveTaskStatus(t)
    return t.due_date === today && eff !== 'concluida' && eff !== 'cancelada'
  }).length

  const doneThisMonth = tasks.filter(
    t => t.status === 'concluida' && t.updated_at?.startsWith(month)
  ).length

  const cards = [
    {
      label:   'Pendentes',
      value:   pending,
      icon:    Clock,
      iconCls: 'text-amber-600 dark:text-amber-400',
      bgCls:   'bg-amber-50 dark:bg-amber-900/30',
    },
    {
      label:   'Atrasadas',
      value:   overdue,
      icon:    AlertTriangle,
      iconCls: 'text-red-600 dark:text-red-400',
      bgCls:   'bg-red-50 dark:bg-red-900/30',
    },
    {
      label:   'Para hoje',
      value:   dueToday,
      icon:    CalendarDays,
      iconCls: 'text-blue-600 dark:text-blue-400',
      bgCls:   'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      label:   'Concluídas no mês',
      value:   doneThisMonth,
      icon:    CheckCircle2,
      iconCls: 'text-emerald-600 dark:text-emerald-400',
      bgCls:   'bg-emerald-50 dark:bg-emerald-900/30',
    },
  ]

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {cards.map(({ label, value, icon: Icon, iconCls, bgCls }) => (
        <div key={label} className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-tight">
                {label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">{value}</p>
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
