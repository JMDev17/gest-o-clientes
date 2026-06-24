import { useState } from 'react'
import { X } from 'lucide-react'

const EMPTY = {
  photos_per_week: 0,
  posts_per_week:  0,
  notes: '',
}

function pick(plan) {
  return {
    photos_per_week: plan.photos_per_week ?? 0,
    posts_per_week:  plan.posts_per_week  ?? 0,
    notes:           plan.notes           ?? '',
  }
}

export default function ContentPlanForm({ initialPlan, prefilledClient, clients, onSubmit, onClose }) {
  const hasPrefilledClient = Boolean(prefilledClient)
  const [clientId, setClientId] = useState(
    prefilledClient?.id ?? initialPlan?.client_id ?? ''
  )
  const [form, setForm]               = useState(() => initialPlan ? pick(initialPlan) : { ...EMPTY })
  const [saving, setSaving]           = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [clientError, setClientError] = useState(null)

  function setGoal(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!clientId) { setClientError('Selecione um cliente.'); return }
    setSaving(true)
    setSubmitError(null)
    setClientError(null)
    try {
      await onSubmit(clientId, {
        photos_per_week: Math.max(0, parseInt(form.photos_per_week, 10) || 0),
        posts_per_week:  Math.max(0, parseInt(form.posts_per_week,  10) || 0),
        notes: form.notes || null,
      })
      onClose()
    } catch (err) {
      console.error('[ContentPlanForm] save error:', err)
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
              {initialPlan ? 'Editar plano de conteúdo' : 'Configurar plano de conteúdo'}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Metas semanais de conteúdo para Google Meu Negócio
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
          id="plan-form"
          onSubmit={handleSubmit}
          noValidate
          className="overflow-y-auto px-6 py-5 space-y-4"
        >
          {submitError && (
            <div role="alert" className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {submitError}
            </div>
          )}

          {/* Cliente */}
          {hasPrefilledClient ? (
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cliente</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{prefilledClient.name}</p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Cliente *</label>
              <select
                value={clientId}
                onChange={e => { setClientId(e.target.value); setClientError(null) }}
                className={inputCls(clientError)}
              >
                <option value="">— Selecione um cliente —</option>
                {(clients ?? []).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {clientError && <p className="mt-1 text-xs text-red-500">{clientError}</p>}
            </div>
          )}

          {/* Goals */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Metas por semana
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'photos_per_week', label: 'Fotos' },
                { key: 'posts_per_week',  label: 'Postagens' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    step="1"
                    value={form[key]}
                    onChange={e => setGoal(key, e.target.value)}
                    className={inputCls()}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Observações</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              placeholder="Instruções especiais, características do cliente..."
              className={inputCls()}
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
            form="plan-form"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Salvando…' : initialPlan ? 'Salvar alterações' : 'Configurar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function inputCls(error) {
  return [
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900',
    'placeholder-gray-300',
    'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors',
    'dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-600',
    error ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700',
  ].join(' ')
}
