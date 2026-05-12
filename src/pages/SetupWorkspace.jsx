import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone, Sparkles } from 'lucide-react'
import { useProfile } from '../hooks/useProfile.js'

const OPTIONS = [
  {
    value: 'marketing',
    label: 'Marketing / GMN',
    description: 'Gestão de clientes de marketing, tráfego pago e SEO.',
    Icon: Megaphone,
  },
  {
    value: 'estetica',
    label: 'Clínica de Estética',
    description: 'Agendamentos, pacientes e serviços de estética.',
    Icon: Sparkles,
  },
]

export default function SetupWorkspace() {
  const { profile, loading, createProfile } = useProfile()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  useEffect(() => {
    if (!loading && profile) navigate('/dashboard', { replace: true })
  }, [profile, loading, navigate])

  async function handleSelect(business_type) {
    setSaving(true)
    setError(null)
    try {
      await createProfile({ business_type })
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Não foi possível salvar. Tente novamente.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 shadow-sm">
            <span className="text-base font-bold text-white">G</span>
          </div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-white">Como você vai usar o app?</h1>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Escolha o tipo de negócio para personalizar a experiência.</p>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400 text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {OPTIONS.map(({ value, label, description, Icon }) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              disabled={saving}
              className="flex w-full items-start gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 text-left shadow-sm hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-md transition-all disabled:opacity-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30">
                <Icon size={20} strokeWidth={1.75} className="text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 leading-relaxed">{description}</p>
              </div>
            </button>
          ))}
        </div>

        {saving && (
          <div className="mt-6 flex justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        )}

      </div>
    </div>
  )
}
