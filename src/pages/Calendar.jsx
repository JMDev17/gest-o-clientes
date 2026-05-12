import { useState, useMemo } from 'react'
import Layout from '../components/Layout.jsx'
import CalendarToolbar from '../components/calendar/CalendarToolbar.jsx'
import CalendarFilters from '../components/calendar/CalendarFilters.jsx'
import CalendarEventCard from '../components/calendar/CalendarEventCard.jsx'
import EventDetailsModal from '../components/calendar/EventDetailsModal.jsx'
import AppointmentFormModal from '../components/calendar/AppointmentFormModal.jsx'
import { useCalendarEvents } from '../hooks/useCalendarEvents.js'
import { useAppointments } from '../hooks/useAppointments.js'
import { useClients } from '../hooks/useClients.js'
import { useContracts } from '../hooks/useContracts.js'
import { useServiceCatalog } from '../hooks/useServiceCatalog.js'
import { useWorkspace } from '../hooks/useWorkspace.js'

// ── helpers ───────────────────────────────────────────────────────────────────

const WEEK_DAYS     = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEK_DAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildMonthCells(year, month) {
  const firstDay    = new Date(year, month, 1)
  const lastDay     = new Date(year, month + 1, 0)
  const startDow    = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const cells       = []

  for (let i = 0; i < startDow; i++) {
    cells.push({ dateStr: toDateStr(new Date(year, month, 1 - startDow + i)), inMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ dateStr: toDateStr(new Date(year, month, d)), inMonth: true })
  }
  while (cells.length < 42) {
    const d = cells.length - daysInMonth - startDow + 1
    cells.push({ dateStr: toDateStr(new Date(year, month + 1, d)), inMonth: false })
  }
  return cells
}

function buildWeekCells(viewDate) {
  const start = new Date(viewDate)
  start.setDate(viewDate.getDate() - viewDate.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return { dateStr: toDateStr(d), dayName: WEEK_DAYS[d.getDay()] }
  })
}

function formatPeriodMonth(year, month) {
  return new Date(year, month, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function formatPeriodWeek(cells) {
  const [, fm, fd] = cells[0].dateStr.split('-')
  const [ly, lm, ld] = cells[6].dateStr.split('-')
  return `${fd}/${fm} – ${ld}/${lm}/${ly}`
}

// ── main component ────────────────────────────────────────────────────────────

export default function Calendar() {
  const { workspace, workspaceType } = useWorkspace()
  const { clients }  = useClients()
  const { contracts } = useContracts()
  const { services } = useServiceCatalog()
  const { createAppointment, updateAppointment, deleteAppointment, updateStatus, markAsRealizado } = useAppointments()

  const [view, setView]               = useState('month')
  const [viewDate, setViewDate]       = useState(() => new Date())
  const [typeFilters, setTypeFilters] = useState(
    () => new Set(['appointment', 'task', 'payment', 'contract'])
  )
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [apptModal, setApptModal]         = useState({ open: false, data: null, prefilledDate: null })

  const todayStr = toDateStr(new Date())

  const { startDate, endDate, year, month } = useMemo(() => {
    const y = viewDate.getFullYear()
    const m = viewDate.getMonth()
    if (view === 'month') {
      const startDow = new Date(y, m, 1).getDay()
      const start    = new Date(y, m, 1 - startDow)
      const end      = new Date(start)
      end.setDate(start.getDate() + 41)
      return { startDate: toDateStr(start), endDate: toDateStr(end), year: y, month: m }
    }
    const cells = buildWeekCells(viewDate)
    return { startDate: cells[0].dateStr, endDate: cells[6].dateStr, year: y, month: m }
  }, [view, viewDate])

  const { events, loading, reload: reloadEvents } = useCalendarEvents({ startDate, endDate, workspaceType })

  const filteredEvents = useMemo(
    () => events.filter(e => typeFilters.has(e.type)),
    [events, typeFilters]
  )

  const eventsByDate = useMemo(() => {
    const map = new Map()
    for (const ev of filteredEvents) {
      if (!map.has(ev.date)) map.set(ev.date, [])
      map.get(ev.date).push(ev)
    }
    return map
  }, [filteredEvents])

  // ── navigation ──────────────────────────────────────────────────────────────

  function navigate(delta) {
    setViewDate(prev => {
      const d = new Date(prev)
      if (view === 'month') d.setMonth(d.getMonth() + delta)
      else                  d.setDate(d.getDate() + delta * 7)
      return d
    })
  }

  function goToday() { setViewDate(new Date()) }

  function toggleFilter(type) {
    setTypeFilters(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  // ── appointment handlers ─────────────────────────────────────────────────────

  function openNewAppt(prefilledDate = null) {
    setApptModal({ open: true, data: null, prefilledDate })
  }

  function openEditAppt(raw) {
    setSelectedEvent(null)
    setApptModal({ open: true, data: raw, prefilledDate: null })
  }

  function closeApptModal() {
    setApptModal({ open: false, data: null, prefilledDate: null })
  }

  async function handleApptSubmit(fields) {
    if (apptModal.data) {
      await updateAppointment(apptModal.data.id, fields)
    } else {
      await createAppointment(fields)
    }
    closeApptModal()
    reloadEvents()
  }

  async function handleQuickStatus(raw, status) {
    if (status === 'realizado') {
      await markAsRealizado(raw)
    } else {
      await updateStatus(raw.id, status)
    }
    setSelectedEvent(null)
    reloadEvents()
  }

  async function handleDeleteAppt(id) {
    await deleteAppointment(id)
    setSelectedEvent(null)
    reloadEvents()
  }

  // ── derived ──────────────────────────────────────────────────────────────────

  const isEstetica    = workspaceType === 'estetica'
  const monthCells    = view === 'month' ? buildMonthCells(year, month) : null
  const weekCells     = view === 'week'  ? buildWeekCells(viewDate)     : null
  const periodLabel   = view === 'month'
    ? formatPeriodMonth(year, month)
    : formatPeriodWeek(weekCells)

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <Layout title={workspace.pages.calendar.title}>

      <CalendarToolbar
        view={view}
        onViewChange={setView}
        periodLabel={periodLabel}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onToday={goToday}
        showNewAppt={isEstetica}
        onNewAppt={() => openNewAppt()}
      />

      <div className="mt-4 mb-5">
        <CalendarFilters
          typeFilters={typeFilters}
          onToggle={toggleFilter}
          workspaceType={workspaceType}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Mobile: always use list/agenda view */}
          <div className="sm:hidden">
            <AgendaView
              cells={view === 'month' ? monthCells.filter(c => c.inMonth) : weekCells}
              todayStr={todayStr}
              eventsByDate={eventsByDate}
              onEventClick={setSelectedEvent}
              onDayClick={isEstetica ? openNewAppt : null}
            />
          </div>

          {/* Desktop: month or week grid */}
          <div className="hidden sm:block">
            {view === 'month' ? (
              <MonthGrid
                cells={monthCells}
                todayStr={todayStr}
                eventsByDate={eventsByDate}
                onEventClick={setSelectedEvent}
                onDayClick={isEstetica ? openNewAppt : null}
              />
            ) : (
              <WeekView
                cells={weekCells}
                todayStr={todayStr}
                eventsByDate={eventsByDate}
                onEventClick={setSelectedEvent}
                onDayClick={isEstetica ? openNewAppt : null}
              />
            )}
          </div>
        </>
      )}

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          workspaceType={workspaceType}
          onClose={() => setSelectedEvent(null)}
          onEdit={openEditAppt}
          onQuickStatus={handleQuickStatus}
          onDelete={handleDeleteAppt}
        />
      )}

      {apptModal.open && (
        <AppointmentFormModal
          initialData={apptModal.data}
          prefilledDate={apptModal.prefilledDate}
          clients={clients}
          services={services}
          contracts={contracts}
          onSubmit={handleApptSubmit}
          onClose={closeApptModal}
        />
      )}

    </Layout>
  )
}

// ── AgendaView (mobile) ───────────────────────────────────────────────────────

function AgendaView({ cells, todayStr, eventsByDate, onEventClick, onDayClick }) {
  const daysWithEvents = cells.filter(({ dateStr }) => (eventsByDate.get(dateStr) ?? []).length > 0)

  if (daysWithEvents.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
        Nenhum evento neste período.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {daysWithEvents.map(({ dateStr, dayName }) => {
        const dayEvents = eventsByDate.get(dateStr) ?? []
        const isToday   = dateStr === todayStr
        const [y, m, d] = dateStr.split('-')
        const dow       = new Date(dateStr + 'T00:00:00').getDay()

        return (
          <div
            key={dateStr}
            className={[
              'rounded-xl bg-white dark:bg-gray-900 border overflow-hidden',
              isToday ? 'border-brand-200 dark:border-brand-700' : 'border-gray-200 dark:border-gray-800',
            ].join(' ')}
          >
            <div
              className={[
                'flex items-center gap-2 px-4 py-2.5',
                isToday ? 'bg-brand-50 dark:bg-brand-900/30' : 'bg-gray-50/50 dark:bg-gray-800/40',
                onDayClick ? 'cursor-pointer hover:opacity-90' : '',
              ].join(' ')}
              onClick={() => onDayClick?.(dateStr)}
            >
              <span className={`text-sm font-bold tabular-nums ${isToday ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-200'}`}>
                {parseInt(d)}/{m}
              </span>
              <span className={`text-xs font-medium ${isToday ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {WEEK_DAYS_FULL[dow]}
              </span>
              {isToday && (
                <span className="text-[10px] font-semibold text-brand-500 uppercase tracking-wide">Hoje</span>
              )}
            </div>
            <div className="px-4 py-2 space-y-1.5">
              {dayEvents.map(ev => (
                <CalendarEventCard
                  key={ev.id}
                  event={ev}
                  compact={false}
                  onClick={() => onEventClick(ev)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── MonthGrid ─────────────────────────────────────────────────────────────────

function MonthGrid({ cells, todayStr, eventsByDate, onEventClick, onDayClick }) {
  return (
    <div>
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Grid cells */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
        {cells.map(({ dateStr, inMonth }) => {
          const dayEvents = eventsByDate.get(dateStr) ?? []
          const isToday   = dateStr === todayStr
          const day       = parseInt(dateStr.split('-')[2])
          const visible   = dayEvents.slice(0, 3)
          const overflow  = dayEvents.length - 3

          return (
            <div
              key={dateStr}
              className={[
                'bg-white dark:bg-gray-900 min-h-[88px] p-1.5 transition-colors',
                onDayClick ? 'cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/50' : '',
                !inMonth ? 'opacity-40' : '',
              ].join(' ')}
              onClick={() => onDayClick?.(dateStr)}
            >
              <span className={[
                'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold mb-1',
                isToday ? 'bg-brand-600 text-white' : 'text-gray-700 dark:text-gray-300',
              ].join(' ')}>
                {day}
              </span>
              <div className="space-y-0.5">
                {visible.map(ev => (
                  <CalendarEventCard
                    key={ev.id}
                    event={ev}
                    compact
                    onClick={e => { e.stopPropagation(); onEventClick(ev) }}
                  />
                ))}
                {overflow > 0 && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 pl-1">+{overflow} mais</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── WeekView ──────────────────────────────────────────────────────────────────

function WeekView({ cells, todayStr, eventsByDate, onEventClick, onDayClick }) {
  return (
    <div className="space-y-3">
      {cells.map(({ dateStr, dayName }) => {
        const dayEvents = eventsByDate.get(dateStr) ?? []
        const isToday   = dateStr === todayStr
        const [, m, d]  = dateStr.split('-')

        return (
          <div
            key={dateStr}
            className={[
              'rounded-xl bg-white dark:bg-gray-900 border overflow-hidden',
              isToday ? 'border-brand-200 dark:border-brand-700' : 'border-gray-200 dark:border-gray-800',
            ].join(' ')}
          >
            {/* Day header */}
            <div
              className={[
                'flex items-center gap-2 px-4 py-2.5',
                isToday ? 'bg-brand-50 dark:bg-brand-900/30' : 'bg-gray-50/50 dark:bg-gray-800/40',
                onDayClick ? 'cursor-pointer hover:opacity-90' : '',
              ].join(' ')}
              onClick={() => onDayClick?.(dateStr)}
            >
              <span className={`text-sm font-bold tabular-nums ${isToday ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-200'}`}>
                {parseInt(d)}/{m}
              </span>
              <span className={`text-xs font-medium ${isToday ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {dayName}
              </span>
              {isToday && (
                <span className="text-[10px] font-semibold text-brand-500 uppercase tracking-wide">Hoje</span>
              )}
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                {dayEvents.length > 0 ? `${dayEvents.length} evento${dayEvents.length !== 1 ? 's' : ''}` : ''}
              </span>
            </div>

            {/* Events */}
            {dayEvents.length > 0 ? (
              <div className="px-4 py-2 space-y-1.5">
                {dayEvents.map(ev => (
                  <CalendarEventCard
                    key={ev.id}
                    event={ev}
                    compact={false}
                    onClick={() => onEventClick(ev)}
                  />
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-xs text-gray-300 dark:text-gray-600 italic">Sem eventos</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
