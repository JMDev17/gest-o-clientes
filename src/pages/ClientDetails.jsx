import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Pencil, FileText, CreditCard, CheckSquare, RefreshCw,
  Phone, MapPin, Tag, AlertCircle, Plus, MessageCircle,
} from 'lucide-react'
import Layout from '../components/Layout.jsx'
import ClientFormModal from '../components/clients/ClientFormModal.jsx'
import WhatsappChargeModal from '../components/whatsapp/WhatsappChargeModal.jsx'
import { useWorkspace } from '../hooks/useWorkspace.js'
import { useClients } from '../hooks/useClients.js'
import { useWhatsappLogs } from '../hooks/useWhatsappLogs.js'
import { supabase } from '../lib/supabaseClient.js'
import { formatCurrency } from '../utils/formatCurrency.js'
import { formatDateTime } from '../utils/formatDate.js'

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default function ClientDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { workspace, workspaceType } = useWorkspace()
  const { updateClient } = useClients()

  const [client, setClient]                       = useState(null)
  const [contracts, setContracts]                 = useState([])
  const [payments, setPayments]                   = useState([])
  const [tasks, setTasks]                         = useState([])
  const [loading, setLoading]                     = useState(true)
  const [error, setError]                         = useState(null)
  const [dataError, setDataError]                 = useState(null)
  const [editOpen, setEditOpen]                   = useState(false)
  const [registeringSession, setRegisteringSession] = useState(false)
  const [sessionError, setSessionError]           = useState(null)
  const [whatsappTarget, setWhatsappTarget]       = useState(null)

  const { logs: whatsappLogs, loading: logsLoading } = useWhatsappLogs(id)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)

      const [
        { data: cl,  error: e1 },
        { data: cos, error: e2 },
        { data: pys, error: e3 },
        { data: tks, error: e4 },
      ] = await Promise.all([
        supabase.from('clients').select('*').eq('id', id).single(),
        supabase.from('contracts').select('*').eq('client_id', id).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').eq('client_id', id).order('due_date', { ascending: false }),
        supabase.from('tasks').select('*').eq('client_id', id).neq('status', 'concluida').order('due_date').limit(5),
      ])

      if (!mounted) return

      if (e1) { setError('Cliente não encontrado.'); setLoading(false); return }

      setClient(cl)
      setContracts(cos || [])
      setPayments(pys || [])
      setTasks(tks || [])
      if (e2 || e3 || e4) setDataError('Alguns dados secundários não puderam ser carregados.')
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [id])

  async function handleEditClient(fields) {
    await updateClient(id, fields)
    setClient(prev => ({ ...prev, ...fields }))
  }

  async function handleRegisterSession() {
    if (!activeContract || registeringSession) return
    const done  = activeContract.completed_sessions || 0
    const total = activeContract.total_sessions || 0
    if (done >= total) return
    setRegisteringSession(true)
    setSessionError(null)
    try {
      const newDone = done + 1
      const { error: err } = await supabase
        .from('contracts')
        .update({ completed_sessions: newDone })
        .eq('id', activeContract.id)
      if (err) throw err
      setContracts(prev => prev.map(c =>
        c.id === activeContract.id ? { ...c, completed_sessions: newDone } : c
      ))
    } catch {
      setSessionError('Não foi possível registrar. Tente novamente.')
    } finally {
      setRegisteringSession(false)
    }
  }

  if (loading) {
    return (
      <Layout title="…">
        <div className="flex justify-center py-24">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
        </div>
      </Layout>
    )
  }

  if (error || !client) {
    return (
      <Layout title={workspace.client.singular}>
        <div className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-5 py-4">
          <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error || 'Cliente não encontrado.'}</p>
        </div>
      </Layout>
    )
  }

  const opt          = workspace.statusOptions.find(o => o.value === client.status)
  const badgeStyle   = opt?.style ?? 'bg-gray-100 text-gray-500 ring-gray-200'
  const badgeLabel   = opt?.label ?? client.status
  const activeContract = contracts.find(c => c.status === 'ativo')
  const cw           = workspace.contracts

  // Session info (estetica)
  const sessionsDone  = activeContract?.completed_sessions || 0
  const sessionsTotal = activeContract?.total_sessions || 0
  const sessionsLeft  = Math.max(0, sessionsTotal - sessionsDone)
  const sessionsMaxed = Boolean(activeContract) && sessionsDone >= sessionsTotal && sessionsTotal > 0
  const sessionsLow   = Boolean(activeContract) && activeContract.status === 'ativo' && sessionsLeft > 0 && sessionsLeft <= 2
  const sessionPct    = sessionsTotal > 0 ? Math.min(100, (sessionsDone / sessionsTotal) * 100) : 0

  // Financial summary (all payments)
  const totalPaid    = payments.filter(p => p.status === 'pago').reduce((s, p) => s + Number(p.amount), 0)
  const totalPending = payments.filter(p => p.status !== 'pago' && p.status !== 'cancelado').reduce((s, p) => s + Number(p.amount), 0)

  const contractSectionTitle = `${cw.itemLabel.charAt(0).toUpperCase()}${cw.itemLabel.slice(1)} ativo`

  return (
    <Layout title={client.name}>

      {/* Back */}
      <button
        onClick={() => navigate('/clients')}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-5 -ml-1 transition-colors"
      >
        <ArrowLeft size={15} strokeWidth={2} />
        {workspace.client.plural}
      </button>

      {/* Client header */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 mb-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight truncate">{client.name}</h1>
            {client.company_name && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{client.company_name}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${badgeStyle}`}>
              {badgeLabel}
            </span>
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <Pencil size={12} strokeWidth={2} />
              Editar
            </button>
          </div>
        </div>

        {(client.niche || client.city || client.whatsapp) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
            {client.niche    && <MetaRow icon={Tag}   text={client.niche} />}
            {client.city     && <MetaRow icon={MapPin} text={client.city} />}
            {client.whatsapp && <MetaRow icon={Phone}  text={client.whatsapp} />}
          </div>
        )}

        {client.notes && (
          <p className="text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3 leading-relaxed">{client.notes}</p>
        )}

        {/* Quick actions — estetica only */}
        {workspaceType === 'estetica' && (
          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 dark:border-gray-800 pt-3 mt-3">
            <button
              onClick={handleRegisterSession}
              disabled={registeringSession || !activeContract || sessionsMaxed}
              title={sessionsMaxed ? 'Todas as sessões já foram realizadas' : !activeContract ? 'Nenhum pacote ativo' : ''}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={12} strokeWidth={2.5} />
              {registeringSession ? 'Registrando…' : 'Registrar sessão'}
            </button>
            <Link
              to="/tasks"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <RefreshCw size={12} strokeWidth={2} />
              Criar retorno
            </Link>
            <Link
              to="/payments"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <CreditCard size={12} strokeWidth={2} />
              Registrar pagamento
            </Link>
            {sessionError && (
              <p className="text-xs text-red-500 w-full">{sessionError}</p>
            )}
          </div>
        )}
      </div>

      {dataError && (
        <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle size={14} className="shrink-0" />
          {dataError}
        </div>
      )}

      {/* Data sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Active contract / package */}
        <Section icon={FileText} title={contractSectionTitle} linkTo="/contracts" linkLabel="Ver todos">
          {activeContract ? (
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 truncate">{activeContract.name}</p>
              {workspaceType === 'marketing' ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(activeContract.recurring_amount)}/mês
                    {activeContract.contract_duration_months ? ` × ${activeContract.contract_duration_months} meses` : ''}
                  </p>
                  {activeContract.end_date && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Término: {fmtDate(activeContract.end_date)}</p>
                  )}
                </>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{formatCurrency(activeContract.total_value)}</p>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-gray-500 dark:text-gray-400">{sessionsDone} de {sessionsTotal} sessões realizadas</span>
                    {sessionsMaxed && <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Concluídas</span>}
                    {sessionsLow   && <span className="text-amber-600 dark:text-amber-400 font-medium">⚠ {sessionsLeft} restante{sessionsLeft !== 1 ? 's' : ''}</span>}
                    {!sessionsMaxed && !sessionsLow && sessionsLeft > 0 && (
                      <span className="text-gray-400 dark:text-gray-500">{sessionsLeft} restantes</span>
                    )}
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${sessionsMaxed ? 'bg-emerald-500' : sessionsLow ? 'bg-amber-400' : 'bg-brand-500'}`}
                      style={{ width: `${sessionPct}%` }}
                    />
                  </div>
                  {activeContract.start_date && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Início: {fmtDate(activeContract.start_date)}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum {cw.itemLabel} ativo</p>
          )}
          {contracts.length > 1 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              +{contracts.length - 1} {cw.itemLabel}{contracts.length !== 2 ? 's' : ''} anterior{contracts.length !== 2 ? 'es' : ''}
            </p>
          )}
        </Section>

        {/* Payments */}
        <Section icon={CreditCard} title="Pagamentos" linkTo="/payments" linkLabel="Ver todos">
          {workspaceType === 'estetica' && payments.length > 0 && (
            <div className="flex gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
              <FinStat label="Total pacote" value={formatCurrency(activeContract?.total_value || 0)} />
              <FinStat label="Pago" value={formatCurrency(totalPaid)} color="emerald" />
              <FinStat label="Pendente" value={formatCurrency(totalPending)} color={totalPending > 0 ? 'amber' : 'gray'} />
            </div>
          )}
          {payments.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum pagamento registrado</p>
          ) : (
            <div className="space-y-2.5">
              {payments.slice(0, 5).map(p => {
                const isOverdue = p.status === 'pendente' && p.due_date && new Date(p.due_date + 'T00:00:00') < new Date()
                const effStatus = isOverdue ? 'atrasado' : p.status
                const canCharge = effStatus === 'pendente' || effStatus === 'atrasado'
                return (
                  <div key={p.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{p.notes || '—'}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">{fmtDate(p.due_date)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{formatCurrency(p.amount)}</span>
                      <PaymentBadge status={p.status} dueDate={p.due_date} />
                      {canCharge && (
                        <button
                          onClick={() => setWhatsappTarget({ ...p, client })}
                          title="Enviar cobrança via WhatsApp"
                          className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${effStatus === 'atrasado' ? 'text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-500' : 'text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-500'}`}
                        >
                          <MessageCircle size={12} strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        {/* Tasks / Retornos */}
        <Section
          icon={workspaceType === 'estetica' ? RefreshCw : CheckSquare}
          title={workspaceType === 'estetica' ? 'Retornos pendentes' : 'Tarefas abertas'}
          linkTo="/tasks"
          linkLabel="Ver todas"
        >
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {workspaceType === 'estetica' ? 'Nenhum retorno pendente' : 'Nenhuma tarefa aberta'}
            </p>
          ) : (
            <div className="space-y-2.5">
              {tasks.map(t => (
                <div key={t.id} className="flex items-start justify-between gap-3">
                  <p className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">{t.title || t.type || '—'}</p>
                  {t.due_date && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">{fmtDate(t.due_date)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

      </div>

      {/* WhatsApp charge history */}
      <div className="mt-5">
        <Section icon={MessageCircle} title="Histórico de cobranças WhatsApp" linkTo="/payments" linkLabel="Ver pagamentos">
          {logsLoading ? (
            <div className="h-5 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          ) : whatsappLogs.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma cobrança enviada ainda.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {whatsappLogs.map(log => (
                <div key={log.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                      {log.payment?.notes
                        ? `${log.payment.notes}${log.payment.amount ? ` — ${formatCurrency(log.payment.amount)}` : ''}`
                        : 'Cobrança avulsa'}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0 tabular-nums">
                      {formatDateTime(log.created_at)}
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-2 leading-relaxed">
                    {log.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Edit modal */}
      {editOpen && (
        <ClientFormModal
          initialData={client}
          onSubmit={handleEditClient}
          onClose={() => setEditOpen(false)}
        />
      )}

      {/* WhatsApp charge modal */}
      {whatsappTarget && (
        <WhatsappChargeModal
          payment={whatsappTarget}
          clientData={client}
          onClose={() => setWhatsappTarget(null)}
        />
      )}
    </Layout>
  )
}

function Section({ icon: Icon, title, linkTo, linkLabel, children }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon size={14} strokeWidth={1.75} className="text-gray-400 dark:text-gray-500" />
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</h2>
        </div>
        <Link to={linkTo} className="text-[11px] text-brand-600 hover:text-brand-700 font-medium transition-colors">
          {linkLabel}
        </Link>
      </div>
      {children}
    </div>
  )
}

function MetaRow({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
      <Icon size={12} strokeWidth={1.75} className="shrink-0 text-gray-400 dark:text-gray-500" />
      <span>{text}</span>
    </div>
  )
}

function FinStat({ label, value, color = 'gray' }) {
  const colorMap = {
    emerald: 'text-emerald-700 dark:text-emerald-400',
    amber:   'text-amber-700 dark:text-amber-400',
    gray:    'text-gray-900 dark:text-gray-100',
  }
  return (
    <div className="flex-1 text-center">
      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
      <p className={`text-xs font-semibold mt-0.5 ${colorMap[color] ?? colorMap.gray}`}>{value}</p>
    </div>
  )
}

function PaymentBadge({ status, dueDate }) {
  const isOverdue = status === 'pendente' && dueDate && new Date(dueDate + 'T00:00:00') < new Date()
  const effective = isOverdue ? 'atrasado' : status
  const styles = {
    pago:      'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    pendente:  'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    atrasado:  'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    cancelado: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  }
  const labels = { pago: 'Pago', pendente: 'Pendente', atrasado: 'Atrasado', cancelado: 'Cancelado' }
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${styles[effective] ?? styles.cancelado}`}>
      {labels[effective] ?? status}
    </span>
  )
}
