import { Phone, MapPin, Tag, CalendarDays, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWorkspace } from '../hooks/useWorkspace.js'
import { formatDate } from '../utils/formatDate.js'

export default function ClientCard({ client, onEdit, onDelete }) {
  const { workspace } = useWorkspace()

  const opt = workspace.statusOptions.find(o => o.value === client.status)
  const badgeStyle = opt?.style ?? 'bg-gray-100 text-gray-500 ring-gray-200'
  const badgeLabel = opt?.label ?? client.status

  return (
    <div className="flex flex-col rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 gap-3 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm transition-all">

      {/* Nome + badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/clients/${client.id}`}
            className="font-semibold text-gray-900 dark:text-white leading-snug truncate hover:text-brand-600 dark:hover:text-brand-400 transition-colors block"
          >
            {client.name}
          </Link>
          {client.company_name && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{client.company_name}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${badgeStyle}`}
        >
          {badgeLabel}
        </span>
      </div>

      {/* Meta */}
      {(client.niche || client.city || client.whatsapp) && (
        <div className="space-y-1.5">
          {client.niche && (
            <MetaRow icon={Tag} text={client.niche} />
          )}
          {client.city && (
            <MetaRow icon={MapPin} text={client.city} />
          )}
          {client.whatsapp && (
            <MetaRow icon={Phone} text={client.whatsapp} />
          )}
        </div>
      )}

      {/* Observações */}
      {client.notes && (
        <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed line-clamp-2 border-t border-gray-100 dark:border-gray-800 pt-3">
          {client.notes}
        </p>
      )}

      {/* Footer: data + ações */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 mt-auto">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
          <CalendarDays size={11} strokeWidth={1.75} className="shrink-0" />
          <span>{formatDate(client.created_at)}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(client)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <Pencil size={12} strokeWidth={2} />
            Editar
          </button>
          <button
            onClick={() => onDelete(client)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 size={12} strokeWidth={2} />
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

function MetaRow({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <Icon size={12} strokeWidth={1.75} className="shrink-0 text-gray-400 dark:text-gray-500" />
      <span className="truncate">{text}</span>
    </div>
  )
}
