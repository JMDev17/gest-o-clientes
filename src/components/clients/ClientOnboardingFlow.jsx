import { useState, useEffect, useMemo } from 'react'
import { X, ChevronRight, ChevronLeft, Check, User, FileText, CreditCard, ClipboardList } from 'lucide-react'
import { useWorkspace } from '../../hooks/useWorkspace.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useFormDraft } from '../../hooks/useFormDraft.js'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges.js'
import { supabase } from '../../lib/supabaseClient.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { generateSingle, generateInstallments, generateDownPayment } from '../../utils/paymentGenerators.js'
import { calcContractEndDate, generateMarketingPayments } from '../../utils/contractHelpers.js'
import DraftBanner from '../DraftBanner.jsx'

const STEP_CONFIG = [
  { n: 1, icon: User,          label: 'Cliente'     },
  { n: 2, icon: FileText,      label: 'Contrato'    },
  { n: 3, icon: CreditCard,    label: 'Pagamentos'  },
  { n: 4, icon: ClipboardList, label: 'Revisão'     },
]

const PAY_TYPES = [
  { value: 'unico',     label: 'Único'    },
  { value: 'parcelado', label: 'Parcelado'},
  { value: 'entrada',   label: 'Entrada'  },
]

function maskWhatsApp(value) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2)  return d
  if (d.length <= 7)  return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR')
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ClientOnboardingFlow({ onClose, onComplete }) {
  const { workspace, workspaceType } = useWorkspace()
  const { user } = useAuth()

  const [step, setStep] = useState(1)
  const today = new Date().toISOString().split('T')[0]

  // Step 1 — Client
  const [cf, setCf] = useState({
    name: '', company_name: '', niche: '', city: '', whatsapp: '', notes: '',
    status: workspace.statusOptions[0]?.value ?? 'ativo',
  })
  const [ce, setCe] = useState({})

  // Step 2 — Contract
  const [con, setCon] = useState(() => {
    const base = { name: '', description: '', start_date: today, end_date: '', status: 'ativo' }
    return workspaceType === 'marketing'
      ? { ...base, setup_fee: '', recurring_amount: '', contract_duration_months: 6, auto_renew: false }
      : { ...base, total_value: '', total_sessions: 10, completed_sessions: 0 }
  })
  const [coe, setCoe] = useState({})

  // Step 3 — Payments (estética config)
  const [payType, setPayType] = useState('unico')
  const [payConf, setPayConf] = useState({
    due_date: today, installments: 2, first_due_date: today,
    down_pct: 50, down_date: today, remainder_date: '',
  })

  // Step 4 — Save state
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Draft + unsaved-changes
  const [isDirty, setIsDirty] = useState(false)
  const [showBanner, setShowBanner] = useState(true)
  const draftKey = user ? `draft:onboarding:${user.id}:${workspaceType}` : null
  const draftPayload = useMemo(
    () => ({ step, cf, con, payType, payConf }),
    [step, cf, con, payType, payConf]
  )
  const { hasDraft, draftData, draftSavedAt, lastSaved, clearDraft } = useFormDraft(draftKey, draftPayload, isDirty)
  const { guardClose } = useUnsavedChanges(isDirty)

  function handleRecoverDraft() {
    if (!draftData) return
    if (draftData.cf)      setCf(draftData.cf)
    if (draftData.con)     setCon(draftData.con)
    if (draftData.payType) setPayType(draftData.payType)
    if (draftData.payConf) setPayConf(draftData.payConf)
    if (draftData.step)    setStep(draftData.step)
    setIsDirty(true)
    setShowBanner(false)
  }

  function handleDiscardDraft() {
    clearDraft()
    setShowBanner(false)
  }

  const cw = workspace.contracts
  const f  = workspace.fields

  // Auto-compute end_date for marketing contracts
  useEffect(() => {
    if (workspaceType !== 'marketing') return
    if (!con.start_date || !con.contract_duration_months) return
    setCon(prev => ({ ...prev, end_date: calcContractEndDate(prev.start_date, prev.contract_duration_months) }))
  }, [con.start_date, con.contract_duration_months, workspaceType])

  // Sync payment dates when contract start_date changes
  useEffect(() => {
    if (!con.start_date) return
    setPayConf(prev => ({
      ...prev,
      due_date:       prev.due_date       !== today ? prev.due_date       : con.start_date,
      first_due_date: prev.first_due_date !== today ? prev.first_due_date : con.start_date,
      down_date:      prev.down_date      !== today ? prev.down_date      : con.start_date,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [con.start_date])

  // Payment preview
  const paymentsPreview = useMemo(() => {
    if (workspaceType === 'marketing') {
      return generateMarketingPayments('__', con)
    }
    const amt = Number(con.total_value) || 0
    if (amt <= 0) return []
    if (payType === 'unico') {
      return generateSingle({ client_id: '__', amount: amt, due_date: payConf.due_date, status: 'pendente' })
    }
    if (payType === 'parcelado') {
      return generateInstallments({ client_id: '__', total_amount: amt, installments: payConf.installments, first_due_date: payConf.first_due_date })
    }
    if (payType === 'entrada') {
      return generateDownPayment({ client_id: '__', notes: con.name, total_amount: amt, down_pct: payConf.down_pct, down_date: payConf.down_date, remainder_date: payConf.remainder_date })
    }
    return []
  }, [workspaceType, con, payType, payConf])

  function setClientField(key, val) {
    setCf(prev => ({ ...prev, [key]: val }))
    setIsDirty(true)
    if (ce[key]) setCe(p => ({ ...p, [key]: null }))
  }
  function setContractField(key, val) {
    setCon(prev => ({ ...prev, [key]: val }))
    setIsDirty(true)
    if (coe[key]) setCoe(p => ({ ...p, [key]: null }))
  }

  function next() {
    if (step === 1) {
      const errs = {}
      if (!cf.name.trim()) errs.name = `${f.name.label} é obrigatório.`
      if (Object.keys(errs).length) { setCe(errs); return }
    }
    if (step === 2) {
      const errs = {}
      if (!con.name.trim()) errs.name = 'Nome é obrigatório.'
      if (Object.keys(errs).length) { setCoe(errs); return }
    }
    setStep(s => s + 1)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const { data: newClient, error: e1 } = await supabase
        .from('clients')
        .insert({ ...cf, user_id: user.id })
        .select()
        .single()
      if (e1) throw e1

      const clientId = newClient.id

      const totalValue = workspaceType === 'marketing'
        ? (Number(con.recurring_amount) || 0) * (Number(con.contract_duration_months) || 0)
          + (Number(con.setup_fee) || 0)
        : Number(con.total_value) || 0

      const { error: e2 } = await supabase
        .from('contracts')
        .insert({ ...con, client_id: clientId, user_id: user.id, contract_type: workspaceType, total_value: totalValue })
      if (e2) throw e2

      if (paymentsPreview.length > 0) {
        const rows = paymentsPreview.map(p => ({ ...p, client_id: clientId, user_id: user.id }))
        const { error: e3 } = await supabase.from('payments').insert(rows)
        if (e3) throw e3
      }

      clearDraft()
      setIsDirty(false)
      onComplete(clientId)
    } catch {
      setSaveError('Não foi possível salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={e => { if (e.target === e.currentTarget) guardClose(onClose) }}
    >
      <div className="w-full sm:max-w-xl bg-white sm:rounded-2xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh]">

        {/* Header */}
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              {step === 1 && `Novo ${workspace.client.singular.toLowerCase()}`}
              {step === 2 && cw.newLabel}
              {step === 3 && 'Configurar pagamentos'}
              {step === 4 && 'Revisão e confirmação'}
            </h2>
            <button
              type="button"
              onClick={() => guardClose(onClose)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center">
            {STEP_CONFIG.map((s, i) => (
              <div key={s.n} className="flex items-center flex-1 last:flex-none">
                <div className={`flex items-center gap-1.5 ${step === s.n ? 'text-brand-600' : step > s.n ? 'text-emerald-600' : 'text-gray-300'}`}>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold shrink-0 ${
                    step === s.n ? 'bg-brand-600 text-white' : step > s.n ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step > s.n ? <Check size={12} strokeWidth={2.5} /> : s.n}
                  </div>
                  <span className={`text-[11px] font-medium hidden sm:block ${
                    step === s.n ? 'text-brand-600' : step > s.n ? 'text-emerald-600' : 'text-gray-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < STEP_CONFIG.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${step > s.n ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
          {hasDraft && showBanner && step === 1 && (
            <DraftBanner
              savedAt={draftSavedAt}
              onRecover={handleRecoverDraft}
              onDiscard={handleDiscardDraft}
            />
          )}

          {step === 1 && (
            <StepClient cf={cf} ce={ce} setField={setClientField} workspace={workspace} f={f} />
          )}
          {step === 2 && (
            <StepContract con={con} coe={coe} setField={setContractField} workspaceType={workspaceType} cw={cw} />
          )}
          {step === 3 && (
            <StepPayments
              workspaceType={workspaceType}
              con={con}
              payType={payType}
              setPayType={t => { setPayType(t); setIsDirty(true) }}
              payConf={payConf}
              setPayConf={fn => { setPayConf(fn); setIsDirty(true) }}
              paymentsPreview={paymentsPreview}
            />
          )}
          {step === 4 && (
            <StepReview
              cf={cf}
              con={con}
              paymentsPreview={paymentsPreview}
              workspace={workspace}
              workspaceType={workspaceType}
              saveError={saveError}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pt-3 pb-4 border-t border-gray-100 shrink-0">
          {lastSaved && (
            <p className="text-[10px] text-gray-400 text-right mb-2">
              Rascunho salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={14} strokeWidth={2} />
              Voltar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => guardClose(onClose)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              Próximo
              <ChevronRight size={14} strokeWidth={2} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Cadastrando…' : `Cadastrar ${workspace.client.singular.toLowerCase()}`}
            </button>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 1: Client ───────────────────────────────────────────────────────────

function StepClient({ cf, ce, setField, workspace, f }) {
  return (
    <>
      <Field label={`${f.name.label} *`} error={ce.name}>
        <input
          type="text"
          value={cf.name}
          onChange={e => setField('name', e.target.value)}
          placeholder={f.name.placeholder}
          className={cls(ce.name)}
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={f.company_name.label}>
          <input type="text" value={cf.company_name}
            onChange={e => setField('company_name', e.target.value)}
            placeholder={f.company_name.placeholder} className={cls()} />
        </Field>
        <Field label={f.niche.label}>
          <input type="text" value={cf.niche}
            onChange={e => setField('niche', e.target.value)}
            placeholder={f.niche.placeholder} className={cls()} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label={f.city.label}>
          <input type="text" value={cf.city}
            onChange={e => setField('city', e.target.value)}
            placeholder={f.city.placeholder} className={cls()} />
        </Field>
        <Field label={f.whatsapp.label}>
          <input type="tel" value={cf.whatsapp}
            onChange={e => setField('whatsapp', maskWhatsApp(e.target.value))}
            placeholder="(11) 99999-9999" className={cls()} />
        </Field>
      </div>

      <Field label="Status">
        <select value={cf.status} onChange={e => setField('status', e.target.value)} className={cls()}>
          {workspace.statusOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>

      <Field label={f.notes.label}>
        <textarea value={cf.notes} onChange={e => setField('notes', e.target.value)}
          rows={2} placeholder={f.notes.placeholder} className={cls()} />
      </Field>
    </>
  )
}

// ─── Step 2: Contract ─────────────────────────────────────────────────────────

function StepContract({ con, coe, setField, workspaceType, cw }) {
  return (
    <>
      <Field label="Nome / Identificação *" error={coe.name}>
        <input
          type="text"
          value={con.name}
          onChange={e => setField('name', e.target.value)}
          placeholder={workspaceType === 'marketing' ? 'Ex: Gestão de Redes 6 Meses' : 'Ex: Pacote 10 Sessões'}
          className={cls(coe.name)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Data de Início">
          <input type="date" value={con.start_date || ''}
            onChange={e => setField('start_date', e.target.value)} className={cls()} />
        </Field>
        <Field label="Data de Término">
          <input type="date" value={con.end_date || ''}
            onChange={e => setField('end_date', e.target.value)}
            className={cls()}
            readOnly={workspaceType === 'marketing'}
          />
          {workspaceType === 'marketing' && con.end_date && (
            <p className="mt-1 text-[11px] text-gray-400">Calculado automaticamente</p>
          )}
        </Field>
      </div>

      {workspaceType === 'marketing' && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Taxa de Setup (R$)">
            <input type="number" step="0.01" value={con.setup_fee || ''}
              onChange={e => setField('setup_fee', e.target.value)} className={cls()} />
          </Field>
          <Field label={`${cw.amountLabel} (R$)`}>
            <input type="number" step="0.01" value={con.recurring_amount || ''}
              onChange={e => setField('recurring_amount', e.target.value)} className={cls()} />
          </Field>
          <Field label={cw.durationLabel}>
            <input type="number" value={con.contract_duration_months || ''}
              onChange={e => setField('contract_duration_months', e.target.value)} className={cls()} />
          </Field>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox" id="onb_auto_renew"
              checked={con.auto_renew}
              onChange={e => setField('auto_renew', e.target.checked)}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="onb_auto_renew" className="text-sm text-gray-700">Renovação automática</label>
          </div>
        </div>
      )}

      {workspaceType === 'estetica' && (
        <div className="grid grid-cols-2 gap-4">
          <Field label={`${cw.amountLabel} (R$)`}>
            <input type="number" step="0.01" value={con.total_value || ''}
              onChange={e => setField('total_value', e.target.value)} className={cls()} />
          </Field>
          <Field label={cw.durationLabel}>
            <input type="number" value={con.total_sessions || ''}
              onChange={e => setField('total_sessions', e.target.value)} className={cls()} />
          </Field>
        </div>
      )}

      <Field label="Descrição">
        <textarea value={con.description || ''} onChange={e => setField('description', e.target.value)}
          rows={2} className={cls()} />
      </Field>
    </>
  )
}

// ─── Step 3: Payments ─────────────────────────────────────────────────────────

function StepPayments({ workspaceType, con, payType, setPayType, payConf, setPayConf, paymentsPreview }) {
  const total = paymentsPreview.reduce((s, p) => s + p.amount, 0)

  function setField(key, val) { setPayConf(prev => ({ ...prev, [key]: val })) }

  if (workspaceType === 'marketing') {
    return (
      <>
        <p className="text-sm text-gray-500">
          Pagamentos gerados automaticamente com base no contrato configurado.
        </p>
        {paymentsPreview.length === 0 ? (
          <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700">
            Configure um valor recorrente no contrato para gerar pagamentos automaticamente.
          </div>
        ) : (
          <PaymentsTable rows={paymentsPreview} total={total} />
        )}
      </>
    )
  }

  const totalValue = Number(con.total_value) || 0

  return (
    <>
      {totalValue <= 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700">
          Nenhum valor configurado no pacote. Configure o valor na etapa anterior para gerar pagamentos.
        </div>
      )}

      <Field label="Forma de pagamento">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-gray-100">
          {PAY_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setPayType(t.value)}
              className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                payType === t.value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Field>

      {payType === 'unico' && (
        <Field label="Data de vencimento">
          <input type="date" value={payConf.due_date || ''}
            onChange={e => setField('due_date', e.target.value)} className={cls()} />
        </Field>
      )}

      {payType === 'parcelado' && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Número de parcelas">
            <input type="number" min={2} value={payConf.installments || ''}
              onChange={e => setField('installments', e.target.value)} className={cls()} />
          </Field>
          <Field label="Data da 1ª parcela">
            <input type="date" value={payConf.first_due_date || ''}
              onChange={e => setField('first_due_date', e.target.value)} className={cls()} />
          </Field>
        </div>
      )}

      {payType === 'entrada' && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="% de entrada">
            <input type="number" min={1} max={99} value={payConf.down_pct || ''}
              onChange={e => setField('down_pct', e.target.value)} className={cls()} />
          </Field>
          <Field label="Data da entrada">
            <input type="date" value={payConf.down_date || ''}
              onChange={e => setField('down_date', e.target.value)} className={cls()} />
          </Field>
          <Field label="Data do restante">
            <input type="date" value={payConf.remainder_date || ''}
              onChange={e => setField('remainder_date', e.target.value)} className={cls()} />
          </Field>
        </div>
      )}

      {paymentsPreview.length > 0 && totalValue > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prévia dos pagamentos</p>
          <PaymentsTable rows={paymentsPreview} total={total} />
        </>
      )}
    </>
  )
}

// ─── Step 4: Review ──────────────────────────────────────────────────────────

function StepReview({ cf, con, paymentsPreview, workspace, workspaceType, saveError }) {
  const cw = workspace.contracts
  const total = paymentsPreview.reduce((s, p) => s + p.amount, 0)
  const opt = workspace.statusOptions.find(o => o.value === cf.status)

  return (
    <>
      {saveError && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <ReviewCard title={workspace.client.singular} icon={User}>
        <ReviewRow label="Nome" value={cf.name} bold />
        {cf.company_name && <ReviewRow label={workspace.fields.company_name.label} value={cf.company_name} />}
        {cf.city        && <ReviewRow label={workspace.fields.city.label}         value={cf.city} />}
        {cf.whatsapp    && <ReviewRow label={workspace.fields.whatsapp.label}      value={cf.whatsapp} />}
        <ReviewRow label="Status" value={opt?.label ?? cf.status} />
      </ReviewCard>

      <ReviewCard title={cw.pageTitle} icon={FileText}>
        <ReviewRow label="Nome" value={con.name} bold />
        <ReviewRow label="Início" value={fmtDate(con.start_date)} />
        {con.end_date && <ReviewRow label="Término" value={fmtDate(con.end_date)} />}
        {workspaceType === 'marketing' && (
          <>
            {Number(con.setup_fee) > 0 && <ReviewRow label="Setup" value={formatCurrency(con.setup_fee)} />}
            <ReviewRow label={cw.amountLabel} value={`${formatCurrency(con.recurring_amount)}/mês`} />
            <ReviewRow label={cw.durationLabel} value={`${con.contract_duration_months} meses`} />
          </>
        )}
        {workspaceType === 'estetica' && (
          <>
            <ReviewRow label={cw.amountLabel} value={formatCurrency(con.total_value)} />
            <ReviewRow label={cw.durationLabel} value={`${con.total_sessions} sessões`} />
          </>
        )}
      </ReviewCard>

      <ReviewCard title="Pagamentos" icon={CreditCard}>
        {paymentsPreview.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum pagamento será gerado.</p>
        ) : (
          <>
            <ReviewRow label="Registros" value={`${paymentsPreview.length} pagamento${paymentsPreview.length !== 1 ? 's' : ''}`} />
            <ReviewRow label="Total" value={formatCurrency(total)} bold />
          </>
        )}
      </ReviewCard>
    </>
  )
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

function PaymentsTable({ rows, total }) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden text-xs">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2 text-gray-500 font-medium">Vencimento</th>
            <th className="text-left px-3 py-2 text-gray-500 font-medium">Descrição</th>
            <th className="text-right px-3 py-2 text-gray-500 font-medium">Valor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{fmtDate(r.due_date)}</td>
              <td className="px-3 py-2 text-gray-600 max-w-[160px] truncate">{r.notes || '—'}</td>
              <td className="px-3 py-2 text-right font-medium text-gray-900">{formatCurrency(r.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-gray-200 bg-gray-50">
          <tr>
            <td colSpan={2} className="px-3 py-2 text-gray-500 font-medium">Total</td>
            <td className="px-3 py-2 text-right font-semibold text-gray-900">{formatCurrency(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function ReviewCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} strokeWidth={1.75} className="text-gray-400" />
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function ReviewRow({ label, value, bold }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className={`text-xs text-right ${bold ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{value || '—'}</span>
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

function cls(error) {
  return [
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900',
    'placeholder-gray-300',
    'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors',
    error ? 'border-red-300' : 'border-gray-200',
  ].join(' ')
}
