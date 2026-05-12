import { formatDateBR } from '../../utils/dateHelpers.js'

export default function RecentActivityWidget({ activities }) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Atividade recente</p>

      {activities.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4">Nenhuma atividade recente.</p>
      )}

      <div className="relative pl-1">
        <div className="absolute top-3 bottom-3 left-[9px] w-px bg-gray-100 dark:bg-gray-800" />
        <ul className="space-y-4">
          {activities.map((act, i) => (
            <li key={`${act.type}-${act.date}-${i}`} className="relative flex gap-4">
              <div className="relative mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 z-10">
                <div className={`h-1.5 w-1.5 rounded-full ${act.type === 'payment' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight mb-0.5">{act.label}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="truncate">{act.detail}</span>
                  <span className="shrink-0 text-gray-300 dark:text-gray-600">•</span>
                  <span className="shrink-0">{formatDateBR(act.date)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
