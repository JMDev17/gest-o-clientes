import { useState, useMemo } from 'react'
import { X } from 'lucide-react'
import { useWorkspace } from '../../hooks/useWorkspace.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useFormDraft } from '../../hooks/useFormDraft.js'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges.js'
import DraftBanner from '../DraftBanner.jsx'
import { PAYMENT_STATUS } from '../../hooks/usePayments.js'
import {
  generateSingle,
  generateInstallments,
  generateDownPayment,
  generateRecurring,
} from '../../utils/paymentGenerators.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { formatDate } from '../../utils/formatDate.js'
import { FREQ_OPTIONS } from '../../config/paymentFrequency.js'

export { FREQ_OPTIONS }

const TYPE_OPTIONS = [
  { value: 'unico',      label: 'Único' },
  { value: 'parcelado',  label: 'Parcelado' },
  { value: 'entrada',    label: 'Entrada + Resto' },
  { value: 'recorrente', label: 'Recorrente' },
]

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const EMPTY = {
  client_id:       '',
  notes:           '',
  // unico
  amount:          '',
  due_date:        '',
  status:          'pendente',
  paid_date:       '',
  // parcelado
  total_amount:    '',
  installments:    '3',
  first_due_date:  '',
  // entrada
  down_pct:        '50',
  down_date:       '',
  remainder_date:  '',
  // recorrente
  periodic_amount: '',
  frequency:       'mensal',
  recur_start:     '',
  num_occurrences: '3',
}

function pickEditable(payment) {
  return {
    ...EMPTY,
    client_id: payment.client_id ?? '',
    notes:     payment.notes     ?? '',
    amount:    payment.amount    ?? '',
    due_date:  payment.due_date  ?? '',
    paid_date: payment.paid_date ?? '',
    status:    payment.status    ?? 'pendente',
  }
}

export default function PaymentFormModal({ initialData, clients, onSubmit, onClose }) {
  const { workspace, workspaceType } = useWorkspace()
  const { user } = useAuth()
  const isEditing = Boolean(initialData)
  const p = workspace.payments

  const [paymentType, setPaymentType] = useState('unico')
  const [form, setForm]               = useState(() =>
    isEditing ? pickEditable(initialData) : { ...EMPTY }
  )
  const [errors, setErrors]           = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [saving, setSaving]           = useState(false)
  const [isDirty, setIsDirty]         = useState(false)
  const [showBanner, setShowBanner]   = useState(true)

  const draftKey = isEditing ? null : (user ? `draft:payment:${user.id}:${workspaceType}` : null)
  const draftPayload = useMemo(() => ({ form, paymentType }), [form, paymentType])
  const { hasDraft, draftData, draftSavedAt, lastSaved, clearDraft } = useFormDraft(draftKey, draftPayload, isDirty)
  const { guardClose } = useUnsavedChanges(isDirty)

  const currentFreq = FREQ_OPTIONS.find(o => o.value === form.frequency) ?? FREQ_OPTIONS[2]

  function setField(key, value) {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'status' && value !== 'pago') next.paid_date = ''
      return next
    })
    setIsDirty(true)
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }))
  }

  function switchType(type) {
    setPaymentType(type)
    setIsDirty(true)
    setErrors({})
  }

  function handleRecoverDraft() {
    if (draftData?.form)        setForm(draftData.form)
    if (draftData?.paymentType) setPaymentType(draftData.paymentType)
    setIsDirty(true)
    setShowBanner(false)
  }

  function handleDiscardDraft() {
    clearDraft()
    setShowBanner(false)
  }

  const previewRecords = useMemo(() => {
    if (isEditing || paymentType === 'unico') return []
    try {
      if (paymentType === 'parcelado') {
        if (!form.total_amount || !form.installments || !form.first_due_date) return []
        if (Number(form.total_amount) <= 0 || parseInt(form.installments, 10) < 2) return []
        return generateInstallments(form)
      }
      if (paymentType === 'entrada') {
        if (!form.total_amount || !form.down_pct) return []
        const pct = Number(form.down_pct)
        if (Number(form.total_amount) <= 0 || pct <= 0 || pct >= 100) return []
        return generateDownPayment(form)
      }
      if (paymentType === 'recorrente') {
        if (!form.periodic_amount || !form.recur_start || !form.num_occurrences) return []
        if (Number(form.periodic_amount) <= 0 || parseInt(form.num_occurrences, 10) < 1) return []
        return generateRecurring({
          client_id:       form.client_id,
          notes:           form.notes,
          periodic_amount: form.periodic_amount,
          first_due_date:  form.recur_start,
          num_occurrences: form.num_occurrences,
          frequency:       form.frequency,
        })
      }
    } catch {
      return []
    }
    return []
  }, [isEditing, paymentType, form])

  function validate() {
    const errs = {}
    if (isEditing || paymentType === 'unico') {
      const amt = Number(form.amount)
      if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = 'Informe um valor válido.'
      if (form.status === 'pago' && !form.paid_date) errs.paid_date = 'Informe a data de pagamento.'
    }
    if (!isEditing && paymentType === 'parcelado') {
      const amt = Number(form.total_amount)
      if (!form.total_amount || isNaN(amt) || amt <= 0) errs.total_amount = 'Informe um valor válido.'
      const n = parseInt(form.installments, 10)
      if (!form.installments || isNaN(n) || n < 2) errs.installments = 'Mínimo 2 parcelas.'
      if (!form.first_due_date) errs.first_due_date = 'Informe o primeiro vencimento.'
    }
    if (!isEditing && paymentType === 'entrada') {
      const amt = Number(form.total_amount)
      if (!form.total_amount || isNaN(amt) || amt <= 0) errs.total_amount = 'Informe um valor válido.'
      const pct = Number(form.down_pct)
      if (!form.down_pct || isNaN(pct) || pct <= 0 || pct >= 100) errs.down_pct = 'Percentual de 1 a 99.'
      if (!form.down_date)      errs.down_date      = 'Informe a data da entrada.'
      if (!form.remainder_date) errs.remainder_date = 'Informe a data do restante.'
    }
    if (!isEditing && paymentType === 'recorrente') {
      const amt = Number(form.periodic_amount)
      if (!form.periodic_amount || isNaN(amt) || amt <= 0) errs.periodic_amount = 'Informe um valor válido.'
      if (!form.recur_start) errs.recur_start = 'Informe o primeiro vencimento.'
      const n = parseInt(form.num_occurrences, 10)
      if (!form.num_occurrences || isNaN(n) || n < 1) errs.num_occurrences = 'Mínimo 1 ocorrência.'
    }
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitError(null)
    setSaving(true)
    try {
      let records
      if (isEditing || paymentType === 'unico') {
        records = generateSingle({
          client_id: form.client_id,
          notes:     form.notes,
          amount:    form.amount,
          due_date:  form.due_date,
          status:    form.status,
          paid_date: form.paid_date,
        })
      } else if (paymentType === 'parcelado') {
        records = generateInstallments(form)
      } else if (paymentType === 'entrada') {
        records = generateDownPayment(form)
      } else {
        records = generateRecurring({
          client_id:       form.client_id,
          notes:           form.notes,
          periodic_amount: form.periodic_amount,
          first_due_date:  form.recur_start,
          num_occurrences: form.num_occurrences,
          frequency:       form.frequency,
        })
      }
      await onSubmit(records)
      clearDraft()
      setIsDirty(false)
      onClose()
    } catch (err) {
      console.error('[PaymentFormModal] save error:', err)
      const msg = err?.message ?? ''
      const isNetwork = !msg || msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ERR_NAME')
      setSubmitError(
        isNetwork
          ? 'Sem conexão com o servidor. Verifique se o projeto Supabase está ativo em supabase.com/dashboard.'
          : `Erro ao salvar: ${msg}`
      )
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
              {isEditing ? 'Editar pagamento' : 'Novo pagamento'}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {isEditing ? 'Atualize as informações abaixo' : 'Preencha os dados do pagamento'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => guardClose(onClose)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Fechar"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <form
          id="payment-form"
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

          {/* Type selector — only when creating */}
          {!isEditing && (
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
              {TYPE_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => switchType(o.value)}
                  className={[
                    'rounded-lg py-1.5 text-[11px] font-medium transition-all leading-tight',
                    paymentType === o.value
                      ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                  ].join(' ')}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}

          {/* Common: cliente + descrição */}
          <Field label={p.clientLabel}>
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

          <Field label={p.descriptionLabel}>
            <input
              type="text"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder={p.descriptionLabel}
              className={cls()}
            />
          </Field>

          {/* ── ÚNICO / EDITING ── */}
          {(isEditing || paymentType === 'unico') && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Valor *" error={errors.amount}>
                  <input
                    type="number" step="0.01" min="0"
                    value={form.amount}
                    onChange={e => setField('amount', e.target.value)}
                    placeholder="0,00"
                    className={cls(errors.amount)}
                  />
                </Field>
                <Field label={p.dueDateLabel}>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={e => setField('due_date', e.target.value)}
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
                  {PAYMENT_STATUS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>

              {form.status === 'pago' && (
                <Field label="Data de pagamento *" error={errors.paid_date}>
                  <input
                    type="date"
                    value={form.paid_date}
                    onChange={e => setField('paid_date', e.target.value)}
                    className={cls(errors.paid_date)}
                  />
                </Field>
              )}
            </>
          )}

          {/* ── PARCELADO ── */}
          {!isEditing && paymentType === 'parcelado' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Valor total *" error={errors.total_amount}>
                  <input
                    type="number" step="0.01" min="0"
                    value={form.total_amount}
                    onChange={e => setField('total_amount', e.target.value)}
                    placeholder="0,00"
                    className={cls(errors.total_amount)}
                  />
                </Field>
                <Field label="Número de parcelas *" error={errors.installments}>
                  <input
                    type="number" min="2" max="60" step="1"
                    value={form.installments}
                    onChange={e => setField('installments', e.target.value)}
                    className={cls(errors.installments)}
                  />
                </Field>
              </div>
              <Field label="Primeiro vencimento *" error={errors.first_due_date}>
                <input
                  type="date"
                  value={form.first_due_date}
                  onChange={e => setField('first_due_date', e.target.value)}
                  className={cls(errors.first_due_date)}
                />
              </Field>
            </>
          )}

          {/* ── ENTRADA + RESTANTE ── */}
          {!isEditing && paymentType === 'entrada' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Valor total *" error={errors.total_amount}>
                  <input
                    type="number" step="0.01" min="0"
                    value={form.total_amount}
                    onChange={e => setField('total_amount', e.target.value)}
                    placeholder="0,00"
                    className={cls(errors.total_amount)}
                  />
                </Field>
                <Field label="% de entrada *" error={errors.down_pct}>
                  <input
                    type="number" min="1" max="99" step="1"
                    value={form.down_pct}
                    onChange={e => setField('down_pct', e.target.value)}
                    className={cls(errors.down_pct)}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Data da entrada *" error={errors.down_date}>
                  <input
                    type="date"
                    value={form.down_date}
                    onChange={e => setField('down_date', e.target.value)}
                    className={cls(errors.down_date)}
                  />
                </Field>
                <Field label="Data do restante *" error={errors.remainder_date}>
                  <input
                    type="date"
                    value={form.remainder_date}
                    onChange={e => setField('remainder_date', e.target.value)}
                    className={cls(errors.remainder_date)}
                  />
                </Field>
              </div>
            </>
          )}

          {/* ── RECORRENTE ── */}
          {!isEditing && paymentType === 'recorrente' && (
            <>
              {/* Frequency selector */}
              <Field label="Frequência">
                <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
                  {FREQ_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setField('frequency', o.value)}
                      className={[
                        'rounded-lg py-1.5 text-[11px] font-medium transition-all leading-tight',
                        form.frequency === o.value
                          ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                      ].join(' ')}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={`${currentFreq.amountLabel} *`} error={errors.periodic_amount}>
                  <input
                    type="number" step="0.01" min="0"
                    value={form.periodic_amount}
                    onChange={e => setField('periodic_amount', e.target.value)}
                    placeholder="0,00"
                    className={cls(errors.periodic_amount)}
                  />
                </Field>
                <Field label={`${currentFreq.countLabel} *`} error={errors.num_occurrences}>
                  <input
                    type="number" min="1" max="260" step="1"
                    value={form.num_occurrences}
                    onChange={e => setField('num_occurrences', e.target.value)}
                    className={cls(errors.num_occurrences)}
                  />
                </Field>
              </div>

              <Field label="Primeiro vencimento *" error={errors.recur_start}>
                <input
                  type="date"
                  value={form.recur_start}
                  onChange={e => setField('recur_start', e.target.value)}
                  className={cls(errors.recur_start)}
                />
              </Field>
            </>
          )}

          {/* Preview — multi-record types */}
          {previewRecords.length > 0 && (
            <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
              <p className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400">
                Prévia — {previewRecords.length} pagamento{previewRecords.length !== 1 ? 's' : ''} serão criados
              </p>
              <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-44 overflow-y-auto">
                {previewRecords.map((rec, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2 text-xs">
                    {rec.installment_number && (
                      <span className="shrink-0 text-[10px] font-medium text-gray-400 bg-gray-200 dark:bg-gray-700 dark:text-gray-500 rounded px-1.5 py-0.5 tabular-nums">
                        {rec.installment_number}/{rec.total_installments}
                      </span>
                    )}
                    <span className="flex-1 text-gray-600 dark:text-gray-400 truncate">{rec.notes || '—'}</span>
                    <span className="shrink-0 text-gray-400 dark:text-gray-500">{rec.due_date ? formatDate(rec.due_date) : '—'}</span>
                    <span className="shrink-0 font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{formatCurrency(rec.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              form="payment-form"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
            >
              {saving
                ? 'Salvando…'
                : isEditing
                  ? 'Salvar alterações'
                  : previewRecords.length > 1
                    ? `Criar ${previewRecords.length} pagamentos`
                    : 'Cadastrar'}
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
