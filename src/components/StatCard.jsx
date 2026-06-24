const COLOR = {
  violet:  { wrap: 'bg-violet-50 dark:bg-violet-900/30',  icon: 'text-violet-600 dark:text-violet-400' },
  emerald: { wrap: 'bg-emerald-50 dark:bg-emerald-900/30', icon: 'text-emerald-600 dark:text-emerald-400' },
  amber:   { wrap: 'bg-amber-50 dark:bg-amber-900/30',   icon: 'text-amber-600 dark:text-amber-400' },
  blue:    { wrap: 'bg-blue-50 dark:bg-blue-900/30',    icon: 'text-blue-600 dark:text-blue-400' },
  indigo:  { wrap: 'bg-indigo-50 dark:bg-indigo-900/30',  icon: 'text-indigo-600 dark:text-indigo-400' },
  red:     { wrap: 'bg-red-50 dark:bg-red-900/30',     icon: 'text-red-600 dark:text-red-400' },
  sky:     { wrap: 'bg-sky-50 dark:bg-sky-900/30',     icon: 'text-sky-600 dark:text-sky-400' },
  gray:    { wrap: 'bg-gray-100 dark:bg-gray-800',   icon: 'text-gray-500 dark:text-gray-400' },
}

export default function StatCard({ label, title, value, icon: Icon, color = 'gray', subtitle }) {
  const c = COLOR[color] ?? COLOR.gray
  const displayLabel = label || title || '—'

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">
            {displayLabel}
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">
            {value ?? '—'}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c.wrap}`}>
            <Icon size={18} strokeWidth={1.75} className={c.icon} />
          </div>
        )}
      </div>
    </div>
  )
}
