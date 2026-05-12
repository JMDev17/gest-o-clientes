import { useState } from 'react'
import { X } from 'lucide-react'
import { useWorkspace } from '../../hooks/useWorkspace.js'
import { TASK_STATUS, TASK_PRIORITY } from '../../hooks/useTasks.js'

const EMPTY = {
  title:       '',
  client_id:   '',
  type:        '',
  description: '',
  due_date:    '',
  status:      'pendente',
  priority:    'media',
}

function pickEditable(task) {
  return {
    title:       task.title       ?? '',
    client_id:   task.client_id   ?? '',
    type:        task.type        ?? '',
    description: task.description ?? '',
    due_date:    task.due_date    ?? '',
    status:      task.status      ?? 'pendente',
    priority:    task.priority    ?? 'media',
  }
}

export default function TaskFormModal({ initialData, clients, onSubmit, onClose }) {
  const { workspace } = useWorkspace()
  const isEditing = Boolean(initialData)
  const t = workspace.tasks

  const [form, setForm]               = useState(() =>
    isEditing ? pickEditable(initialData) : { ...EMPTY }
  )
  const [errors, setErrors]           = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [saving, setSaving]           = useState(false)

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }))
  }

  function validate() {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Título é obrigatório.'
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
        title:       form.title.trim(),
        client_id:   form.client_id   || null,
        type:        form.type        || null,
        description: form.description || null,
        due_date:    form.due_date    || null,
        status:      form.status,
        priority:    form.priority,
      })
      onClose()
    } catch {
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
              {isEditing ? 'Editar tarefa' : t.newLabel}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {isEditing ? 'Atualize as informações abaixo' : 'Preencha os dados da tarefa'}
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
          id="task-form"
          onSubmit={handleSubmit}
          noValidate
          className="overflow-y-auto px-6 py-5 space-y-4"
        >
          {submitError && (
            <div role="alert" className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {submitError}
            </div>
          )}

          {/* Título */}
          <Field label="Título *" error={errors.title}>
            <input
              type="text"
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              placeholder="Ex: Criar post semanal, Ligar para paciente..."
              className={cls(errors.title)}
              autoFocus
            />
          </Field>

          {/* Cliente + Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t.clientLabel}>
              <select
                value={form.client_id}
                onChange={e => setField('client_id', e.target.value)}
                className={cls()}
              >
                <option value="">— Sem vínculo —</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>

            <Field label={t.typeLabel}>
              <select
                value={form.type}
                onChange={e => setField('type', e.target.value)}
                className={cls()}
              >
                <option value="">— Selecione —</option>
                {t.types.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Prioridade + Data limite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Prioridade">
              <select
                value={form.priority}
                onChange={e => setField('priority', e.target.value)}
                className={cls()}
              >
                {TASK_PRIORITY.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            <Field label={t.dueDateLabel}>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setField('due_date', e.target.value)}
                className={cls()}
              />
            </Field>
          </div>

          {/* Status */}
          <Field label="Status">
            <select
              value={form.status}
              onChange={e => setField('status', e.target.value)}
              className={cls()}
            >
              {TASK_STATUS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          {/* Descrição */}
          <Field label="Descrição">
            <textarea
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              rows={3}
              placeholder="Detalhes adicionais sobre a tarefa..."
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
            form="task-form"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
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
