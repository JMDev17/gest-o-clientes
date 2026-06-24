import { useState, useMemo } from 'react'
import { Plus, Tag, ArrowLeftRight, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react'

import Layout from '../../components/Layout.jsx'
import StatCard from '../../components/StatCard.jsx'
import TransactionList from '../../components/financeiro/TransactionList.jsx'
import TransactionFormModal from '../../components/financeiro/TransactionFormModal.jsx'
import ProLaboreModal from '../../components/financeiro/ProLaboreModal.jsx'
import CategoryManagerModal from '../../components/financeiro/CategoryManagerModal.jsx'

import { useFinancial } from '../../hooks/useFinancial.js'
import { useFinancialCategories } from '../../hooks/useFinancialCategories.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { monthKey, computeSummary } from '../../utils/financial.js'

const TABS = [
  { id: 'all',      label: 'Todas',    type: null       },
  { id: 'receitas', label: 'Entradas', type: 'income'   },
  { id: 'despesas', label: 'Saídas',   type: 'expense'  },
]

const STATUS_FILTER = [
  { value: '',        label: 'Todos os status' },
  { value: 'paid',    label: 'Pago' },
  { value: 'pending', label: 'Pendente' },
]

function currentMonthKey() { return monthKey() }

function inputCls() {
  return 'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors'
}

export default function ProLabore() {
  const { transactions, loading, error, createTransaction, updateTransaction, deleteTransaction, createTransfer } = useFinancial()
  const { personalCategories, createCategory, deleteCategory } = useFinancialCategories()

  const [activeTab,    setActiveTab]    = useState('all')
  const [monthFilter,  setMonthFilter]  = useState(currentMonthKey)
  const [catFilter,    setCatFilter]    = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [showForm,       setShowForm]       = useState(false)
  const [showProLabore,  setShowProLabore]  = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [editingTx,      setEditingTx]      = useState(null)
  const [defaultType,    setDefaultType]    = useState('expense')

  // All personal transactions
  const personalTx = useMemo(() => transactions.filter(t => t.scope === 'personal'), [transactions])

  // Monthly summary
  const monthSummary = useMemo(() => {
    const filtered = personalTx.filter(t => !monthFilter || t.date?.startsWith(monthFilter))
    return computeSummary(filtered)
  }, [personalTx, monthFilter])

  // All-time saldo
  const allTimeSaldo = useMemo(() => {
    const s = computeSummary(personalTx)
    return s.income - s.expenses
  }, [personalTx])

  // Filtered list
  const activeTabData = TABS.find(t => t.id === activeTab)
  const visibleTx = useMemo(() => {
    return personalTx.filter(t => {
      if (activeTabData?.type && t.type !== activeTabData.type) return false
      if (monthFilter && !t.date?.startsWith(monthFilter)) return false
      if (catFilter && t.category_name !== catFilter) return false
      if (statusFilter && t.status !== statusFilter) return false
      return true
    })
  }, [personalTx, activeTabData, monthFilter, catFilter, statusFilter])

  async function handleSubmit(fields) {
    if (editingTx) {
      await updateTransaction(editingTx.id, fields)
    } else {
      await createTransaction(fields)
    }
  }

  function openForm(type) {
    setDefaultType(type)
    setEditingTx(null)
    setShowForm(true)
  }

  function handleEdit(tx) {
    setEditingTx(tx)
    setShowForm(true)
  }

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Pró-labore / Pessoal</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Controle financeiro pessoal e retiradas da empresa.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowCategories(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Tag size={15} />
              Categorias
            </button>
            <button
              onClick={() => setShowProLabore(true)}
              className="flex items-center gap-1.5 rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/30 px-3 py-2 text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
            >
              <ArrowLeftRight size={15} />
              Retirar Pró-labore
            </button>
            <button
              onClick={() => openForm('expense')}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              <Plus size={15} />
              Nova transação
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Entradas pessoais"
            value={formatCurrency(monthSummary.income)}
            icon={TrendingUp}
            color="emerald"
            subtitle="Mês atual"
          />
          <StatCard
            title="Despesas pessoais"
            value={formatCurrency(monthSummary.expenses)}
            icon={TrendingDown}
            color="amber"
            subtitle="Mês atual"
          />
          <StatCard
            title="Saldo pessoal"
            value={formatCurrency(allTimeSaldo)}
            icon={PiggyBank}
            color={allTimeSaldo >= 0 ? 'emerald' : 'red'}
            subtitle="Histórico acumulado"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            className={inputCls()}
          />
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className={inputCls()}
          >
            <option value="">Todas as categorias</option>
            {personalCategories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={inputCls()}
          >
            {STATUS_FILTER.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {(catFilter || statusFilter || monthFilter !== currentMonthKey()) && (
            <button
              onClick={() => { setCatFilter(''); setStatusFilter(''); setMonthFilter(currentMonthKey()) }}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 underline"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800">
          {TABS.map(tab => {
            const count = personalTx.filter(t =>
              (!tab.type || t.type === tab.type) &&
              (!monthFilter || t.date?.startsWith(monthFilter))
            ).length
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                  activeTab === tab.id
                    ? 'border-brand-600 text-brand-700 dark:text-brand-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600',
                ].join(' ')}
              >
                {tab.label}
                <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">({count})</span>
              </button>
            )
          })}
        </div>

        {/* List */}
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            {visibleTx.length} {visibleTx.length === 1 ? 'transação' : 'transações'}
          </p>
          <TransactionList
            transactions={visibleTx}
            loading={loading}
            error={error}
            onEdit={handleEdit}
            onDelete={deleteTransaction}
            emptyMessage="Nenhuma transação pessoal encontrada."
          />
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <TransactionFormModal
          initialData={editingTx}
          scope="personal"
          defaultType={editingTx?.type ?? defaultType}
          categories={personalCategories}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditingTx(null) }}
        />
      )}

      {showProLabore && (
        <ProLaboreModal
          onSubmit={createTransfer}
          onClose={() => setShowProLabore(false)}
        />
      )}

      {showCategories && (
        <CategoryManagerModal
          companyCategories={[]}
          personalCategories={personalCategories}
          onCreateCategory={createCategory}
          onDeleteCategory={deleteCategory}
          onClose={() => setShowCategories(false)}
        />
      )}
    </Layout>
  )
}
