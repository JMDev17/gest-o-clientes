import { Link } from 'react-router-dom'
import { ImageOff } from 'lucide-react'

export default function ContentPendingWidget({ clientsWithoutContent }) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Conteúdo pendente</p>
        <Link to="/content" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
          Ver conteúdo →
        </Link>
      </div>

      {clientsWithoutContent.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4">Todos os clientes ativos têm plano de conteúdo.</p>
      )}

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {clientsWithoutContent.map(c => (
          <div key={c.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Sem plano de conteúdo cadastrado</p>
            </div>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red-50 dark:bg-red-900/30">
              <ImageOff size={12} strokeWidth={2} className="text-red-400 dark:text-red-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
