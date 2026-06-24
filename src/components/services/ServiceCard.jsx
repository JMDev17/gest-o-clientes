import { useState } from 'react'
import { Pencil, Trash2, Clock, Layers } from 'lucide-react'
import { CATEGORY_STYLE, categoryLabel, formatBRL } from '../../utils/serviceCatalog.js'

export default function ServiceCard({ service, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]           = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete(service.id)
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const price      = formatBRL(service.price)
  const promoPrice = formatBRL(service.promo_price)
  const catStyle   = CATEGORY_STYLE[service.category] ?? 'bg-gray-100 text-gray-500 ring-gray-200'
  const isInativo  = service.status === 'inativo'

  return (
    <div className={[
      'rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex flex-col transition-all',
      isInativo ? 'opacity-60' : '',
    ].join(' ')}>

      {/* Body */}
      <div className="px-4 pt-4 pb-3 flex-1">

        {/* Badges */}
        <div className="flex items-center flex-wrap gap-1.5 mb-2.5">
          {service.category && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${catStyle}`}>
              {categoryLabel(service.category)}
            </span>
          )}
          {isInativo && (
            <span className="rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 ring-gray-200 dark:ring-gray-700">
              Inativo
            </span>
          )}
        </div>

        {/* Name */}
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1 leading-snug">{service.name}</p>

        {/* Description */}
        {service.description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 mb-2.5">{service.description}</p>
        )}

        {/* Meta: sessions + duration */}
        {(service.sessions_count || service.duration_minutes) && (
          <div className="flex items-center gap-3 mb-2.5">
            {service.sessions_count && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Layers size={11} strokeWidth={2} />
                {service.sessions_count} {service.sessions_count === 1 ? 'sessão' : 'sessões'}
              </span>
            )}
            {service.duration_minutes && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Clock size={11} strokeWidth={2} />
                {service.duration_minutes} min
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="space-y-0.5">
          {price ? (
            <p className={[
              'text-base font-bold tabular-nums',
              promoPrice ? 'text-gray-400 line-through text-sm' : 'text-gray-900 dark:text-white',
            ].join(' ')}>
              {price}
            </p>
          ) : (
            <p className="text-xs text-gray-300 dark:text-gray-600 italic">Sem valor definido</p>
          )}
          {promoPrice && (
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{promoPrice}</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-gray-800">
        {confirmDelete ? (
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-red-600 dark:text-red-400 font-medium flex-1">Excluir este serviço?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded px-2.5 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 disabled:opacity-50 transition-colors"
            >
              {deleting ? '…' : 'Sim'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="rounded px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Não
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => onEdit(service)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="Editar"
            >
              <Pencil size={13} strokeWidth={2} />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
              title="Excluir"
            >
              <Trash2 size={13} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
