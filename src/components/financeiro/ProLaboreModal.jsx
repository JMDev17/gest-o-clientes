import { useState } from 'react'
import { X, ArrowLeftRight } from 'lucide-react'
import { todayKey } from '../../utils/financial.js'
import { formatCurrency } from '../../utils/formatCurrency.js'

function cls(error) {
  return [
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900',
    'placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors',
    'dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-600',
    error ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700',
  ].join(' ')
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

export default function ProLaboreModal({ onSubmit, onClose }) {
  const [form, setForm] = useState({ amount: '', date: todayKey(), notes: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }))
  }

  function validate() {
    const errs = {}
    const amt = Number(form.amount)
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = 'Informe um valor válido.'
    if (!form.date) errs.date = 'Informe a data.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitError(null)
    setSaving(true)
    try {
      await onSubmit({
        amount: Number(form.amount),
        date:   form.date,
        notes:  form.notes.trim() || null,
      })
      onClose()
    } catch {
      setSubmitError('Não foi possível registrar a retirada. Tente novamente.')
      setSaving(false)
    }
  }

  const preview = Number(form.amount) > 0 ? formatCurrency(Number(form.amount)) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full sm:max-w-md bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl flex flex-col max-h-[95dvh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30">
              <ArrowLeftRight size={18} className="text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Retirar Pró-labore</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Empresa → Pessoal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-colors"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Info banner */}
        <div className="mx-6 mt-5 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/50 px-4 py-3">
          <p className="text-xs text-brand-700 dark:text-brand-300 leading-relaxed">
            Esta operação registra automaticamente uma <strong>saída</strong> na empresa
            e uma <strong>entrada</strong> no pessoal — sem precisar lançar duas vezes.
          </p>
        </div>

        {/* Body */}
        <form
          id="prolabore-form"
          onSubmit={handleSubmit}
          noValidate
          className="px-6 py-5 space-y-4"
        >
          {submitError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor da retirada *" error={errors.amount}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={e => setField('amount', e.target.value)}
                placeholder="0,00"
                className={cls(errors.amount)}
              />
            </Field>
            <Field label="Data *" error={errors.date}>
              <input
                type="date"
                value={form.date}
                onChange={e => setField('date', e.target.value)}
                className={cls(errors.date)}
              />
            </Field>
          </div>

          <Field label="Observações">
            <textarea
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Ex: Retirada de março, adiantamento..."
              rows={2}
              className={cls() + ' resize-none'}
            />
          </Field>

          {preview && (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-3 space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Prévia</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Saída empresa</span>
                <span className="font-semibold text-red-600 dark:text-red-400 tabular-nums">-{preview}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Entrada pessoal</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">+{preview}</span>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 pt-3 pb-5 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center justify-end gap-3">
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
              form="prolabore-form"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Registrando…' : 'Registrar retirada'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
