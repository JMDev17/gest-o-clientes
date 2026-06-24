import { Search, X } from 'lucide-react'
import { useWorkspace } from '../../hooks/useWorkspace.js'

export default function ClientFilters({ search, onSearch, status, onStatus, sort, onSort }) {
  const { workspace } = useWorkspace()

  return (
    <div className="flex flex-col sm:flex-row gap-2.5">
      <div className="relative flex-1">
        <Search
          size={14}
          strokeWidth={2}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Buscar por nome, empresa ou WhatsApp…"
          className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-600"
        />
        {search && (
          <button
            onClick={() => onSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Limpar busca"
          >
            <X size={14} strokeWidth={2} />
          </button>
        )}
      </div>

      <select
        value={status}
        onChange={e => onStatus(e.target.value)}
        className="py-2 pl-3 pr-8 text-sm rounded-lg border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
      >
        <option value="">Todos os status</option>
        {workspace.statusOptions.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        value={sort}
        onChange={e => onSort(e.target.value)}
        className="py-2 pl-3 pr-8 text-sm rounded-lg border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
      >
        <option value="name">Nome A–Z</option>
        <option value="created_at">Mais recentes</option>
      </select>
    </div>
  )
}
