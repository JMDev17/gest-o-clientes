import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import TaskSummaryCards from '../components/tasks/TaskSummaryCards.jsx'
import TaskFilters from '../components/tasks/TaskFilters.jsx'
import TaskList from '../components/tasks/TaskList.jsx'
import TaskFormModal from '../components/tasks/TaskFormModal.jsx'
import { useTasks, effectiveTaskStatus } from '../hooks/useTasks.js'
import { useClients } from '../hooks/useClients.js'
import { useWorkspace } from '../hooks/useWorkspace.js'
import { todayISO } from '../utils/dateHelpers.js'

function todayKey() {
  return todayISO()
}

function endOfWeek() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  d.setDate(d.getDate() + (6 - d.getDay()))
  return d
}

function startOfWeek() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function Tasks() {
  const { workspace } = useWorkspace()
  const { tasks, loading, error, createTask, updateTask, deleteTask } = useTasks()
  const { clients } = useClients()

  const [statusFilter,   setStatusFilter]   = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [clientFilter,   setClientFilter]   = useState('')
  const [typeFilter,     setTypeFilter]     = useState('')
  const [periodFilter,   setPeriodFilter]   = useState('todas')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing]   = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)
  const [deleteError, setDeleteError]   = useState(null)

  const t = workspace.tasks

  const filtered = useMemo(() => {
    const today    = todayKey()
    const month    = currentMonthKey()
    const weekEnd  = endOfWeek()
    const weekBeg  = startOfWeek()

    return tasks.filter(task => {
      const effStatus = effectiveTaskStatus(task)

      const matchStatus = !statusFilter || effStatus === statusFilter

      const matchPriority = !priorityFilter || task.priority === priorityFilter

      const matchClient = !clientFilter || task.client_id === clientFilter

      const matchType = !typeFilter || task.type === typeFilter

      const matchPeriod = (() => {
        if (periodFilter === 'todas') return true
        if (periodFilter === 'atrasadas') return effStatus === 'atrasada'
        if (!task.due_date) return false
        const due = new Date(task.due_date + 'T00:00:00')
        if (periodFilter === 'hoje')        return task.due_date === today
        if (periodFilter === 'esta_semana') return due >= weekBeg && due <= weekEnd
        if (periodFilter === 'este_mes')    return task.due_date.startsWith(month)
        return true
      })()

      return matchStatus && matchPriority && matchClient && matchType && matchPeriod
    })
  }, [tasks, statusFilter, priorityFilter, clientFilter, typeFilter, periodFilter])

  const hasActiveFilters =
    statusFilter !== '' || priorityFilter !== '' ||
    clientFilter !== '' || typeFilter    !== '' ||
    periodFilter !== 'todas'

  function openCreate()      { setEditing(null); setFormOpen(true) }
  function openEdit(task)    { setEditing(task); setFormOpen(true) }
  function closeForm()       { setFormOpen(false); setEditing(null) }

  function openDelete(task)  { setDeleteError(null); setDeleteTarget(task) }
  function closeDelete()     { setDeleteTarget(null); setDeleteError(null) }

  async function handleSubmit(fields) {
    if (editing) await updateTask(editing.id, fields)
    else         await createTask(fields)
  }

  async function handleToggleDone(task) {
    const next = task.status === 'concluida' ? 'pendente' : 'concluida'
    await updateTask(task.id, { status: next })
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteTask(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      setDeleteError('Não foi possível excluir. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Layout title={t.pageTitle}>

      {/* Resumo */}
      <TaskSummaryCards tasks={tasks} />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {!loading && `${filtered.length} tarefa${filtered.length !== 1 ? 's' : ''}`}
        </p>
        <button
          onClick={openCreate}
          className="shrink-0 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          {t.newLabel}
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-5">
        <TaskFilters
          status={statusFilter}     onStatus={setStatusFilter}
          priority={priorityFilter} onPriority={setPriorityFilter}
          clientId={clientFilter}   onClient={setClientFilter}
          type={typeFilter}         onType={setTypeFilter}
          period={periodFilter}     onPeriod={setPeriodFilter}
          clients={clients}
        />
      </div>

      {/* Lista */}
      <TaskList
        tasks={filtered}
        loading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        onEdit={openEdit}
        onDelete={openDelete}
        onNew={openCreate}
        onToggleDone={handleToggleDone}
      />

      {/* Modal: formulário */}
      {formOpen && (
        <TaskFormModal
          initialData={editing}
          clients={clients}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      )}

      {/* Modal: confirmar exclusão */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={e => { if (e.target === e.currentTarget) closeDelete() }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Excluir tarefa</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
              Tem certeza que deseja excluir{' '}
              <span className="font-semibold">"{deleteTarget.title}"</span>?
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
