import { Plus, AlertCircle, Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { useWorkspace } from '../../hooks/useWorkspace.js'
import { TASK_STATUS, TASK_PRIORITY, effectiveTaskStatus } from '../../hooks/useTasks.js'
import { formatDate } from '../../utils/formatDate.js'

const EFFECTIVE_STATUS = [
  ...TASK_STATUS,
  { value: 'atrasada', label: 'Atrasada', style: 'bg-red-50 text-red-700 ring-red-200' },
]

export default function TaskList({
  tasks,
  loading,
  error,
  hasActiveFilters,
  onEdit,
  onDelete,
  onNew,
  onToggleDone,
}) {
  const { workspace } = useWorkspace()
  const t = workspace.tasks

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-5 py-4">
        <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (tasks.length === 0) {
    return hasActiveFilters ? (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-semibold text-gray-700 dark:text-gray-300">Nenhuma tarefa encontrada</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente ajustar os filtros.</p>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <Plus size={22} strokeWidth={1.5} className="text-gray-400 dark:text-gray-500" />
        </div>
        <p className="font-semibold text-gray-700 dark:text-gray-300">Nenhuma tarefa cadastrada</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-6">Comece criando sua primeira tarefa.</p>
        <button
          onClick={onNew}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          {t.newLabel}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map(task => (
        <TaskRow
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleDone={onToggleDone}
        />
      ))}
    </div>
  )
}

function TaskRow({ task, onEdit, onDelete, onToggleDone }) {
  const { workspace } = useWorkspace()
  const t = workspace.tasks

  const effStatus   = effectiveTaskStatus(task)
  const statusInfo  = EFFECTIVE_STATUS.find(s => s.value === effStatus)
  const priorityInfo = TASK_PRIORITY.find(p => p.value === task.priority)

  const isDone = task.status === 'concluida'
  const typeLabel = t.types.find(o => o.value === task.type)?.label ?? task.type

  return (
    <div className={[
      'flex items-start gap-4 rounded-xl bg-white dark:bg-gray-900 border px-5 py-4',
      'hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm transition-all',
      isDone ? 'border-gray-100 dark:border-gray-800 opacity-60' : 'border-gray-200 dark:border-gray-800',
    ].join(' ')}>

      {/* Toggle concluída */}
      <button
        onClick={() => onToggleDone(task)}
        className="shrink-0 mt-0.5 text-gray-300 dark:text-gray-600 hover:text-brand-500 transition-colors"
        title={isDone ? 'Marcar como pendente' : 'Marcar como concluída'}
      >
        {isDone
          ? <CheckCircle2 size={18} strokeWidth={1.75} className="text-emerald-500" />
          : <Circle size={18} strokeWidth={1.75} />
        }
      </button>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-sm font-medium leading-snug ${isDone ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
              {task.title}
            </p>
            {task.client?.name && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{task.client.name}</p>
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1 shrink-0">
            <ActionBtn onClick={() => onEdit(task)} icon={Pencil} label="Editar" />
            <ActionBtn onClick={() => onDelete(task)} icon={Trash2} label="Excluir" danger />
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {statusInfo && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${statusInfo.style}`}>
              {statusInfo.label}
            </span>
          )}
          {priorityInfo && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${priorityInfo.style}`}>
              {priorityInfo.label}
            </span>
          )}
          {typeLabel && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{typeLabel}</span>
          )}
          {task.due_date && (
            <span className={`text-xs ${effStatus === 'atrasada' ? 'text-red-500 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
              {t.dueDateLabel}: {formatDate(task.due_date)}
            </span>
          )}
        </div>

        {task.description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>
    </div>
  )
}

function ActionBtn({ onClick, icon: Icon, label, danger = false }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={[
        'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
        danger
          ? 'text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30'
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200',
      ].join(' ')}
    >
      <Icon size={13} strokeWidth={2} />
    </button>
  )
}
