export default function DraftBanner({ savedAt, onRecover, onDiscard }) {
  const time = savedAt
    ? new Date(savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/50 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-brand-800 dark:text-brand-300">Rascunho encontrado</p>
        {time && <p className="text-xs text-brand-600 dark:text-brand-400 mt-0.5">Salvo às {time}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onDiscard}
          className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-200 transition-colors"
        >
          Descartar
        </button>
        <button
          type="button"
          onClick={onRecover}
          className="text-xs font-semibold bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
        >
          Recuperar
        </button>
      </div>
    </div>
  )
}
