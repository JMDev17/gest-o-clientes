import { useNavigate } from 'react-router-dom'
import {
  UserPlus, FilePlus, CreditCard, ListPlus, Newspaper,
  CalendarPlus, ClipboardPlus
} from 'lucide-react'
import { useWorkspace } from '../../hooks/useWorkspace.js'

const MARKETING_ACTIONS = [
  { label: 'Novo cliente',      icon: UserPlus,      to: '/clients',   state: { openNew: true } },
  { label: 'Novo contrato',     icon: FilePlus,      to: '/contracts', state: { openNew: true } },
  { label: 'Novo pagamento',    icon: CreditCard,    to: '/payments',  state: { openNew: true } },
  { label: 'Nova tarefa',       icon: ListPlus,      to: '/tasks',     state: { openNew: true } },
  { label: 'Registrar conteúdo',icon: Newspaper,     to: '/content',   state: { openNew: true } },
]

const ESTETICA_ACTIONS = [
  { label: 'Novo paciente',      icon: UserPlus,      to: '/clients',   state: { openNew: true } },
  { label: 'Novo pacote',        icon: FilePlus,      to: '/contracts', state: { openNew: true } },
  { label: 'Novo agendamento',   icon: CalendarPlus,  to: '/calendar',  state: { openNew: true } },
  { label: 'Registrar pagamento',icon: CreditCard,    to: '/payments',  state: { openNew: true } },
  { label: 'Registrar sessão',   icon: ClipboardPlus, to: '/calendar',  state: { openSession: true } },
]

export default function QuickActions() {
  const navigate = useNavigate()
  const { workspaceType } = useWorkspace()
  const actions = workspaceType === 'estetica' ? ESTETICA_ACTIONS : MARKETING_ACTIONS

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ label, icon: Icon, to, state }) => (
        <button
          key={label}
          onClick={() => navigate(to, { state })}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white transition-all active:scale-[0.97]"
        >
          <Icon size={14} strokeWidth={2} className="text-brand-500 dark:text-brand-400" />
          {label}
        </button>
      ))}
    </div>
  )
}
