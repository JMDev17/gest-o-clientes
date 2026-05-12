import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useWorkspace } from '../../hooks/useWorkspace.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useClients } from '../../hooks/useClients.js'
import { useFormDraft } from '../../hooks/useFormDraft.js'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges.js'
import DraftBanner from '../DraftBanner.jsx'

function buildEmpty(wsType) {
  const base = {
    client_id: '', name: '', description: '', notes: '',
    start_date: new Date().toISOString().split('T')[0], end_date: '',
    status: 'ativo', total_value: 0
  }
  if (wsType === 'marketing') {
    return { ...base, setup_fee: 0, recurring_amount: 0, contract_duration_months: 6, auto_renew: false }
  }
  return { ...base, total_sessions: 10, completed_sessions: 0 }
}

export default function ContractFormModal({ initialData, onSubmit, onClose }) {
  const { workspace, workspaceType } = useWorkspace()
  const { user } = useAuth()
  const { clients } = useClients()
  const isEditing = Boolean(initialData)

  const [form, setForm] = useState(() => {
    if (isEditing) {
      const copy = { ...initialData }
      if (copy.start_date) copy.start_date = copy.start_date.split('T')[0]
      if (copy.end_date) copy.end_date = copy.end_date.split('T')[0]
      return copy
    }
    return buildEmpty(workspaceType)
  })

  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [showBanner, setShowBanner] = useState(true)

  const draftKey = isEditing ? null : (user ? `draft:contract:${user.id}:${workspaceType}` : null)
  const { hasDraft, draftData, draftSavedAt, lastSaved, clearDraft } = useFormDraft(draftKey, form, isDirty)
  const { guardClose } = useUnsavedChanges(isDirty)

  const cw = workspace.contracts

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

  function validate() {
    const errs = {}
    if (!form.client_id) errs.client_id = 'Selecione um cliente/paciente.'
    if (!form.name.trim()) errs.name = 'Nome é obrigatório.'
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
      <div className="w-full sm:max-w-xl bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {isEditing ? `Editar ${cw.itemLabel}` : cw.newLabel}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => guardClose(onClose)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <form
          id="contract-form"
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

          <Field label="Cliente / Paciente *" error={errors.client_id}>
            <select
              value={form.client_id}
              onChange={e => setField('client_id', e.target.value)}
              className={cls(errors.client_id)}
              disabled={isEditing}
            >
              <option value="">Selecione...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Nome / Identificação *" error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              placeholder="Ex: Gestão de Redes 6 Meses, Pacote 10 Sessões"
              className={cls(errors.name)}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Data de Início">
              <input
                type="date"
                value={form.start_date || ''}
                onChange={e => setField('start_date', e.target.value)}
                className={cls()}
              />
            </Field>
            <Field label="Data de Término">
              <input
                type="date"
                value={form.end_date || ''}
                onChange={e => setField('end_date', e.target.value)}
                className={cls()}
              />
            </Field>
          </div>

          {workspaceType === 'marketing' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Taxa de Setup (R$)">
                <input
                  type="number" step="0.01"
                  value={form.setup_fee || ''}
                  onChange={e => setField('setup_fee', e.target.value)}
                  className={cls()}
                />
              </Field>
              <Field label={cw.amountLabel + " (R$)"}>
                <input
                  type="number" step="0.01"
                  value={form.recurring_amount || ''}
                  onChange={e => setField('recurring_amount', e.target.value)}
                  className={cls()}
                />
              </Field>
              <Field label={cw.durationLabel}>
                <input
                  type="number"
                  value={form.contract_duration_months || ''}
                  onChange={e => setField('contract_duration_months', e.target.value)}
                  className={cls()}
                />
              </Field>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="auto_renew"
                  checked={form.auto_renew}
                  onChange={e => setField('auto_renew', e.target.checked)}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="auto_renew" className="text-sm text-gray-700 dark:text-gray-300">Renovação automática</label>
              </div>
            </div>
          )}

          {workspaceType === 'estetica' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={cw.amountLabel + " (R$)"}>
                <input
                  type="number" step="0.01"
                  value={form.total_value || ''}
                  onChange={e => setField('total_value', e.target.value)}
                  className={cls()}
                />
              </Field>
              <Field label={cw.durationLabel}>
                <input
                  type="number"
                  value={form.total_sessions || ''}
                  onChange={e => setField('total_sessions', e.target.value)}
                  className={cls()}
                />
              </Field>
              <Field label="Sessões Realizadas">
                <input
                  type="number"
                  value={form.completed_sessions || ''}
                  onChange={e => setField('completed_sessions', e.target.value)}
                  className={cls()}
                />
              </Field>
            </div>
          )}

          <Field label="Descrição">
            <textarea
              value={form.description || ''}
              onChange={e => setField('description', e.target.value)}
              rows={2}
              className={cls()}
            />
          </Field>

          <Field label="Status">
            <select
              value={form.status}
              onChange={e => setField('status', e.target.value)}
              className={cls()}
            >
              <option value="ativo">Ativo</option>
              <option value="encerrado">Encerrado</option>
              <option value="cancelado">Cancelado</option>
            </select>
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
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="contract-form"
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
