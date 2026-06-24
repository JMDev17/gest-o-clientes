import { useState } from 'react'
import { X, Pencil, Trash2 } from 'lucide-react'
import { EVENT_CONFIG } from '../../hooks/useCalendarEvents.js'
import { APPOINTMENT_STATUS } from '../../hooks/useAppointments.js'
import { formatDateBR } from '../../utils/dateHelpers.js'

const QUICK_ACTIONS = [
  { status: 'confirmado', label: 'Confirmar',  style: 'bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-200' },
  { status: 'realizado',  label: 'Realizado',  style: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200' },
  { status: 'faltou',     label: 'Faltou',     style: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' },
  { status: 'cancelado',  label: 'Cancelar',   style: 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200' },
]

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function Row({ label, children }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-0.5 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-900 dark:text-gray-100">{children}</p>
    </div>
  )
}

export default function EventDetailsModal({ event, workspaceType, onClose, onEdit, onQuickStatus, onDelete }) {
  const isAppointment = event.type === 'appointment'
  const isPayment     = event.type === 'payment'
  const raw           = event.raw
  const cfgKey = isPayment && event.paymentStatus ? `payment_${event.paymentStatus}` : event.type
  const cfg    = EVENT_CONFIG[cfgKey] ?? EVENT_CONFIG.task

  const statusCfg = isAppointment
    ? APPOINTMENT_STATUS.find(s => s.value === raw.status)
    : null

  const [actionLoading, setActionLoading] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]           = useState(false)

  async function handleAction(status) {
    setActionLoading(status)
    try { await onQuickStatus(raw, status) }
    catch (err) { console.error('[EventDetailsModal] action:', err) }
    finally { setActionLoading(null) }
  }

  async function handleDelete() {
    setDeleting(true)
    try { await onDelete(raw.id) }
    catch (err) { console.error('[EventDetailsModal] delete:', err); setDeleting(false) }
  }

  const date    = isAppointment ? raw.appointment_date : event.date
  const timeStr = isAppointment && (raw.start_time || raw.end_time)
    ? [raw.start_time, raw.end_time].filter(Boolean).map(t => t.slice(0, 5)).join(' – ')
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full sm:max-w-md bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl flex flex-col max-h-[95dvh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0 gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-2 mb-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.chipStyle}`}>
                {cfg.label}
              </span>
              {statusCfg && (
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${statusCfg.style}`}>
                  {statusCfg.label}
                </span>
              )}
            </div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Fechar"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-4 space-y-3">
          {event.clientName && <Row label="Cliente">{event.clientName}</Row>}
          {isPayment ? (
            <>
              <Row label={event.paymentStatus === 'pago' ? 'Pago em' : 'Vencimento'}>
                {formatDateBR(date)}
              </Row>
              {event.paymentStatus === 'pago' && raw.paid_date && raw.paid_date !== raw.due_date && (
                <Row label="Vencimento original">{formatDateBR(raw.due_date)}</Row>
              )}
            </>
          ) : (
            <Row label="Data">{formatDate(date)}</Row>
          )}
          {timeStr                   && <Row label="Horário">{timeStr}</Row>}
          {isAppointment && raw.service?.name  && <Row label="Serviço">{raw.service.name}</Row>}
          {isAppointment && raw.description    && <Row label="Descrição">{raw.description}</Row>}
          {raw.notes                 && <Row label="Observações">{raw.notes}</Row>}
        </div>

        {/* Quick actions — appointments only in estetica */}
        {isAppointment && workspaceType === 'estetica' && (
          <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 space-y-2 shrink-0">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Ação rápida</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS
                .filter(a => a.status !== raw.status)
                .map(action => (
                  <button
                    key={action.status}
                    onClick={() => handleAction(action.status)}
                    disabled={actionLoading !== null}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${action.style}`}
                  >
                    {actionLoading === action.status ? '…' : action.label}
                  </button>
                ))
              }
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            {isAppointment && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">Excluir?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded px-2.5 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 disabled:opacity-50 transition-colors"
                  >
                    {deleting ? '…' : 'Sim'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="rounded px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
                  title="Excluir agendamento"
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Fechar
            </button>
            {isAppointment && (
              <button
                onClick={() => onEdit(raw)}
                className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
              >
                <Pencil size={13} strokeWidth={2} />
                Editar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
