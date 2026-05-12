import { Plus, AlertCircle } from 'lucide-react'
import ClientCard from '../ClientCard.jsx'
import { useWorkspace } from '../../hooks/useWorkspace.js'

export default function ClientList({
  clients,
  loading,
  error,
  hasActiveFilters,
  onEdit,
  onDelete,
  onNew,
}) {
  const { workspace } = useWorkspace()
  const c = workspace.client

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-5 py-4"
      >
        <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (clients.length === 0) {
    return hasActiveFilters ? (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-semibold text-gray-700 dark:text-gray-300">Nenhum resultado encontrado</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente ajustar os filtros ou a busca.</p>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <Plus size={22} strokeWidth={1.5} className="text-gray-400 dark:text-gray-500" />
        </div>
        <p className="font-semibold text-gray-700 dark:text-gray-300">
          Nenhum {c.singular.toLowerCase()} cadastrado
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-6">
          Comece adicionando{' '}
          {c.singular === 'Paciente' ? 'uma' : 'um'} {c.singular.toLowerCase()}.
        </p>
        <button
          onClick={onNew}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          {c.newLabel}
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {clients.map(client => (
        <ClientCard
          key={client.id}
          client={client}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
