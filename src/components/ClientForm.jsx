import { useState } from 'react'
import { X } from 'lucide-react'
import { useWorkspace } from '../hooks/useWorkspace.js'

const BASE_FORM = {
  name: '', company_name: '', niche: '',
  city: '', whatsapp: '', status: '', notes: '',
}
const EDITABLE = Object.keys(BASE_FORM)

function buildEmpty(ws) {
  return { ...BASE_FORM, status: ws.statusOptions[0]?.value ?? 'ativo' }
}

function pickEditable(client, ws) {
  const empty = buildEmpty(ws)
  return EDITABLE.reduce((acc, k) => ({ ...acc, [k]: client[k] ?? empty[k] }), {})
}

export default function ClientForm({ initialData, onSubmit, onClose }) {
  const { workspace } = useWorkspace()
  const isEditing = Boolean(initialData)

  const [form, setForm]               = useState(() =>
    isEditing ? pickEditable(initialData, workspace) : buildEmpty(workspace)
  )
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [saving, setSaving]           = useState(false)

  const f = workspace.fields

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    setFieldErrors(prev => ({ ...prev, [key]: null }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = `${f.name.label} é obrigatório.`
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setSubmitError(null)
    setSaving(true)
    try {
      await onSubmit(form)
      onClose()
    } catch {
      setSubmitError('Não foi possível salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full sm:max-w-lg bg-white sm:rounded-2xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {isEditing ? workspace.client.editLabel : workspace.client.newLabel}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEditing ? 'Atualize as informações abaixo' : 'Preencha os dados para cadastrar'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form
          id="client-form"
          onSubmit={handleSubmit}
          noValidate
          className="overflow-y-auto px-6 py-5 space-y-4"
        >
          {submitError && (
            <div role="alert" className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <Field label={`${f.name.label} *`} error={fieldErrors.name}>
            <input
              type="text"
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              placeholder={f.name.placeholder}
              className={inputCls(fieldErrors.name)}
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={f.company_name.label}>
              <input type="text" value={form.company_name}
                onChange={e => setField('company_name', e.target.value)}
                placeholder={f.company_name.placeholder} className={inputCls()} />
            </Field>
            <Field label={f.niche.label}>
              <input type="text" value={form.niche}
                onChange={e => setField('niche', e.target.value)}
                placeholder={f.niche.placeholder} className={inputCls()} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={f.city.label}>
              <input type="text" value={form.city}
                onChange={e => setField('city', e.target.value)}
                placeholder={f.city.placeholder} className={inputCls()} />
            </Field>
            <Field label={f.whatsapp.label}>
              <input type="text" value={form.whatsapp}
                onChange={e => setField('whatsapp', e.target.value)}
                placeholder={f.whatsapp.placeholder} className={inputCls()} />
            </Field>
          </div>

          <Field label="Status">
            <select value={form.status} onChange={e => setField('status', e.target.value)}
              className={inputCls()}>
              {workspace.statusOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <Field label={f.notes.label}>
            <textarea value={form.notes} onChange={e => setField('notes', e.target.value)}
              rows={3} placeholder={f.notes.placeholder} className={inputCls()} />
          </Field>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button type="button" onClick={onClose} disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" form="client-form" disabled={saving}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors">
            {saving ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function inputCls(error) {
  return [
    'w-full rounded-lg border bg-white px-3 py-2 text-sm',
    'placeholder-gray-300 text-gray-900',
    'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors',
    error ? 'border-red-300' : 'border-gray-200',
  ].join(' ')
}
