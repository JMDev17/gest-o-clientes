import { useState, useEffect, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import ContentWeeklySummary from '../components/content/ContentWeeklySummary.jsx'
import ContentFilters from '../components/content/ContentFilters.jsx'
import ContentClientCard from '../components/content/ContentClientCard.jsx'
import ContentPlanForm from '../components/content/ContentPlanForm.jsx'
import ContentQuickLogModal from '../components/content/ContentQuickLogModal.jsx'
import ContentHistoryModal from '../components/content/ContentHistoryModal.jsx'
import { useContentTracking } from '../hooks/useContentTracking.js'
import { useClients } from '../hooks/useClients.js'
import { useWorkspace } from '../hooks/useWorkspace.js'
import {
  getWeekBounds,
  formatWeekLabel,
  computeWeekStatus,
  computeMetrics,
  STATUS_CONFIG,
} from '../utils/contentTracking.js'

export default function ContentTracking() {
  const { workspaceType } = useWorkspace()
  const { clients }       = useClients()
  const {
    plans, logs, loadingPlans, loadingLogs, error,
    fetchLogs, savePlan,
    createMultipleLogs, updateLog, deleteLog,
  } = useContentTracking()

  // All hooks must come before any conditional return
  const [weekOffset,    setWeekOffset]    = useState(0)
  const [clientFilter,  setClientFilter]  = useState('')
  const [statusFilter,  setStatusFilter]  = useState('')
  const [quickLogModal, setQuickLogModal] = useState({ open: false, client: null })
  const [historyModal,  setHistoryModal]  = useState({ open: false, client: null })
  const [planModal,     setPlanModal]     = useState({ open: false, client: null, plan: null })

  const weekBounds = useMemo(() => getWeekBounds(weekOffset), [weekOffset])

  useEffect(() => {
    fetchLogs(weekBounds.startStr, weekBounds.endStr)
  }, [weekBounds.startStr, weekBounds.endStr]) // eslint-disable-line

  const allClientsData = useMemo(() => {
    const planClientIds = new Set(plans.map(p => p.client_id))

    const fromPlans = plans
      .filter(p => p.is_active)
      .map(plan => {
        const clientLogs = logs.filter(l => l.client_id === plan.client_id)
        return {
          client:  plan.client,
          plan,
          logs:    clientLogs,
          status:  computeWeekStatus(plan, clientLogs, weekOffset),
          metrics: computeMetrics(plan, clientLogs),
        }
      })

    const unplanned = logs
      .filter(l => !planClientIds.has(l.client_id))
      .reduce((acc, l) => {
        if (!acc.has(l.client_id)) acc.set(l.client_id, l.client)
        return acc
      }, new Map())

    const fromLogs = [...unplanned.entries()].map(([clientId, client]) => ({
      client,
      plan:    null,
      logs:    logs.filter(l => l.client_id === clientId),
      status:  'sem_plano',
      metrics: [],
    }))

    return [...fromPlans, ...fromLogs].sort(
      (a, b) =>
        (STATUS_CONFIG[a.status]?.sortOrder ?? 9) -
        (STATUS_CONFIG[b.status]?.sortOrder ?? 9)
    )
  }, [plans, logs, weekOffset])

  const clientsWithoutPlan = useMemo(() => {
    const planClientIds = new Set(plans.map(p => p.client_id))
    return clients.filter(c => !planClientIds.has(c.id))
  }, [clients, plans])

  const filteredClientsData = useMemo(() =>
    allClientsData.filter(d => {
      const matchClient = !clientFilter || d.client?.id === clientFilter
      const matchStatus = !statusFilter || d.status  === statusFilter
      return matchClient && matchStatus
    }),
  [allClientsData, clientFilter, statusFilter])

  if (workspaceType !== 'marketing') return <Navigate to="/dashboard" replace />

  const hasActiveFilters = clientFilter !== '' || statusFilter !== ''
  const loading          = loadingPlans || loadingLogs
  const isCurrentWeek    = weekOffset === 0

  // ── handlers ────────────────────────────────────────────────────────────────

  function openQuickLog(client) {
    setQuickLogModal({ open: true, client: client ?? null })
  }

  function openHistory(client) {
    setHistoryModal({ open: true, client })
  }

  function openPlanModal(client, plan) {
    setPlanModal({ open: true, client, plan })
  }

  async function handleQuickLogSubmit(fields) {
    await createMultipleLogs(fields)
  }

  async function handleSavePlan(clientId, fields) {
    await savePlan(clientId, fields)
  }

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <Layout title="Conteúdo">

      {/* Week navigation + action button */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <div className="text-center min-w-[130px]">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatWeekLabel(weekBounds)}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">{isCurrentWeek ? 'Semana atual' : 'Semana anterior'}</p>
          </div>
          <button
            onClick={() => setWeekOffset(o => Math.min(0, o + 1))}
            disabled={isCurrentWeek}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>

        <button
          onClick={() => openQuickLog(null)}
          className="shrink-0 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          Registrar conteúdo
        </button>
      </div>

      {/* Summary cards */}
      <ContentWeeklySummary clientsData={allClientsData} />

      {/* Filters */}
      <div className="mb-5">
        <ContentFilters
          clientId={clientFilter} onClient={setClientFilter}
          status={statusFilter}   onStatus={setStatusFilter}
          clients={clients}
        />
      </div>

      {/* Client cards */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : filteredClientsData.length === 0 ? (
        hasActiveFilters ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="font-semibold text-gray-700 dark:text-gray-300">Nenhum cliente encontrado</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente ajustar os filtros.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="font-semibold text-gray-700 dark:text-gray-300">Nenhum cliente monitorado</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Configure um plano de conteúdo para começar a acompanhar.
            </p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClientsData.map(d => (
            <ContentClientCard
              key={d.client?.id ?? 'unknown'}
              client={d.client}
              plan={d.plan}
              logs={d.logs}
              status={d.status}
              onRegister={openQuickLog}
              onEditPlan={openPlanModal}
              onHistory={openHistory}
            />
          ))}
        </div>
      )}

      {/* Clients without plans */}
      {!hasActiveFilters && !loading && clientsWithoutPlan.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
            Clientes sem plano configurado
          </p>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
            {clientsWithoutPlan.map(c => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                  {c.company_name && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{c.company_name}</p>
                  )}
                </div>
                <button
                  onClick={() => openPlanModal(c, null)}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Plus size={12} strokeWidth={2.5} />
                  Configurar plano
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {quickLogModal.open && (
        <ContentQuickLogModal
          prefilledClient={quickLogModal.client}
          clients={clients}
          onSubmit={handleQuickLogSubmit}
          onClose={() => setQuickLogModal({ open: false, client: null })}
        />
      )}

      {historyModal.open && (
        <ContentHistoryModal
          client={historyModal.client}
          clientLogs={allClientsData.find(d => d.client?.id === historyModal.client?.id)?.logs ?? []}
          weekBounds={weekBounds}
          updateLog={updateLog}
          deleteLog={deleteLog}
          onClose={() => setHistoryModal({ open: false, client: null })}
        />
      )}

      {planModal.open && (
        <ContentPlanForm
          initialPlan={planModal.plan}
          prefilledClient={planModal.client}
          clients={clients}
          onSubmit={handleSavePlan}
          onClose={() => setPlanModal({ open: false, client: null, plan: null })}
        />
      )}

    </Layout>
  )
}
