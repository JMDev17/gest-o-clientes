import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import PaymentSummaryCards from '../components/payments/PaymentSummaryCards.jsx'
import PaymentFilters from '../components/payments/PaymentFilters.jsx'
import PaymentList from '../components/payments/PaymentList.jsx'
import PaymentFormModal from '../components/payments/PaymentFormModal.jsx'
import WhatsappChargeModal from '../components/whatsapp/WhatsappChargeModal.jsx'
import { usePayments, effectiveStatus } from '../hooks/usePayments.js'
import { useClients } from '../hooks/useClients.js'
import { useWorkspace } from '../hooks/useWorkspace.js'
import { formatCurrency } from '../utils/formatCurrency.js'

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function Payments() {
  const { workspace } = useWorkspace()
  const { payments, loading, error, createPayments, updatePayment, deletePayment } = usePayments()
  const { clients } = useClients()

  const [statusFilter, setStatusFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [monthFilter, setMonthFilter]   = useState(currentMonthKey)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing]   = useState(null)

  const [deleteTarget, setDeleteTarget]     = useState(null)
  const [deleting, setDeleting]             = useState(false)
  const [deleteError, setDeleteError]       = useState(null)
  const [whatsappTarget, setWhatsappTarget] = useState(null)

  const filtered = useMemo(() => payments.filter(p => {
    const matchStatus = !statusFilter || effectiveStatus(p) === statusFilter
    const matchClient = !clientFilter || p.client_id === clientFilter
    const matchMonth  = !monthFilter  || (
      p.due_date?.startsWith(monthFilter) ||
      (!p.due_date && p.paid_date?.startsWith(monthFilter))
    )
    return matchStatus && matchClient && matchMonth
  }), [payments, statusFilter, clientFilter, monthFilter])

  const hasActiveFilters = statusFilter !== '' || clientFilter !== '' || monthFilter !== ''

  function openCreate()         { setEditing(null); setFormOpen(true) }
  function openEdit(payment)    { setEditing(payment); setFormOpen(true) }
  function closeForm()          { setFormOpen(false); setEditing(null) }

  function openDelete(payment)  { setDeleteError(null); setDeleteTarget(payment) }
  function closeDelete()        { setDeleteTarget(null); setDeleteError(null) }

  async function handleSubmit(records) {
    if (editing) await updatePayment(editing.id, records[0])
    else         await createPayments(records)
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deletePayment(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      setDeleteError('Não foi possível excluir. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  const { title } = workspace.pages.payments

  return (
    <Layout title={title}>

      {/* Resumo financeiro */}
      <PaymentSummaryCards payments={payments} />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {!loading && `${filtered.length} pagamento${filtered.length !== 1 ? 's' : ''}`}
        </p>
        <button
          onClick={openCreate}
          className="shrink-0 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          Novo pagamento
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-5">
        <PaymentFilters
          status={statusFilter}   onStatus={setStatusFilter}
          clientId={clientFilter} onClient={setClientFilter}
          month={monthFilter}     onMonth={setMonthFilter}
          clients={clients}
        />
      </div>

      {/* Lista */}
      <PaymentList
        payments={filtered}
        loading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        onEdit={openEdit}
        onDelete={openDelete}
        onWhatsapp={setWhatsappTarget}
        onNew={openCreate}
      />

      {/* Modal: formulário */}
      {formOpen && (
        <PaymentFormModal
          initialData={editing}
          clients={clients}
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
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Excluir pagamento</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
              Tem certeza que deseja excluir o pagamento de{' '}
              <span className="font-semibold">{formatCurrency(deleteTarget.amount)}</span>?
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Esta ação não pode ser desfeita.</p>

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

      {/* Modal: cobrança WhatsApp */}
      {whatsappTarget && (
        <WhatsappChargeModal
          payment={whatsappTarget}
          onClose={() => setWhatsappTarget(null)}
        />
      )}

    </Layout>
  )
}
