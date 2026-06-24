import { EVENT_CONFIG } from '../../hooks/useCalendarEvents.js'

export default function CalendarEventCard({ event, compact, onClick }) {
  const cfgKey = event.type === 'payment' && event.paymentStatus ? `payment_${event.paymentStatus}` : event.type
  const cfg = EVENT_CONFIG[cfgKey] ?? EVENT_CONFIG.task

  if (compact) {
    return (
      <button
        onClick={onClick}
        title={event.title + (event.clientName ? ` — ${event.clientName}` : '')}
        className={`w-full text-left rounded px-1.5 py-0.5 text-[10px] font-medium truncate leading-4 ${cfg.chipStyle} hover:opacity-80 transition-opacity`}
      >
        {event.title}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-2.5 rounded-lg px-3 py-2 ${cfg.chipStyle} hover:opacity-80 transition-opacity`}
    >
      <span className={`h-2 w-2 rounded-full shrink-0 ${cfg.dotColor}`} />
      <span className="flex-1 min-w-0">
        <span className="text-xs font-medium truncate block">{event.title}</span>
        {event.clientName && (
          <span className="text-[11px] opacity-70 truncate block">{event.clientName}</span>
        )}
      </span>
      <span className="text-[10px] opacity-50 shrink-0 capitalize">{cfg.label}</span>
    </button>
  )
}
