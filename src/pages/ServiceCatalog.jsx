import { useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import ServiceFilters from '../components/services/ServiceFilters.jsx'
import ServiceCard from '../components/services/ServiceCard.jsx'
import ServiceFormModal from '../components/services/ServiceFormModal.jsx'
import { useServiceCatalog } from '../hooks/useServiceCatalog.js'
import { useWorkspace } from '../hooks/useWorkspace.js'

export default function ServiceCatalog() {
  const { workspaceType } = useWorkspace()
  const { services, loading, error, createService, updateService, deleteService } = useServiceCatalog()

  // All hooks before conditional return
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('')
  const [status,   setStatus]   = useState('')
  const [modal, setModal]       = useState({ open: false, service: null })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return services.filter(s => {
      const matchSearch   = !q        || s.name.toLowerCase().includes(q)
      const matchCategory = !category || s.category === category
      const matchStatus   = !status   || s.status   === status
      return matchSearch && matchCategory && matchStatus
    })
  }, [services, search, category, status])

  if (workspaceType !== 'estetica') return <Navigate to="/dashboard" replace />

  const hasFilters = search !== '' || category !== '' || status !== ''

  function openCreate() { setModal({ open: true, service: null }) }
  function openEdit(s)  { setModal({ open: true, service: s }) }
  function closeModal() { setModal({ open: false, service: null }) }

  async function handleSubmit(fields) {
    if (modal.service) {
      await updateService(modal.service.id, fields)
    } else {
      await createService(fields)
    }
  }

  return (
    <Layout title="Serviços e Procedimentos">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Serviços e Procedimentos</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Catálogo de serviços e valores da clínica</p>
        </div>
        <button
          onClick={openCreate}
          className="shrink-0 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          Novo serviço
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5">
        <ServiceFilters
          search={search}     onSearch={setSearch}
          category={category} onCategory={setCategory}
          status={status}     onStatus={setStatus}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-5 py-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        hasFilters ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="font-semibold text-gray-700 dark:text-gray-300">Nenhum serviço encontrado</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente ajustar os filtros ou a busca.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="font-semibold text-gray-700 dark:text-gray-300">Catálogo vazio</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-4">
              Cadastre os serviços e procedimentos da clínica para consultar valores rapidamente.
            </p>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              <Plus size={15} strokeWidth={2.5} />
              Novo serviço
            </button>
          </div>
        )
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">
            {filtered.length} {filtered.length === 1 ? 'serviço' : 'serviços'}
            {hasFilters ? ' encontrado' + (filtered.length !== 1 ? 's' : '') : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => (
              <ServiceCard
                key={s.id}
                service={s}
                onEdit={openEdit}
                onDelete={deleteService}
              />
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {modal.open && (
        <ServiceFormModal
          initialData={modal.service}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}

    </Layout>
  )
}
