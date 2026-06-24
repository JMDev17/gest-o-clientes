import { useState } from 'react'
import { X, Pencil, Trash2 } from 'lucide-react'
import { groupLogsByDay } from '../../utils/contentTracking.js'

const TYPE_LABEL = { photo: 'Foto', post: 'Postagem' }
const TYPE_STYLE  = {
  photo: 'bg-violet-50 text-violet-700 ring-violet-200',
  post:  'bg-blue-50 text-blue-700 ring-blue-200',
}

export default function ContentHistoryModal({ client, clientLogs, weekBounds, updateLog, deleteLog, onClose }) {
  const days = groupLogsByDay(clientLogs, weekBounds)

  const [editingId,  setEditingId]  = useState(null)
  const [editForm,   setEditForm]   = useState({})
  const [savingId,   setSavingId]   = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmId,  setConfirmId]  = useState(null)

  function startEdit(log) {
    setEditingId(log.id)
    setEditForm({ quantity: log.quantity, performed_at: log.performed_at, notes: log.notes ?? '' })
  }

  function cancelEdit() { setEditingId(null); setEditForm({}) }

  async function handleSave(logId) {
    setSavingId(logId)
    try {
      await updateLog(logId, {
        quantity:     Math.max(1, parseInt(editForm.quantity, 10) || 1),
        performed_at: editForm.performed_at,
        notes:        editForm.notes || null,
      })
      setEditingId(null)
    } catch (err) {
      console.error('[ContentHistoryModal] save error:', err)
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete(id) {
    setDeletingId(id)
    try {
      await deleteLog(id)
    } catch (err) {
      console.error('[ContentHistoryModal] delete error:', err)
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  const activeDays = days.filter(d => d.logs.length > 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full sm:max-w-lg bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Histórico da semana</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{client?.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Fechar"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-4 space-y-5">
          {activeDays.length === 0 ? (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-10">Nenhum registro nesta semana.</p>
          ) : (
            activeDays.map(day => (
              <div key={day.dateStr}>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  {day.dayName}, {day.dateStr.split('-').reverse().join('/')}
                </p>
                <div className="space-y-2">
                  {day.logs.map(log =>
                    editingId === log.id ? (
                      <EditRow
                        key={log.id}
                        form={editForm}
                        setForm={setEditForm}
                        onSave={() => handleSave(log.id)}
                        onCancel={cancelEdit}
                        saving={savingId === log.id}
                      />
                    ) : (
                      <LogRow
                        key={log.id}
                        log={log}
                        isConfirming={confirmId === log.id}
                        isDeleting={deletingId === log.id}
                        onEdit={() => startEdit(log)}
                        onDelete={() => handleDelete(log.id)}
                        onConfirmRequest={() => setConfirmId(log.id)}
                        onCancelConfirm={() => setConfirmId(null)}
                      />
                    )
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

function LogRow({ log, isConfirming, isDeleting, onEdit, onDelete, onConfirmRequest, onCancelConfirm }) {
  const typeStyle = TYPE_STYLE[log.content_type] ?? 'bg-gray-100 text-gray-500 ring-gray-200'
  const typeLabel = TYPE_LABEL[log.content_type] ?? log.content_type

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 dark:border-gray-700 px-3 py-2 bg-gray-50/50 dark:bg-gray-800/50">
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${typeStyle}`}>
        {typeLabel}
      </span>
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums w-6 shrink-0">{log.quantity}×</span>
      <span className="flex-1 min-w-0 text-xs text-gray-400 dark:text-gray-500 truncate">{log.notes || '—'}</span>
      {isConfirming ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-red-600 dark:text-red-400 font-medium">Excluir?</span>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="rounded px-2 py-0.5 text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 disabled:opacity-50 transition-colors"
          >
            {isDeleting ? '…' : 'Sim'}
          </button>
          <button
            onClick={onCancelConfirm}
            className="rounded px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Não
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            title="Editar"
          >
            <Pencil size={12} strokeWidth={2} />
          </button>
          <button
            onClick={onConfirmRequest}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
            title="Excluir"
          >
            <Trash2 size={12} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  )
}

function EditRow({ form, setForm, onSave, onCancel, saving }) {
  return (
    <div className="rounded-lg border border-brand-200 dark:border-brand-700/50 bg-brand-50/30 dark:bg-brand-900/10 px-3 py-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quantidade</label>
          <input
            type="number"
            min="1"
            max="99"
            value={form.quantity}
            onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Data</label>
          <input
            type="date"
            value={form.performed_at}
            onChange={e => setForm(prev => ({ ...prev, performed_at: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Observações</label>
        <input
          type="text"
          value={form.notes}
          onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Detalhes..."
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}
