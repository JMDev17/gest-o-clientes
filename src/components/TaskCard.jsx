// Placeholder — será implementado junto com o CRUD de tarefas

export default function TaskCard({ task }) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm border border-gray-100 dark:border-gray-800">
      <p className="font-medium text-gray-800 dark:text-gray-200">{task?.title ?? 'Tarefa'}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{task?.due_date ?? '—'}</p>
    </div>
  )
}
