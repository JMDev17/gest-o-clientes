import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, CheckSquare,
  CalendarDays, RefreshCw, LogOut, Newspaper, FileText, Scissors, BarChart3, X
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useWorkspace } from '../hooks/useWorkspace.js'
import { useProfile } from '../hooks/useProfile.js'
import ThemeToggle from './ThemeToggle.jsx'

const ICONS = { LayoutDashboard, Users, CreditCard, CheckSquare, CalendarDays, RefreshCw, Newspaper, FileText, Scissors, BarChart3 }

const SWITCHER = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'estetica',  label: 'Estética'  },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, signOut } = useAuth()
  const { workspace, workspaceType, setWorkspaceType } = useWorkspace()
  const { updateProfile } = useProfile()

  async function handleSignOut() {
    try { await signOut() } catch { /* listener limpa o estado */ }
  }

  async function handleSwitchType(value) {
    setWorkspaceType(value)
    try { await updateProfile({ business_type: value }) } catch { /* localStorage mantém estado */ }
  }

  function handleNavClick() {
    onClose?.()
  }

  const initial = user?.email?.charAt(0).toUpperCase() ?? '?'

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-30 flex h-screen w-64 shrink-0 flex-col',
        'bg-white border-r border-gray-200',
        'dark:bg-gray-900 dark:border-gray-800',
        'transition-transform duration-200 ease-in-out',
        'lg:relative lg:translate-x-0 lg:w-60',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >

      {/* Logo + close button */}
      <div className="flex h-14 items-center gap-3 px-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600">
          <span className="text-xs font-bold text-white">
            {workspace.appName.charAt(0)}
          </span>
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight flex-1 min-w-0 truncate">
          {workspace.appName}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {workspace.nav.map(({ to, label, icon }) => {
          const Icon = ICONS[icon]
          return (
            <NavLink
              key={to}
              to={to}
              onClick={handleNavClick}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
                ].join(' ')
              }
            >
              {Icon && <Icon size={16} strokeWidth={1.75} className="shrink-0" />}
              {label}
            </NavLink>
          )
        })}
      </nav>

      {/* Seletor de workspace */}
      <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-800 pt-3">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-1 mb-2">
          Modo de uso
        </p>
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 gap-0.5">
          {SWITCHER.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleSwitchType(value)}
              className={[
                'flex-1 rounded-md py-1.5 text-xs font-medium transition-colors',
                workspaceType === value
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Usuário */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-0.5">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 text-xs font-semibold">
            {initial}
          </div>
          <p className="min-w-0 flex-1 truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <LogOut size={16} strokeWidth={1.75} className="shrink-0" />
          Sair
        </button>
      </div>

    </aside>
  )
}
