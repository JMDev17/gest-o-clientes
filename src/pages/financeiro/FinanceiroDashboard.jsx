import { useMemo } from 'react'
import {
  TrendingUp, TrendingDown, Scale, ArrowLeftRight,
  Wallet, ShoppingBag, PiggyBank, ArrowUpCircle, ArrowDownCircle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

import Layout from '../../components/Layout.jsx'
import StatCard from '../../components/StatCard.jsx'
import { useFinanceiroDashboard } from '../../hooks/useFinanceiroDashboard.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { formatDateBR } from '../../utils/dateHelpers.js'
import { useTheme } from '../../context/ThemeContext.jsx'

const PIE_COLORS = [
  '#8b5cf6','#6366f1','#3b82f6','#06b6d4','#10b981',
  '#f59e0b','#f97316','#ef4444','#ec4899','#14b8a6',
]

function CustomBarTooltip({ active, payload, label }) {
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

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-200">{payload[0].name}</p>
      <p className="text-gray-600 dark:text-gray-300">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

function MovementRow({ tx }) {
  const isIncome = tx.type === 'income'
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${isIncome ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
        {isIncome
          ? <ArrowUpCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
          : <ArrowDownCircle size={14} className="text-red-500 dark:text-red-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{tx.description}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {tx.category || '—'} · {formatDateBR(tx.date)}
          {tx.scope === 'personal' && <span className="ml-1 text-brand-500">· Pessoal</span>}
        </p>
      </div>
      <span className={`text-sm font-semibold tabular-nums shrink-0 ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
      </span>
    </div>
  )
}

export default function FinanceiroDashboard() {
  const d = useFinanceiroDashboard()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const tickColor    = isDark ? '#6b7280' : '#9ca3af'
  const gridColor    = isDark ? '#1f2937' : '#f0f0f0'
  const cursorStroke = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

  const hasCategoryData = d.categoryData.length > 0
  const hasChartData    = d.chartData.some(d => d.receita > 0 || d.despesas > 0)

  if (d.loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard Financeiro</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Carregando dados…</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 animate-pulse">
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard Financeiro</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Visão consolidada — empresa e pessoal.</p>
        </div>

        {/* ── EMPRESA ── */}
        <div>
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-0.5">
            Empresa — mês atual
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Receita do mês"
              value={formatCurrency(d.monthlyRevenue)}
              icon={TrendingUp}
              color="emerald"
            />
            <StatCard
              title="Despesas"
              value={formatCurrency(d.monthlyExpenses)}
              icon={TrendingDown}
              color="red"
            />
            <StatCard
              title="Lucro operacional"
              value={formatCurrency(d.profit)}
              icon={Scale}
              color={d.profit >= 0 ? 'emerald' : 'red'}
            />
            <StatCard
              title="Pró-labore retirado"
              value={formatCurrency(d.proLaboreMonth)}
              icon={ArrowLeftRight}
              color="violet"
            />
          </div>
        </div>

        {/* Saldo empresa */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Saldo em caixa"
            value={formatCurrency(d.companySaldo)}
            icon={Wallet}
            color={d.companySaldo >= 0 ? 'blue' : 'red'}
            subtitle="Histórico acumulado"
          />

          {/* ── PESSOAL ── */}
          <StatCard
            title="Despesas pessoais"
            value={formatCurrency(d.personalExpensesMonth)}
            icon={ShoppingBag}
            color="amber"
            subtitle="Mês atual"
          />
          <StatCard
            title="Saldo pessoal"
            value={formatCurrency(d.personalSaldo)}
            icon={PiggyBank}
            color={d.personalSaldo >= 0 ? 'emerald' : 'red'}
            subtitle="Histórico acumulado"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Bar chart — receita vs despesas */}
          <div className="lg:col-span-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Receitas × Despesas — últimos 6 meses
            </p>
            {hasChartData ? (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.chartData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: tickColor }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: tickColor }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: cursorStroke }} />
                    <Legend verticalAlign="top" align="right" iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, paddingBottom: 8, color: tickColor }} />
                    <Bar dataKey="receita"  name="Receita"  fill="#10b981" radius={[3,3,0,0]} />
                    <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[240px] flex items-center justify-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum dado para exibir</p>
              </div>
            )}
          </div>

          {/* Pie chart — despesas por categoria */}
          <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Despesas por categoria
            </p>
            {hasCategoryData ? (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={d.categoryData}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {d.categoryData.map((entry, i) => (
                        <Cell key={entry.name} fill={entry.color || PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend
                      iconSize={8}
                      iconType="circle"
                      wrapperStyle={{ fontSize: 10, color: tickColor }}
                      formatter={value => value.length > 14 ? value.slice(0, 13) + '…' : value}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[240px] flex items-center justify-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">Sem despesas este mês</p>
              </div>
            )}
          </div>
        </div>

        {/* Últimas movimentações */}
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">Últimas movimentações</p>
          {d.recentMovements.length > 0 ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {d.recentMovements.map(tx => <MovementRow key={tx.id} tx={tx} />)}
            </div>
          ) : (
            <p className="text-sm text-center text-gray-400 dark:text-gray-500 py-8">
              Nenhuma movimentação registrada ainda.
            </p>
          )}
        </div>
      </div>
    </Layout>
  )
}
