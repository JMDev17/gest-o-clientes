import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
      className={[
        'relative flex items-center gap-0.5 rounded-full p-1 transition-all duration-200',
        'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
        'ring-1 ring-gray-200 dark:ring-gray-700',
        className,
      ].join(' ')}
    >
      {/* Sol — modo claro */}
      <span
        className={[
          'flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200',
          !isDark
            ? 'bg-white shadow-sm text-amber-500 scale-100'
            : 'text-gray-400 dark:text-gray-600 scale-90',
        ].join(' ')}
      >
        <Sun size={13} strokeWidth={2.25} />
      </span>

      {/* Lua — modo escuro */}
      <span
        className={[
          'flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200',
          isDark
            ? 'bg-gray-900 shadow-sm text-violet-400 scale-100'
            : 'text-gray-400 scale-90',
        ].join(' ')}
      >
        <Moon size={13} strokeWidth={2.25} />
      </span>
    </button>
  )
}
