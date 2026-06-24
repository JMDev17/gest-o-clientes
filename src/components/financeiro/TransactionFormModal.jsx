import { useState } from 'react'
import { X } from 'lucide-react'
import { PAYMENT_METHODS } from '../../utils/financial.js'
import { todayKey } from '../../utils/financial.js'

const STATUS_OPTIONS = [
  { value: 'paid',    label: 'Pago / Recebido' },
  { value: 'pending', label: 'Pendente' },
]

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

const EMPTY = {
  description:    '',
  amount:         '',
  category_id:    '',
  category_name:  '',
  date:           todayKey(),
  payment_method: '',
  status:         'paid',
  notes:          '',
}

function pickEditable(tx) {
  return {
    ...EMPTY,
    description:    tx.description    ?? '',
    amount:         tx.amount         ?? '',
    category_id:    tx.category_id    ?? '',
    category_name:  tx.category_name  ?? '',
    date:           tx.date           ?? todayKey(),
    payment_method: tx.payment_method ?? '',
    status:         tx.status         ?? 'paid',
    notes:          tx.notes          ?? '',
  }
}

export default function TransactionFormModal({
  initialData,
  scope,
  defaultType = 'expense',
  categories = [],
  onSubmit,
  onClose,
}) {
  const isEditing = Boolean(initialData)
  const [type,   setType]   = useState(initialData?.type ?? defaultType)
  const [form,   setForm]   = useState(() => isEditing ? pickEditable(initialData) : { ...EMPTY })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const isIncome  = type === 'income'
  const typeLabel = isIncome ? 'Receita' : 'Despesa'

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }))
  }

  function handleCategoryChange(id) {
    const cat = categories.find(c => c.id === id)
    setField('category_id',   id)
    setField('category_name', cat?.name ?? '')
  }

  function validate() {
    const errs = {}
    if (!form.description.trim()) errs.description = 'Informe uma descrição.'
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
        scope,
        type,
        description:    form.description.trim(),
        amount:         Number(form.amount),
        category_id:    form.category_id   || null,
        category_name:  form.category_name || null,
        date:           form.date,
        payment_method: form.payment_method || null,
        status:         form.status,
        notes:          form.notes.trim() || null,
      })
      onClose()
    } catch {
      setSubmitError('Não foi possível salvar. Tente novamente.')
      setSaving(false)
    }
  }

  const scopeLabel = scope === 'company' ? 'Empresa' : 'Pessoal'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full sm:max-w-lg bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {isEditing ? `Editar ${typeLabel.toLowerCase()}` : `Nova ${typeLabel.toLowerCase()}`}
              <span className="ml-2 text-[11px] font-normal text-gray-400">· {scopeLabel}</span>
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {isEditing ? 'Atualize as informações' : 'Preencha os dados da transação'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-colors"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <form
          id="tx-form"
          onSubmit={handleSubmit}
          noValidate
          className="overflow-y-auto px-6 py-5 space-y-4"
        >
          {submitError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {submitError}
            </div>
          )}

          {/* Tipo: Receita / Despesa */}
          {!isEditing && (
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
              {[{ value: 'income', label: 'Receita' }, { value: 'expense', label: 'Despesa' }].map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setType(o.value)}
                  className={[
                    'rounded-lg py-1.5 text-xs font-medium transition-all',
                    type === o.value
                      ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                  ].join(' ')}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}

          {/* Descrição */}
          <Field label="Descrição *" error={errors.description}>
            <input
              type="text"
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              placeholder={isIncome ? 'Ex: Freela projeto X' : 'Ex: Assinatura Adobe'}
              className={cls(errors.description)}
            />
          </Field>

          {/* Valor + Data */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor *" error={errors.amount}>
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

          {/* Categoria */}
          <Field label="Categoria">
            <select
              value={form.category_id}
              onChange={e => handleCategoryChange(e.target.value)}
              className={cls()}
            >
              <option value="">— Sem categoria —</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          {/* Forma de pagamento + Status */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Forma de pagamento">
              <select
                value={form.payment_method}
                onChange={e => setField('payment_method', e.target.value)}
                className={cls()}
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={e => setField('status', e.target.value)}
                className={cls()}
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Observações */}
          <Field label="Observações">
            <textarea
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Informações adicionais..."
              rows={2}
              className={cls() + ' resize-none'}
            />
          </Field>
        </form>

        {/* Footer */}
        <div className="px-6 pt-3 pb-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
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
              form="tx-form"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Cadastrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
