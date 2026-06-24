import { useState } from 'react'
import { X, Plus, Trash2, Tag } from 'lucide-react'

const PRESET_COLORS = [
  '#8b5cf6','#6366f1','#3b82f6','#06b6d4','#10b981',
  '#f59e0b','#f97316','#ef4444','#ec4899','#14b8a6',
  '#84cc16','#6b7280',
]

function cls(error) {
  return [
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900',
    'placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors',
    'dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-600',
    error ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700',
  ].join(' ')
}

export default function CategoryManagerModal({
  companyCategories = [],
  personalCategories = [],
  onCreateCategory,
  onDeleteCategory,
  onClose,
}) {
  const [activeScope, setActiveScope] = useState('company')
  const [newName, setNewName]         = useState('')
  const [newColor, setNewColor]       = useState(PRESET_COLORS[0])
  const [saving, setSaving]           = useState(false)
  const [nameError, setNameError]     = useState(null)
  const [deletingId, setDeletingId]   = useState(null)
  const [confirmId, setConfirmId]     = useState(null)

  const categories = activeScope === 'company' ? companyCategories : personalCategories

  async function handleAdd() {
    if (!newName.trim()) { setNameError('Informe o nome da categoria.'); return }
    setSaving(true)
    try {
      await onCreateCategory({ scope: activeScope, name: newName.trim(), color: newColor })
      setNewName('')
      setNewColor(PRESET_COLORS[0])
      setNameError(null)
    } catch {
      setNameError('Não foi possível criar a categoria.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    setDeletingId(id)
    try {
      await onDeleteCategory(id)
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full sm:max-w-lg bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
              <Tag size={16} className="text-gray-500 dark:text-gray-400" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Gerenciar Categorias</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-colors"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Scope switcher */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
            {[{ v: 'company', l: 'Empresa' }, { v: 'personal', l: 'Pessoal' }].map(({ v, l }) => (
              <button
                key={v}
                onClick={() => { setActiveScope(v); setNewName(''); setNameError(null) }}
                className={[
                  'flex-1 rounded-lg py-1.5 text-xs font-medium transition-all',
                  activeScope === v
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                ].join(' ')}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Category list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-1">
            {categories.map(cat => (
              <div
                key={cat.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
              >
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{cat.name}</span>
                {cat.is_system && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">sistema</span>
                )}
                {!cat.is_system && (
                  confirmId === cat.id
                    ? (
                      <span className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDelete(cat.id)}
                          disabled={deletingId === cat.id}
                          className="text-[10px] font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {deletingId === cat.id ? '…' : 'Confirmar'}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-[10px] text-gray-400 hover:text-gray-600"
                        >
                          Cancelar
                        </button>
                      </span>
                    )
                    : (
                      <button
                        onClick={() => setConfirmId(cat.id)}
                        className="flex h-6 w-6 items-center justify-center rounded text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        title="Excluir categoria"
                      >
                        <Trash2 size={12} />
                      </button>
                    )
                )}
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-center text-gray-400 dark:text-gray-500 py-4">Nenhuma categoria</p>
            )}
          </div>
        </div>

        {/* Add new category */}
        <div className="px-6 pt-4 pb-5 border-t border-gray-100 dark:border-gray-800 shrink-0 space-y-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Nova categoria
          </p>

          {/* Color picker */}
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setNewColor(color)}
                className={[
                  'h-6 w-6 rounded-full transition-all',
                  newColor === color ? 'ring-2 ring-offset-2 ring-brand-600 dark:ring-offset-gray-900 scale-110' : '',
                ].join(' ')}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={newName}
                onChange={e => { setNewName(e.target.value); setNameError(null) }}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Nome da categoria"
                className={cls(nameError)}
              />
              {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors shrink-0"
            >
              <Plus size={15} />
              {saving ? '…' : 'Criar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
