import { useState } from 'react'
import { X } from 'lucide-react'
import { SERVICE_CATEGORIES } from '../../utils/serviceCatalog.js'

const EMPTY = {
  name:             '',
  category:         '',
  description:      '',
  price:            '',
  promo_price:      '',
  sessions_count:   '',
  duration_minutes: '',
  status:           'ativo',
  notes:            '',
}

function pick(s) {
  return {
    name:             s.name             ?? '',
    category:         s.category         ?? '',
    description:      s.description      ?? '',
    price:            s.price            ?? '',
    promo_price:      s.promo_price      ?? '',
    sessions_count:   s.sessions_count   ?? '',
    duration_minutes: s.duration_minutes ?? '',
    status:           s.status           ?? 'ativo',
    notes:            s.notes            ?? '',
  }
}

function numOrNull(v) {
  const n = parseFloat(v)
  return (v === '' || isNaN(n)) ? null : n
}

function intOrNull(v) {
  const n = parseInt(v, 10)
  return (v === '' || isNaN(n)) ? null : n
}

export default function ServiceFormModal({ initialData, onSubmit, onClose }) {
  const isEditing = Boolean(initialData)
  const [form, setForm]               = useState(() => isEditing ? pick(initialData) : { ...EMPTY })
  const [errors, setErrors]           = useState({})
  const [saving, setSaving]           = useState(false)
  const [submitError, setSubmitError] = useState(null)

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Nome é obrigatório.'
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
        name:             form.name.trim(),
        category:         form.category     || null,
        description:      form.description  || null,
        price:            numOrNull(form.price),
        promo_price:      numOrNull(form.promo_price),
        sessions_count:   intOrNull(form.sessions_count),
        duration_minutes: intOrNull(form.duration_minutes),
        status:           form.status,
        notes:            form.notes || null,
      })
      onClose()
    } catch (err) {
      console.error('[ServiceFormModal] save error:', err)
      setSubmitError('Não foi possível salvar. Tente novamente.')
      setSaving(false)
    }
  }

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
              {isEditing ? 'Editar serviço' : 'Novo serviço'}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {isEditing ? 'Atualize as informações abaixo' : 'Cadastre um procedimento ou serviço'}
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
        <form id="service-form" onSubmit={handleSubmit} noValidate className="overflow-y-auto px-6 py-5 space-y-4">
          {submitError && (
            <div role="alert" className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {submitError}
            </div>
          )}

          {/* Nome */}
          <Field label="Nome *" error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              placeholder="Ex: Limpeza de pele, Botox, Skinbooster..."
              className={inputCls(errors.name)}
            />
          </Field>

          {/* Categoria + Status */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <select
                value={form.category}
                onChange={e => setField('category', e.target.value)}
                className={inputCls()}
              >
                <option value="">— Selecione —</option>
                {SERVICE_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={e => setField('status', e.target.value)}
                className={inputCls()}
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </Field>
          </div>

          {/* Descrição */}
          <Field label="Descrição">
            <textarea
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              rows={2}
              placeholder="Breve descrição do procedimento..."
              className={inputCls()}
            />
          </Field>

          {/* Preços */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Valores</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valor (R$)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={e => setField('price', e.target.value)}
                  placeholder="0,00"
                  className={inputCls()}
                />
              </Field>
              <Field label="Valor promocional (R$)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.promo_price}
                  onChange={e => setField('promo_price', e.target.value)}
                  placeholder="0,00"
                  className={inputCls()}
                />
              </Field>
            </div>
          </div>

          {/* Sessões + Duração */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nº de sessões">
              <input
                type="number"
                min="1"
                step="1"
                value={form.sessions_count}
                onChange={e => setField('sessions_count', e.target.value)}
                placeholder="Ex: 4"
                className={inputCls()}
              />
            </Field>
            <Field label="Duração (min)">
              <input
                type="number"
                min="1"
                step="1"
                value={form.duration_minutes}
                onChange={e => setField('duration_minutes', e.target.value)}
                placeholder="Ex: 60"
                className={inputCls()}
              />
            </Field>
          </div>

          {/* Observações internas */}
          <Field label="Observações internas">
            <textarea
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              rows={2}
              placeholder="Notas para uso interno, protocolos, materiais..."
              className={inputCls()}
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
            form="service-form"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Criar serviço'}
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

function inputCls(error) {
  return [
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900',
    'placeholder-gray-300',
    'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors',
    'dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-600',
    error ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700',
  ].join(' ')
}
