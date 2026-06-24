import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Scale, FileDown } from 'lucide-react'

import Layout from '../../components/Layout.jsx'
import StatCard from '../../components/StatCard.jsx'
import TransactionList from '../../components/financeiro/TransactionList.jsx'
import { useFinancial } from '../../hooks/useFinancial.js'
import { useFinancialCategories } from '../../hooks/useFinancialCategories.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { formatDateBR } from '../../utils/dateHelpers.js'
import { computeSummary, exportToCSV, monthKey, PAYMENT_METHODS } from '../../utils/financial.js'

const SCOPE_OPTS = [
  { value: '',         label: 'Empresa + Pessoal' },
  { value: 'company',  label: 'Empresa' },
  { value: 'personal', label: 'Pessoal' },
]

const TYPE_OPTS = [
  { value: '',        label: 'Receitas e Despesas' },
  { value: 'income',  label: 'Receitas' },
  { value: 'expense', label: 'Despesas' },
]

const STATUS_OPTS = [
  { value: '',        label: 'Todos os status' },
  { value: 'paid',    label: 'Pago / Recebido' },
  { value: 'pending', label: 'Pendente' },
]

function inputCls() {
  return 'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors'
}

function currentMonthKey() { return monthKey() }

export default function RelatoriosFinanceiros() {
  const { transactions, loading, error } = useFinancial()
  const { categories } = useFinancialCategories()

  const [monthFilter,  setMonthFilter]  = useState(currentMonthKey)
  const [scopeFilter,  setScopeFilter]  = useState('')
  const [typeFilter,   setTypeFilter]   = useState('')
  const [catFilter,    setCatFilter]    = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pmFilter,     setPmFilter]     = useState('')

  // Apply filters
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (monthFilter  && !t.date?.startsWith(monthFilter))       return false
      if (scopeFilter  && t.scope            !== scopeFilter)      return false
      if (typeFilter   && t.type             !== typeFilter)       return false
      if (catFilter    && t.category_name    !== catFilter)        return false
      if (statusFilter && t.status           !== statusFilter)     return false
      if (pmFilter     && t.payment_method   !== pmFilter)        return false
      return true
    })
  }, [transactions, monthFilter, scopeFilter, typeFilter, catFilter, statusFilter, pmFilter])

  const summary = useMemo(() => computeSummary(filtered), [filtered])

  const hasFilters = scopeFilter || typeFilter || catFilter || statusFilter || pmFilter || monthFilter !== currentMonthKey()

  function handleExportCSV() {
    const rows = filtered.map(t => ({
      Data:             t.date     ? formatDateBR(t.date) : '',
      Descrição:        t.description,
      Tipo:             t.type === 'income' ? 'Receita' : 'Despesa',
      Escopo:           t.scope === 'company' ? 'Empresa' : 'Pessoal',
      Categoria:        t.category_name || '',
      Valor:            Number(t.amount || 0).toFixed(2).replace('.', ','),
      'Forma pagamento': PAYMENT_METHODS.find(m => m.value === t.payment_method)?.label || '',
      Status:           t.status === 'paid' ? 'Pago' : 'Pendente',
      Observações:      t.notes || '',
    }))
    exportToCSV(rows, `relatorio-financeiro-${monthFilter || 'todos'}.csv`)
  }

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Relatórios Financeiros</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Análise avançada com filtros e exportação.</p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <FileDown size={15} />
            Exportar CSV
          </button>
        </div>

        {/* Filters */}
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Filtros</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <input
              type="month"
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              className={inputCls()}
            />
            <select value={scopeFilter}  onChange={e => setScopeFilter(e.target.value)}  className={inputCls()}>
              {SCOPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={typeFilter}   onChange={e => setTypeFilter(e.target.value)}   className={inputCls()}>
              {TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={catFilter}    onChange={e => setCatFilter(e.target.value)}    className={inputCls()}>
              <option value="">Todas as categorias</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={inputCls()}>
              {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={pmFilter}     onChange={e => setPmFilter(e.target.value)}     className={inputCls()}>
              <option value="">Todas as formas</option>
              {PAYMENT_METHODS.filter(m => m.value).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button
              onClick={() => {
                setScopeFilter(''); setTypeFilter(''); setCatFilter('')
                setStatusFilter(''); setPmFilter(''); setMonthFilter(currentMonthKey())
              }}
              className="mt-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 underline"
            >
              Limpar todos os filtros
            </button>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Receitas"
            value={formatCurrency(summary.income)}
            icon={TrendingUp}
            color="emerald"
            subtitle={summary.incomePending > 0 ? `+${formatCurrency(summary.incomePending)} previsto` : undefined}
          />
          <StatCard
            title="Despesas"
            value={formatCurrency(summary.expenses)}
            icon={TrendingDown}
            color="red"
            subtitle={summary.expensesPending > 0 ? `+${formatCurrency(summary.expensesPending)} pendente` : undefined}
          />
          <StatCard
            title="Saldo"
            value={formatCurrency(summary.income - summary.expenses)}
            icon={Scale}
            color={(summary.income - summary.expenses) >= 0 ? 'blue' : 'red'}
          />
        </div>

        {/* Result count */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {!loading && `${filtered.length} ${filtered.length === 1 ? 'transação' : 'transações'}`}
          </p>
        </div>

        {/* Table */}
        <TransactionList
          transactions={filtered}
          loading={loading}
          error={error}
          emptyMessage="Nenhuma transação encontrada para os filtros aplicados."
        />
      </div>
    </Layout>
  )
}
