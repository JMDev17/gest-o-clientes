import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import ClientFilters from '../components/clients/ClientFilters.jsx'
import ClientList from '../components/clients/ClientList.jsx'
import ClientFormModal from '../components/clients/ClientFormModal.jsx'
import { useClients } from '../hooks/useClients.js'
import { useWorkspace } from '../hooks/useWorkspace.js'

export default function Clients() {
  const { workspace } = useWorkspace()
  const { clients, loading, error, createClient, updateClient, deleteClient } = useClients()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort]     = useState('name')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing]   = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)
  const [deleteError, setDeleteError]   = useState(null)

  const c = workspace.client

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    let result = clients.filter(cl => {
      const matchSearch = !q || [cl.name, cl.company_name, cl.whatsapp]
        .some(v => v?.toLowerCase().includes(q))
      const matchStatus = !status || cl.status === status
      return matchSearch && matchStatus
    })

    return sort === 'name'
      ? [...result].sort((a, b) => a.name.localeCompare(b.name, 'pt'))
      : [...result].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [clients, search, status, sort])

  const hasActiveFilters = search.trim() !== '' || status !== ''

  function openCreate()       { setEditing(null); setFormOpen(true) }
  function openEdit(client)   { setEditing(client); setFormOpen(true) }
  function closeForm()        { setFormOpen(false); setEditing(null) }

  function openDelete(client) { setDeleteError(null); setDeleteTarget(client) }
  function closeDelete()      { setDeleteTarget(null); setDeleteError(null) }

  async function handleSubmit(fields) {
    if (editing) await updateClient(editing.id, fields)
    else         await createClient(fields)
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteClient(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      setDeleteError('Não foi possível excluir. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  const countLabel = !loading
    ? `${filtered.length} ${filtered.length === 1 ? c.singular.toLowerCase() : c.plural.toLowerCase()}${hasActiveFilters ? ` encontrado${filtered.length !== 1 ? 's' : ''}` : ''}`
    : null

  return (
    <Layout title={c.plural}>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <p className="text-sm text-gray-400 dark:text-gray-500 min-w-0 truncate">{countLabel}</p>
        <button
          onClick={openCreate}
          className="shrink-0 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          {c.newLabel}
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-5">
        <ClientFilters
          search={search} onSearch={setSearch}
          status={status} onStatus={setStatus}
          sort={sort}     onSort={setSort}
        />
      </div>

      {/* Lista */}
      <ClientList
        clients={filtered}
        loading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        onEdit={openEdit}
        onDelete={openDelete}
        onNew={openCreate}
      />

      {/* Modal: criar / editar cliente */}
      {formOpen && (
        <ClientFormModal
          initialData={editing}
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
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Excluir {c.singular.toLowerCase()}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
              Tem certeza que deseja excluir{' '}
              <span className="font-semibold">{deleteTarget.name}</span>?
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
              Pagamentos e tarefas vinculados também serão removidos.
            </p>

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
