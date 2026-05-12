import { useState } from 'react'
import { X } from 'lucide-react'
import { todayISO } from '../../utils/dateHelpers.js'

function todayStr() {
  return todayISO()
}

export default function ContentQuickLogModal({ prefilledClient, clients, onSubmit, onClose }) {
  const [form, setForm] = useState({
    client_id: prefilledClient?.id ?? '',
    date:      todayStr(),
    photos:    0,
    posts:     0,
    notes:     '',
  })
  const [errors, setErrors]           = useState({})
  const [saving, setSaving]           = useState(false)
  const [submitError, setSubmitError] = useState(null)

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }))
  }

  function clearQtyError() {
    if (errors.qty) setErrors(prev => ({ ...prev, qty: null }))
  }

  function validate() {
    const errs = {}
    if (!form.client_id) errs.client_id = 'Selecione um cliente.'
    if (!form.date)      errs.date      = 'Informe a data.'
    const photos = parseInt(form.photos, 10) || 0
    const posts  = parseInt(form.posts,  10) || 0
    if (photos < 1 && posts < 1) errs.qty = 'Informe ao menos fotos ou postagens (mínimo 1).'
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
        client_id: form.client_id,
        date:      form.date,
        photos:    parseInt(form.photos, 10) || 0,
        posts:     parseInt(form.posts,  10) || 0,
        notes:     form.notes || null,
      })
      onClose()
    } catch (err) {
      console.error('[ContentQuickLogModal] save error:', err)
      setSubmitError('Não foi possível salvar. Tente novamente.')
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full sm:max-w-sm bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Registrar conteúdo</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {prefilledClient ? prefilledClient.name : 'Registre fotos e postagens do dia'}
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
        <form id="quick-log-form" onSubmit={handleSubmit} noValidate className="overflow-y-auto px-6 py-5 space-y-4">
          {submitError && (
            <div role="alert" className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {submitError}
            </div>
          )}

          {!prefilledClient && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Cliente *</label>
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
              {errors.client_id && <p className="mt-1 text-xs text-red-500">{errors.client_id}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Data *</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setField('date', e.target.value)}
              className={cls(errors.date)}
            />
            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Quantidade realizada</p>
            {errors.qty && <p className="mb-2 text-xs text-red-500">{errors.qty}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Fotos</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  step="1"
                  value={form.photos}
                  onChange={e => { setField('photos', e.target.value); clearQtyError() }}
                  className={cls(errors.qty)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Postagens</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  step="1"
                  value={form.posts}
                  onChange={e => { setField('posts', e.target.value); clearQtyError() }}
                  className={cls(errors.qty)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Observações</label>
            <input
              type="text"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Detalhes sobre o conteúdo publicado..."
              className={cls()}
            />
          </div>
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
            form="quick-log-form"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Salvando…' : 'Registrar'}
          </button>
        </div>
      </div>
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
