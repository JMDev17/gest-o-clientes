import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

export default function CalendarToolbar({ view, onViewChange, periodLabel, onPrev, onNext, onToday, showNewAppt, onNewAppt }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <button
          onClick={onToday}
          className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Hoje
        </button>
        <button
          onClick={onNext}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          aria-label="Próximo"
        >
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Period label */}
      <p className="flex-1 text-sm font-semibold text-gray-900 dark:text-white capitalize">{periodLabel}</p>

      {/* View toggle */}
      <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 gap-0.5">
        {[
          { value: 'month', label: 'Mês' },
          { value: 'week',  label: 'Semana' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onViewChange(value)}
            className={[
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              view === value
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* New appointment (estetica only) */}
      {showNewAppt && (
        <button
          onClick={onNewAppt}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          Novo agendamento
        </button>
      )}
    </div>
  )
}
