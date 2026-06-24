import { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, Wallet, Clock } from 'lucide-react'

import Layout from '../../components/Layout.jsx'
import StatCard from '../../components/StatCard.jsx'
import { useFinancial } from '../../hooks/useFinancial.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { formatDateBR } from '../../utils/dateHelpers.js'
import { filterByPeriod, monthKey } from '../../utils/financial.js'
import { useTheme } from '../../context/ThemeContext.jsx'

const PERIODS = [
  { value: 'today',  label: 'Hoje' },
  { value: 'week',   label: 'Semana' },
  { value: 'month',  label: 'Mês' },
  { value: 'year',   label: 'Ano' },
  { value: 'custom', label: 'Personalizado' },
]

const SCOPE_OPTS = [
  { value: 'all',      label: 'Empresa + Pessoal' },
  { value: 'company',  label: 'Empresa' },
  { value: 'personal', label: 'Pessoal' },
]

function inputCls() {
  return 'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors'
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500 dark:text-gray-400">{p.name}:</span>
          <span className="font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function FluxoCaixa() {
  const { transactions, loading } = useFinancial()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [period,    setPeriod]    = useState('month')
  const [scope,     setScope]     = useState('all')
  const [mk,        setMk]        = useState(monthKey())
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')

  const tickColor    = isDark ? '#6b7280' : '#9ca3af'
  const gridColor    = isDark ? '#1f2937' : '#f0f0f0'
  const cursorStroke = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

  // Filter by scope
  const scopedTx = useMemo(() => {
    if (scope === 'all') return transactions
    return transactions.filter(t => t.scope === scope)
  }, [transactions, scope])

  // Filter by period
  const filtered = useMemo(() => filterByPeriod(scopedTx, { period, mk, startDate, endDate }),
    [scopedTx, period, mk, startDate, endDate])

  // Summary
  const summary = useMemo(() => {
    const paidIncome   = filtered.filter(t => t.type === 'income'  && t.status === 'paid')
      .reduce((s, t) => s + Number(t.amount), 0)
    const paidExpenses = filtered.filter(t => t.type === 'expense' && t.status === 'paid')
      .reduce((s, t) => s + Number(t.amount), 0)
    const pendingIncome   = filtered.filter(t => t.type === 'income'  && t.status === 'pending')
      .reduce((s, t) => s + Number(t.amount), 0)
    const pendingExpenses = filtered.filter(t => t.type === 'expense' && t.status === 'pending')
      .reduce((s, t) => s + Number(t.amount), 0)
    return { paidIncome, paidExpenses, balance: paidIncome - paidExpenses, pendingIncome, pendingExpenses }
  }, [filtered])

  // Build daily cashflow for chart
  const chartData = useMemo(() => {
    const byDate = {}
    for (const t of filtered) {
      if (!t.date) continue
      if (!byDate[t.date]) byDate[t.date] = { date: t.date, entrada: 0, saida: 0 }
      if (t.type === 'income'  && t.status === 'paid') byDate[t.date].entrada += Number(t.amount)
      if (t.type === 'expense' && t.status === 'paid') byDate[t.date].saida   += Number(t.amount)
    }

    const sorted = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
    let running = 0
    return sorted.map(d => {
      running += d.entrada - d.saida
      return {
        ...d,
        label:  formatDateBR(d.date),
        saldo:  running,
      }
    })
  }, [filtered])

  const forecastBalance = summary.balance + summary.pendingIncome - summary.pendingExpenses

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Fluxo de Caixa</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Entradas, saídas e saldo acumulado no tempo.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period buttons */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 gap-0.5">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={[
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  period === p.value
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                ].join(' ')}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Month picker if period=month */}
          {period === 'month' && (
            <input type="month" value={mk} onChange={e => setMk(e.target.value)} className={inputCls()} />
          )}

          {/* Date range if period=custom */}
          {period === 'custom' && (
            <>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls()} placeholder="Início" />
              <input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)}   className={inputCls()} placeholder="Fim" />
            </>
          )}

          {/* Scope */}
          <select value={scope} onChange={e => setScope(e.target.value)} className={inputCls()}>
            {SCOPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Entradas"      value={formatCurrency(summary.paidIncome)}    icon={TrendingUp}  color="emerald" />
          <StatCard title="Saídas"        value={formatCurrency(summary.paidExpenses)}  icon={TrendingDown} color="red" />
          <StatCard title="Saldo atual"   value={formatCurrency(summary.balance)}       icon={Wallet}
            color={summary.balance >= 0 ? 'blue' : 'red'} />
          <StatCard
            title="Saldo previsto"
            value={formatCurrency(forecastBalance)}
            icon={Clock}
            color={forecastBalance >= 0 ? 'indigo' : 'amber'}
            subtitle={`+${formatCurrency(summary.pendingIncome)} previsto / -${formatCurrency(summary.pendingExpenses)} pendente`}
          />
        </div>

        {/* Area chart */}
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">Saldo acumulado</p>
          {chartData.length > 1 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="entradaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: tickColor }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: tickColor }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: cursorStroke, strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="entrada" name="Entrada" stroke="#10b981" fill="url(#entradaGrad)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="saldo"   name="Saldo"   stroke="#8b5cf6" fill="url(#saldoGrad)"   strokeWidth={2}   dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum dado para o período selecionado</p>
            </div>
          )}
        </div>

        {/* Transaction list */}
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Movimentações</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{filtered.length} {filtered.length === 1 ? 'transação' : 'transações'}</p>
          </div>
          {loading ? (
            <div className="p-6 text-center text-sm text-gray-400">Carregando…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">
              Nenhuma movimentação no período.
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[400px] overflow-y-auto">
              {[...filtered].sort((a, b) => b.date?.localeCompare(a.date ?? '')).map(tx => {
                const isIncome = tx.type === 'income'
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{tx.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDateBR(tx.date)}
                        {tx.category_name && <span> · {tx.category_name}</span>}
                        <span className={`ml-1 ${tx.scope === 'company' ? 'text-blue-500' : 'text-violet-500'}`}>
                          · {tx.scope === 'company' ? 'Empresa' : 'Pessoal'}
                        </span>
                      </p>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums shrink-0 ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    {tx.status === 'pending' && (
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 rounded-full px-2 py-0.5 shrink-0">
                        Pendente
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
