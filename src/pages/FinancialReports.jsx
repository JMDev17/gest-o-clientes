import { useState, useMemo } from 'react'
import Layout from '../components/Layout.jsx'
import { useFinancialReports } from '../hooks/useFinancialReports.js'
import { useWorkspace } from '../hooks/useWorkspace.js'
import { effectiveStatus } from '../hooks/usePayments.js'
import { computeMonthMetrics, filterPayments } from '../utils/financialReports.js'

import FinancialSummaryCards from '../components/reports/FinancialSummaryCards.jsx'
import FinancialFilters from '../components/reports/FinancialFilters.jsx'
import FinancialTable from '../components/reports/FinancialTable.jsx'
import PaymentsByDay from '../components/reports/PaymentsByDay.jsx'
import PaymentsByClient from '../components/reports/PaymentsByClient.jsx'
import ExportCsvButton from '../components/reports/ExportCsvButton.jsx'

const TABS = [
  { id: 'resumo',    label: 'Resumo' },
  { id: 'por-dia',   label: 'Por dia' },
  { id: 'por-cliente', label: 'Por cliente' },
  { id: 'pendentes', label: 'Pendentes / Atrasados' },
]

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function FinancialReports() {
  const { workspace } = useWorkspace()
  const { payments, clientsWithPayments, loading, error } = useFinancialReports()

  const reportsConfig = workspace.reports || {}
  const pageConfig = workspace.pages?.financialReports || { title: 'Financeiro' }

  // Filters
  const [monthFilter, setMonthFilter]         = useState(currentMonthKey)
  const [clientFilter, setClientFilter]       = useState('')
  const [statusFilter, setStatusFilter]       = useState('')
  const [typeFilter, setTypeFilter]           = useState('')
  const [activeTab, setActiveTab]             = useState('resumo')

  // Apply filters
  const filtered = useMemo(() => filterPayments(payments, {
    month: monthFilter,
    clientId: clientFilter,
    status: statusFilter,
    paymentType: typeFilter,
  }), [payments, monthFilter, clientFilter, statusFilter, typeFilter])

  // Metrics from month filter (ignore other filters for summary)
  const metrics = useMemo(() => {
    if (!monthFilter) return null
    const [y, m] = monthFilter.split('-').map(Number)
    return computeMonthMetrics(payments, m, y)
  }, [payments, monthFilter])

  // Pendentes + Atrasados pre-filtered
  const pendingAndOverdue = useMemo(
    () => filtered.filter(p => {
      const st = effectiveStatus(p)
      return st === 'pendente' || st === 'atrasado'
    }),
    [filtered]
  )

  return (
    <Layout title={pageConfig.title}>

      {/* Filters + Export */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-1">
        <FinancialFilters
          month={monthFilter}       onMonth={setMonthFilter}
          clientId={clientFilter}   onClient={setClientFilter}
          status={statusFilter}     onStatus={setStatusFilter}
          paymentType={typeFilter}  onPaymentType={setTypeFilter}
          clients={clientsWithPayments}
          reportsConfig={reportsConfig}
        />
        <ExportCsvButton payments={filtered} month={monthFilter} />
      </div>

      {/* Summary cards */}
      {metrics && (
        <FinancialSummaryCards metrics={metrics} reportsConfig={reportsConfig} />
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-5 border-b border-gray-200 dark:border-gray-800">
        {TABS.map(tab => (
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
            {tab.id === 'pendentes' && pendingAndOverdue.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-100 text-red-700 text-[10px] font-semibold px-1.5">
                {pendingAndOverdue.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Count line */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {!loading && `${filtered.length} pagamento${filtered.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Tab content */}
      {activeTab === 'resumo' && (
        <FinancialTable
          payments={filtered}
          loading={loading}
          error={error}
          reportsConfig={reportsConfig}
        />
      )}

      {activeTab === 'por-dia' && (
        <PaymentsByDay payments={filtered} />
      )}

      {activeTab === 'por-cliente' && (
        <PaymentsByClient
          allPayments={payments}
          filteredPayments={filtered}
          reportsConfig={reportsConfig}
        />
      )}

      {activeTab === 'pendentes' && (
        <FinancialTable
          payments={pendingAndOverdue}
          loading={loading}
          error={error}
          reportsConfig={reportsConfig}
        />
      )}

    </Layout>
  )
}
