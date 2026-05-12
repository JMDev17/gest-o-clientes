import { useState, useMemo } from 'react'
import { X } from 'lucide-react'
import { APPOINTMENT_STATUS } from '../../hooks/useAppointments.js'
import { todayISO } from '../../utils/dateHelpers.js'

function todayStr() {
  return todayISO()
}

const EMPTY = {
  client_id:        '',
  service_id:       '',
  contract_id:      '',
  title:            '',
  description:      '',
  appointment_date: '',
  start_time:       '',
  end_time:         '',
  status:           'agendado',
  notes:            '',
}

function pick(a) {
  return {
    client_id:        a.client_id        ?? '',
    service_id:       a.service_id       ?? '',
    contract_id:      a.contract_id      ?? '',
    title:            a.title            ?? '',
    description:      a.description      ?? '',
    appointment_date: a.appointment_date ?? todayStr(),
    start_time:       a.start_time       ?? '',
    end_time:         a.end_time         ?? '',
    status:           a.status           ?? 'agendado',
    notes:            a.notes            ?? '',
  }
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
    'placeholder-gray-300 disabled:bg-gray-50 disabled:text-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors',
    'dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-500',
    error ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700',
  ].join(' ')
}

export default function AppointmentFormModal({
  initialData, prefilledDate, clients, services, contracts, onSubmit, onClose
}) {
  const isEditing = Boolean(initialData)

  const [form, setForm] = useState(() =>
    isEditing
      ? pick(initialData)
      : { ...EMPTY, appointment_date: prefilledDate ?? todayStr() }
  )
  const [errors, setErrors]           = useState({})
  const [saving, setSaving]           = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // Filter contracts: only ativo + matching client if selected
  const clientContracts = useMemo(() =>
    (contracts ?? []).filter(c =>
      c.status === 'ativo' &&
      (!form.client_id || c.client_id === form.client_id)
    ),
    [contracts, form.client_id]
  )

  function setField(key, value) {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'service_id' && value && !prev.title) {
        const svc = (services ?? []).find(s => s.id === value)
        if (svc) next.title = svc.name
      }
      if (key === 'client_id') next.contract_id = ''
      return next
    })
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }))
  }

  function validate() {
    const errs = {}
    if (!form.title.trim())       errs.title            = 'Título é obrigatório.'
    if (!form.appointment_date)   errs.appointment_date = 'Informe a data.'
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
        client_id:        form.client_id        || null,
        service_id:       form.service_id       || null,
        contract_id:      form.contract_id      || null,
        title:            form.title.trim(),
        description:      form.description      || null,
        appointment_date: form.appointment_date,
        start_time:       form.start_time       || null,
        end_time:         form.end_time         || null,
        status:           form.status,
        notes:            form.notes            || null,
      })
    } catch (err) {
      console.error('[AppointmentFormModal] save error:', err)
      setSubmitError('Não foi possível salvar. Tente novamente.')
      setSaving(false)
    }
  }

  const activeServices = (services ?? []).filter(s => s.status === 'ativo')

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
              {isEditing ? 'Editar agendamento' : 'Novo agendamento'}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {isEditing ? 'Atualize as informações' : 'Agende um atendimento ou procedimento'}
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
        <form id="appt-form" onSubmit={handleSubmit} noValidate className="overflow-y-auto px-6 py-5 space-y-4">
          {submitError && (
            <div role="alert" className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {submitError}
            </div>
          )}

          {/* Paciente */}
          <Field label="Paciente / Cliente">
            <select
              value={form.client_id}
              onChange={e => setField('client_id', e.target.value)}
              className={inputCls()}
            >
              <option value="">— Selecione (opcional) —</option>
              {(clients ?? []).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          {/* Serviço + Pacote */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Serviço / Procedimento">
              <select
                value={form.service_id}
                onChange={e => setField('service_id', e.target.value)}
                className={inputCls()}
              >
                <option value="">— Selecione —</option>
                {activeServices.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Pacote vinculado">
              <select
                value={form.contract_id}
                onChange={e => setField('contract_id', e.target.value)}
                className={inputCls()}
                disabled={clientContracts.length === 0}
              >
                <option value="">— Nenhum —</option>
                {clientContracts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Título */}
          <Field label="Título *" error={errors.title}>
            <input
              type="text"
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              placeholder="Ex: Limpeza de pele — Ana Silva"
              className={inputCls(errors.title)}
            />
          </Field>

          {/* Data + Status */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data *" error={errors.appointment_date}>
              <input
                type="date"
                value={form.appointment_date}
                onChange={e => setField('appointment_date', e.target.value)}
                className={inputCls(errors.appointment_date)}
              />
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={e => setField('status', e.target.value)}
                className={inputCls()}
              >
                {APPOINTMENT_STATUS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Início">
              <input
                type="time"
                value={form.start_time}
                onChange={e => setField('start_time', e.target.value)}
                className={inputCls()}
              />
            </Field>
            <Field label="Fim">
              <input
                type="time"
                value={form.end_time}
                onChange={e => setField('end_time', e.target.value)}
                className={inputCls()}
              />
            </Field>
          </div>

          {/* Descrição */}
          <Field label="Descrição">
            <textarea
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              rows={2}
              placeholder="Detalhes do atendimento..."
              className={inputCls()}
            />
          </Field>

          {/* Observações */}
          <Field label="Observações internas">
            <textarea
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              rows={2}
              placeholder="Notas internas, protocolos..."
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
            form="appt-form"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Agendar'}
          </button>
        </div>
      </div>
    </div>
  )
}
