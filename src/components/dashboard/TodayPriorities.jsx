import { CalendarCheck, CreditCard, ListChecks } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { formatDateBR } from '../../utils/dateHelpers.js'
import { useWorkspace } from '../../hooks/useWorkspace.js'

function PriorityItem({ icon: Icon, iconColor, children }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 ${iconColor}`}>
        <Icon size={13} strokeWidth={2} />
      </div>
      <div className="text-sm text-gray-700 dark:text-gray-300 leading-tight min-w-0">{children}</div>
    </div>
  )
}

export default function TodayPriorities({ todayTasks, todayPayments, todayAppointments }) {
  const { workspaceType } = useWorkspace()
  const isEstetica = workspaceType === 'estetica'

  const hasItems = todayTasks.length > 0 || todayPayments.length > 0 || todayAppointments.length > 0

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">
        {isEstetica ? 'Agenda de hoje' : 'Prioridades de hoje'}
      </p>

      {!hasItems && (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4">Nenhuma pendência para hoje. 🎉</p>
      )}

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {todayAppointments.map(a => (
          <PriorityItem key={a.id} icon={CalendarCheck} iconColor="text-violet-500">
            <p className="font-medium">{a.title}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {a.client?.name ?? 'Sem paciente'}
              {a.start_time && ` · ${a.start_time.slice(0, 5)}`}
            </p>
          </PriorityItem>
        ))}

        {todayPayments.map(p => (
          <PriorityItem key={p.id} icon={CreditCard} iconColor="text-amber-500">
            <p className="font-medium truncate">{p.client?.name ?? 'Pagamento'} — {formatCurrency(p.amount)}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Vence hoje</p>
          </PriorityItem>
        ))}

        {todayTasks.map(t => (
          <PriorityItem key={t.id} icon={ListChecks} iconColor="text-blue-500">
            <p className="font-medium truncate">{t.title}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t.client?.name ?? ''}</p>
          </PriorityItem>
        ))}
      </div>
    </div>
  )
}
