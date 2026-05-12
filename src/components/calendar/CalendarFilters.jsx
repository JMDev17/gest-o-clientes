import { EVENT_CONFIG } from '../../hooks/useCalendarEvents.js'

const MARKETING_TYPES = ['task', 'payment', 'contract']
const ESTETICA_TYPES  = ['appointment', 'task', 'payment', 'contract']

export default function CalendarFilters({ typeFilters, onToggle, workspaceType }) {
  const types = workspaceType === 'estetica' ? ESTETICA_TYPES : MARKETING_TYPES

  return (
    <div className="flex flex-wrap gap-2">
      {types.map(type => {
        const cfg    = EVENT_CONFIG[type]
        const active = typeFilters.has(type)
        return (
          <button
            key={type}
            onClick={() => onToggle(type)}
            className={[
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all',
              active ? `${cfg.chipStyle} ring-1 ring-inset ring-current/20` : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700',
            ].join(' ')}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${active ? cfg.dotColor : 'bg-gray-300 dark:bg-gray-600'}`} />
            {cfg.label}
          </button>
        )
      })}
    </div>
  )
}
