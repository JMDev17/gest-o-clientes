import { useState, useMemo } from 'react'
import { Plus, FileText, TrendingUp, Calendar, AlertCircle } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import ContractFormModal from '../components/contracts/ContractFormModal.jsx'
import { useContracts } from '../hooks/useContracts.js'
import { useWorkspace } from '../hooks/useWorkspace.js'
import { formatCurrency } from '../utils/formatCurrency.js'
import { formatDateBR } from '../utils/dateHelpers.js'
import { getRemainingMonths } from '../utils/contractHelpers.js'
import StatCard from '../components/StatCard.jsx'

export default function Contracts() {
  const { workspace, workspaceType } = useWorkspace()
  const { contracts, loading, error, createContract, updateContract, deleteContract } = useContracts()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing]   = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)
  const [deleteError, setDeleteError]   = useState(null)

  const cw = workspace.contracts

  function openCreate()         { setEditing(null); setFormOpen(true) }
  function openEdit(contract)   { setEditing(contract); setFormOpen(true) }
  function closeForm()          { setFormOpen(false); setEditing(null) }

  function openDelete(contract)  { setDeleteError(null); setDeleteTarget(contract) }
  function closeDelete()        { setDeleteTarget(null); setDeleteError(null) }

  async function handleSubmit(fields) {
    if (editing) await updateContract(editing.id, fields)
    else         await createContract(fields)
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteContract(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      setDeleteError('Não foi possível excluir. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  const activeContracts = contracts.filter(c => c.status === 'ativo')
  const totalValue = activeContracts.reduce((acc, c) => acc + (Number(c.total_value) || Number(c.recurring_amount) || 0), 0)

  let remainingNumber = 0
  if (workspaceType === 'estetica') {
    remainingNumber = activeContracts.reduce((acc, c) => acc + ((c.total_sessions || 0) - (c.completed_sessions || 0)), 0)
  } else {
    remainingNumber = activeContracts.reduce((acc, c) => {
      const r = getRemainingMonths(c.start_date, c.end_date)
      return acc + (r ?? 0)
    }, 0)
  }

  return (
    <Layout title={cw.pageTitle}>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <StatCard
          label={`${cw.pageTitle} Ativos`}
          value={activeContracts.length}
          icon={FileText}
          color="blue"
        />
        <StatCard
          label={cw.totalLabel}
          value={formatCurrency(totalValue)}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          label={cw.remainingLabel}
          value={remainingNumber}
          icon={Calendar}
          color="violet"
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {!loading && `${contracts.length} registro${contracts.length !== 1 ? 's' : ''}`}
        </p>
        <button
          onClick={openCreate}
          className="shrink-0 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          {cw.newLabel}
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div role="alert" className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-5 py-4">
          <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      ) : contracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <FileText size={22} strokeWidth={1.5} className="text-gray-400 dark:text-gray-500" />
          </div>
          <p className="font-semibold text-gray-700 dark:text-gray-300">Nenhum registro encontrado</p>
          <button
            onClick={openCreate}
            className="mt-6 flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            <Plus size={15} strokeWidth={2.5} />
            {cw.newLabel}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {contracts.map(contract => {
            const sessLeft    = Math.max(0, (contract.total_sessions || 0) - (contract.completed_sessions || 0))
            const isLowSess  = workspaceType === 'estetica' && contract.status === 'ativo' && sessLeft <= 2
            const monthsLeft = workspaceType === 'marketing' ? getRemainingMonths(contract.start_date, contract.end_date) : null
            return (
            <div key={contract.id} className={`flex flex-col rounded-xl border bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow overflow-hidden ${isLowSess ? 'border-amber-300 dark:border-amber-700' : 'border-gray-200 dark:border-gray-800'}`}>
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate pr-2">{contract.name}</h3>
                  <span className={`shrink-0 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                    contract.status === 'ativo'
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {contract.status}
                  </span>
                </div>
                <p className="text-sm text-brand-600 dark:text-brand-400 font-medium mb-1 truncate">{contract.clients?.name}</p>

                {workspaceType === 'marketing' ? (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(contract.recurring_amount)}</span>
                      {' /mês • '}{contract.contract_duration_months} meses
                    </p>
                    {monthsLeft !== null && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {monthsLeft === 0 ? 'Contrato encerrado' : `${monthsLeft} meses restantes`}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{formatCurrency(contract.total_value)}</p>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-gray-500 dark:text-gray-400">{contract.completed_sessions || 0}/{contract.total_sessions || 0} sessões</span>
                      {sessLeft === 0
                        ? <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Concluídas</span>
                        : isLowSess
                          ? <span className="text-amber-600 dark:text-amber-400 font-medium">⚠ {sessLeft} restante{sessLeft !== 1 ? 's' : ''}</span>
                          : <span className="text-gray-400 dark:text-gray-500">{sessLeft} restantes</span>
                      }
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          sessLeft === 0 ? 'bg-emerald-500' : isLowSess ? 'bg-amber-400' : 'bg-brand-500'
                        }`}
                        style={{ width: `${contract.total_sessions > 0 ? Math.min(100, ((contract.completed_sessions || 0) / contract.total_sessions) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                )}
                {contract.start_date && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Início: {formatDateBR(contract.start_date)}</p>
                )}
              </div>

              <div className="grid grid-cols-2 border-t border-gray-100 dark:border-gray-800 divide-x divide-gray-100 dark:divide-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <button
                  onClick={() => openEdit(contract)}
                  className="py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => openDelete(contract)}
                  className="py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          )})}
        </div>
      )}

      {formOpen && (
        <ContractFormModal
          initialData={editing}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={e => { if (e.target === e.currentTarget) closeDelete() }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Excluir {cw.itemLabel}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
              Tem certeza que deseja excluir <span className="font-semibold">{deleteTarget.name}</span>?
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Esta ação não pode ser desfeita.</p>

            {deleteError && (
              <p role="alert" className="mb-4 text-sm text-red-500">{deleteError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeDelete}
                disabled={deleting}
                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {deleting ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  )
}
