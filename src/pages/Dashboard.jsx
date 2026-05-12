import {
  Users, DollarSign, Wallet, TrendingUp, AlertCircle,
  Clock, ListTodo, ImageOff, CheckCircle2, CalendarDays
} from 'lucide-react'

import { useWorkspace } from '../hooks/useWorkspace.js'
import { useDashboardData } from '../hooks/useDashboardData.js'
import { formatCurrency } from '../utils/formatCurrency.js'

import Layout from '../components/Layout.jsx'

import StatCard from '../components/StatCard.jsx'
import QuickActions from '../components/dashboard/QuickActions.jsx'
import DashboardRevenueChart from '../components/dashboard/DashboardRevenueChart.jsx'
import TodayPriorities from '../components/dashboard/TodayPriorities.jsx'
import PendingPaymentsWidget from '../components/dashboard/PendingPaymentsWidget.jsx'
import ContractsEndingWidget from '../components/dashboard/ContractsEndingWidget.jsx'
import ContentPendingWidget from '../components/dashboard/ContentPendingWidget.jsx'
import RecentActivityWidget from '../components/dashboard/RecentActivityWidget.jsx'

export default function Dashboard() {
  const { workspaceType } = useWorkspace()
  const isEstetica = workspaceType === 'estetica'
  const d = useDashboardData()

  if (d.loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard Executivo</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Carregando dados…</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard Executivo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Visão geral e métricas em tempo real.</p>
        </div>
        <QuickActions />
      </div>

      {/* Main KPIs Row 1 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={isEstetica ? 'Pacientes ativos' : 'Clientes ativos'}
          value={d.activeClients}
          icon={Users}
          color="blue"
        />
        <StatCard
          title={isEstetica ? 'Faturamento do mês' : 'Receita do mês'}
          value={formatCurrency(d.receivedMonth)}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Receita prevista"
          value={formatCurrency(d.forecastMonth)}
          icon={TrendingUp}
          color="indigo"
        />
        <StatCard
          title="Valor pendente"
          value={formatCurrency(d.pendingAmount)}
          icon={Wallet}
          color="amber"
          subtitle={`${d.pendingPaymentsCount} pagamento(s) aberto(s)`}
        />
      </div>

      {/* Main KPIs Row 2 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pagamentos atrasados"
          value={formatCurrency(d.overdueAmount)}
          icon={AlertCircle}
          color={d.overdueAmount > 0 ? 'red' : 'gray'}
          subtitle={`${d.overduePaymentsCount} em atraso`}
        />

        {isEstetica ? (
          <>
            <StatCard
              title="Agendamentos da semana"
              value={d.weekAppointmentsCount}
              icon={CalendarDays}
              color="violet"
            />
            <StatCard
              title="Sessões restantes"
              value={d.remainingSessions}
              icon={CheckCircle2}
              color="sky"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Tarefas vencidas"
              value={d.overdueTasks}
              icon={AlertCircle}
              color={d.overdueTasks > 0 ? 'red' : 'gray'}
            />
            <StatCard
              title="Tarefas abertas"
              value={d.openTasks}
              icon={ListTodo}
              color="blue"
            />
          </>
        )}

        <StatCard
          title={isEstetica ? 'Pacotes vencendo (30d)' : 'Contratos vencendo (30d)'}
          value={d.contractsEndingCount}
          icon={Clock}
          color={d.contractsEndingCount > 0 ? 'amber' : 'gray'}
        />

        {!isEstetica && (
          <StatCard
            title="S/ plano de conteúdo"
            value={d.clientsWithoutContentCount}
            icon={ImageOff}
            color={d.clientsWithoutContentCount > 0 ? 'red' : 'gray'}
            subtitle="Clientes ativos"
          />
        )}
      </div>

      {/* Two Column Layout for Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (Wider) */}
        <div className="lg:col-span-2 space-y-6">
          <DashboardRevenueChart data={d.revenueHistory} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TodayPriorities
              todayTasks={d.todayTasks}
              todayPayments={d.todayPayments}
              todayAppointments={d.todayAppointments}
            />
            <PendingPaymentsWidget
              pending={d.pendingPayments}
              overdue={d.overduePayments}
            />
          </div>
        </div>

        {/* Right Column (Narrower) */}
        <div className="space-y-6">
          <ContractsEndingWidget
            contracts={isEstetica ? d.lowSessionContracts : d.contractsEnding}
          />

          {!isEstetica && (
            <ContentPendingWidget
              clientsWithoutContent={d.clientsWithoutContent}
            />
          )}

          <RecentActivityWidget activities={d.recentActivity} />
        </div>
      </div>
      </div>
    </Layout>
  )
}
