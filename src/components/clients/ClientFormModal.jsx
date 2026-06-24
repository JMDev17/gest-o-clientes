import { useState } from 'react'
import { X } from 'lucide-react'
import { useWorkspace } from '../../hooks/useWorkspace.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useFormDraft } from '../../hooks/useFormDraft.js'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges.js'
import DraftBanner from '../DraftBanner.jsx'

const EDITABLE = ['name', 'company_name', 'niche', 'city', 'whatsapp', 'status', 'notes']

function maskWhatsApp(value) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2)  return d
  if (d.length <= 7)  return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function buildEmpty(ws) {
  return {
    name: '', company_name: '', niche: '',
    city: '', whatsapp: '', notes: '',
    status: ws.statusOptions[0]?.value ?? 'ativo',
  }
}

function pickEditable(client, ws) {
  const empty = buildEmpty(ws)
  return EDITABLE.reduce((acc, k) => ({ ...acc, [k]: client[k] ?? empty[k] }), {})
}

export default function ClientFormModal({ initialData, onSubmit, onClose }) {
  const { workspace, workspaceType } = useWorkspace()
  const { user } = useAuth()
  const isEditing = Boolean(initialData)

  const [form, setForm]       = useState(() =>
    isEditing ? pickEditable(initialData, workspace) : buildEmpty(workspace)
  )
  const [errors, setErrors]   = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [showBanner, setShowBanner] = useState(true)

  const draftKey = isEditing ? null : (user ? `draft:client:${user.id}:${workspaceType}` : null)
  const { hasDraft, draftData, draftSavedAt, lastSaved, clearDraft } = useFormDraft(draftKey, form, isDirty)
  const { guardClose } = useUnsavedChanges(isDirty)

  const f = workspace.fields

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    setIsDirty(true)
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }))
  }

  function handleRecoverDraft() {
    if (draftData) { setForm(draftData); setIsDirty(true) }
    setShowBanner(false)
  }

  function handleDiscardDraft() {
    clearDraft()
    setShowBanner(false)
  }

  function setWhatsApp(raw) {
    setField('whatsapp', maskWhatsApp(raw))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = `${f.name.label} é obrigatório.`
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitError(null)
    setSaving(true)
    try {
      await onSubmit(form)
      clearDraft()
      setIsDirty(false)
      onClose()
    } catch {
      setSubmitError('Não foi possível salvar. Tente novamente.')
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={e => { if (e.target === e.currentTarget) guardClose(onClose) }}
    >
      <div className="w-full sm:max-w-lg bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {isEditing ? workspace.client.editLabel : workspace.client.newLabel}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {isEditing ? 'Atualize as informações abaixo' : 'Preencha os dados para cadastrar'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => guardClose(onClose)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
            aria-label="Fechar"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <form
          id="client-form"
          onSubmit={handleSubmit}
          noValidate
          className="overflow-y-auto px-6 py-5 space-y-4"
        >
          {!isEditing && hasDraft && showBanner && (
            <DraftBanner
              savedAt={draftSavedAt}
              onRecover={handleRecoverDraft}
              onDiscard={handleDiscardDraft}
            />
          )}

          {submitError && (
            <div role="alert" className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {submitError}
            </div>
          )}

          <Field label={`${f.name.label} *`} error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              placeholder={f.name.placeholder}
              className={cls(errors.name)}
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={f.company_name.label}>
              <input
                type="text"
                value={form.company_name}
                onChange={e => setField('company_name', e.target.value)}
                placeholder={f.company_name.placeholder}
                className={cls()}
              />
            </Field>
            <Field label={f.niche.label}>
              <input
                type="text"
                value={form.niche}
                onChange={e => setField('niche', e.target.value)}
                placeholder={f.niche.placeholder}
                className={cls()}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={f.city.label}>
              <input
                type="text"
                value={form.city}
                onChange={e => setField('city', e.target.value)}
                placeholder={f.city.placeholder}
                className={cls()}
              />
            </Field>
            <Field label={f.whatsapp.label}>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={e => setWhatsApp(e.target.value)}
                placeholder="(11) 99999-9999"
                className={cls()}
              />
            </Field>
          </div>

          <Field label="Status">
            <select
              value={form.status}
              onChange={e => setField('status', e.target.value)}
              className={cls()}
            >
              {workspace.statusOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <Field label={f.notes.label}>
            <textarea
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              rows={3}
              placeholder={f.notes.placeholder}
              className={cls()}
            />
          </Field>
        </form>

        {/* Footer */}
        <div className="px-6 pt-3 pb-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
          {lastSaved && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-right mb-2">
              Rascunho salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => guardClose(onClose)}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="client-form"
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
