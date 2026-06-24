import { useState } from 'react'
import { X } from 'lucide-react'
import { CONTENT_TYPES } from '../../utils/contentTracking.js'
import { todayISO } from '../../utils/dateHelpers.js'

function todayStr() {
  return todayISO()
}

const EMPTY = {
  client_id:    '',
  content_type: 'photo',
  quantity:     1,
  performed_at: todayStr(),
  notes:        '',
}

function pickEditable(log) {
  return {
    client_id:    log.client_id    ?? '',
    content_type: log.content_type ?? 'photo',
    quantity:     log.quantity     ?? 1,
    performed_at: log.performed_at ?? todayStr(),
    notes:        log.notes        ?? '',
  }
}

export default function ContentLogModal({ initialData, prefilledClientId, clients, onSubmit, onClose }) {
  const isEditing = Boolean(initialData)

  const [form, setForm]               = useState(() =>
    isEditing ? pickEditable(initialData) : { ...EMPTY, client_id: prefilledClientId ?? '' }
  )
  const [errors, setErrors]           = useState({})
  const [saving, setSaving]           = useState(false)
  const [submitError, setSubmitError] = useState(null)

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }))
  }

  function validate() {
    const errs = {}
    if (!form.client_id)    errs.client_id    = 'Selecione um cliente.'
    if (!form.content_type) errs.content_type = 'Selecione o tipo.'
    const qty = parseInt(form.quantity, 10)
    if (!form.quantity || isNaN(qty) || qty < 1) errs.quantity = 'Mínimo 1.'
    if (!form.performed_at) errs.performed_at = 'Informe a data.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    setSubmitError(null)
    try {
      await onSubmit({
        client_id:    form.client_id,
        content_type: form.content_type,
        quantity:     parseInt(form.quantity, 10),
        performed_at: form.performed_at,
        notes:        form.notes || null,
      })
      onClose()
    } catch (err) {
      console.error('[ContentLogModal] save error:', err)
      setSubmitError('Não foi possível salvar. Tente novamente.')
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full sm:max-w-md bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Editar registro' : 'Registrar conteúdo'}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {isEditing ? 'Atualize as informações abaixo' : 'Registre uma ação de conteúdo realizada'}
            </p>
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
        <form
          id="log-form"
          onSubmit={handleSubmit}
          noValidate
          className="overflow-y-auto px-6 py-5 space-y-4"
        >
          {submitError && (
            <div role="alert" className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {submitError}
            </div>
          )}

          <Field label="Cliente *" error={errors.client_id}>
            <select
              value={form.client_id}
              onChange={e => setField('client_id', e.target.value)}
              className={cls(errors.client_id)}
            >
              <option value="">— Selecione —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Tipo de conteúdo *" error={errors.content_type}>
            <select
              value={form.content_type}
              onChange={e => setField('content_type', e.target.value)}
              className={cls(errors.content_type)}
            >
              {CONTENT_TYPES.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantidade *" error={errors.quantity}>
              <input
                type="number"
                min="1"
                max="99"
                step="1"
                value={form.quantity}
                onChange={e => setField('quantity', e.target.value)}
                className={cls(errors.quantity)}
              />
            </Field>
            <Field label="Data *" error={errors.performed_at}>
              <input
                type="date"
                value={form.performed_at}
                onChange={e => setField('performed_at', e.target.value)}
                className={cls(errors.performed_at)}
              />
            </Field>
          </div>

          <Field label="Observações">
            <input
              type="text"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Detalhes sobre o conteúdo publicado..."
              className={cls()}
            />
          </Field>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="log-form"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Salvando…' : isEditing ? 'Salvar' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function cls(error) {
  return [
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900',
    'placeholder-gray-300',
    'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors',
    'dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-600',
    error ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700',
  ].join(' ')
}
