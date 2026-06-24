import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useWorkspace } from '../hooks/useWorkspace.js'

// ── Mensagens amigáveis ──────────────────────────────────────────────────────
const SIGNIN_ERRORS = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'Email not confirmed':       'Confirme seu e-mail antes de entrar.',
  'Too many requests':         'Muitas tentativas. Aguarde alguns minutos.',
}
const SIGNUP_ERRORS = {
  'User already registered':                          'Este e-mail já está cadastrado.',
  'Password should be at least 6 characters':         'A senha deve ter pelo menos 6 caracteres.',
  'Signup requires a valid password':                 'Informe uma senha válida.',
  'Unable to validate email address: invalid format': 'Informe um e-mail válido.',
  'Email rate limit exceeded':                        'Muitas tentativas. Aguarde alguns minutos.',
}

function toUserMessage(error, mode) {
  const msg = error?.message ?? ''
  if (mode === 'signin') return SIGNIN_ERRORS[msg] ?? 'Não foi possível entrar. Tente novamente.'
  return SIGNUP_ERRORS[msg] ?? 'Não foi possível criar conta. Tente novamente.'
}

// ── Validação ────────────────────────────────────────────────────────────────
function validate(mode, { email, password, confirmPassword }) {
  const errs = {}
  const t = email.trim()
  if (!t)                                         errs.email = 'E-mail é obrigatório.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) errs.email = 'Informe um e-mail válido.'

  if (!password)                                        errs.password = 'Senha é obrigatória.'
  else if (mode === 'signup' && password.length < 6)    errs.password = 'Mínimo de 6 caracteres.'

  if (mode === 'signup') {
    if (!confirmPassword)                 errs.confirmPassword = 'Confirme sua senha.'
    else if (confirmPassword !== password) errs.confirmPassword = 'As senhas não coincidem.'
  }
  return errs
}

// ── Componente ───────────────────────────────────────────────────────────────
export default function Login() {
  const { workspace } = useWorkspace()
  const { user, loading, signInWithEmail, signUp } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode]                       = useState('signin')
  const [email, setEmail]                     = useState('')
  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors]         = useState({})
  const [submitError, setSubmitError]         = useState(null)
  const [successMsg, setSuccessMsg]           = useState(null)
  const [submitting, setSubmitting]           = useState(false)

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  function switchMode(next) {
    if (next === mode) return
    setMode(next); setFieldErrors({}); setSubmitError(null); setSuccessMsg(null)
    setPassword(''); setConfirmPassword('')
  }

  function clearErr(field) {
    setFieldErrors(prev => ({ ...prev, [field]: null }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError(null); setSuccessMsg(null)

    const errs = validate(mode, { email, password, confirmPassword })
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setSubmitting(true)
    try {
      if (mode === 'signin') {
        await signInWithEmail(email.trim(), password)
        navigate('/dashboard', { replace: true })
      } else {
        const { needsConfirmation } = await signUp(email.trim(), password)
        if (needsConfirmation) {
          setSuccessMsg('Conta criada! Verifique seu e-mail e clique no link de confirmação para acessar o sistema.')
        } else {
          navigate('/dashboard', { replace: true })
        }
      }
    } catch (err) {
      setSubmitError(toUserMessage(err, mode))
    } finally {
      setSubmitting(false)
    }
  }

  // Spinner inicial
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
      </div>
    )
  }

  // Tela de confirmação de e-mail
  if (successMsg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
            <span className="text-2xl">✉</span>
          </div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Verifique seu e-mail</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{successMsg}</p>
          <button
            onClick={() => { setSuccessMsg(null); switchMode('signin') }}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            Voltar para o login
          </button>
        </div>
      </div>
    )
  }

  // Formulário
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">

        {/* Marca */}
        <div className="mb-7 flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 shadow-sm">
            <span className="text-base font-bold text-white">{workspace.appName.charAt(0)}</span>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-gray-900 dark:text-white">{workspace.appName}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {mode === 'signin' ? 'Entre na sua conta' : 'Crie uma nova conta'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">

          {/* Toggle */}
          <div className="flex border-b border-gray-100 dark:border-gray-800">
            {[['signin', 'Entrar'], ['signup', 'Criar conta']].map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={[
                  'flex-1 py-3 text-sm font-medium transition-colors',
                  mode === m
                    ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/40 dark:bg-brand-900/20'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate className="p-7 space-y-4">

            {submitError && (
              <div role="alert" className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {submitError}
              </div>
            )}

            <FormField label="E-mail" error={fieldErrors.email}>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => { setEmail(e.target.value); clearErr('email') }}
                disabled={submitting}
                placeholder="voce@email.com"
                className={inputCls(fieldErrors.email)}
              />
            </FormField>

            <FormField label="Senha" error={fieldErrors.password}>
              <input
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={e => { setPassword(e.target.value); clearErr('password') }}
                disabled={submitting}
                placeholder="••••••••"
                className={inputCls(fieldErrors.password)}
              />
            </FormField>

            {mode === 'signup' && (
              <FormField label="Confirmar senha" error={fieldErrors.confirmPassword}>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); clearErr('confirmPassword') }}
                  disabled={submitting}
                  placeholder="••••••••"
                  className={inputCls(fieldErrors.confirmPassword)}
                />
              </FormField>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors mt-1"
            >
              {submitting
                ? (mode === 'signin' ? 'Entrando…' : 'Criando conta…')
                : (mode === 'signin' ? 'Entrar' : 'Criar conta')}
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}

function FormField({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function inputCls(error) {
  return [
    'w-full rounded-lg border bg-white px-3 py-2 text-sm',
    'placeholder-gray-300 text-gray-900 disabled:opacity-50',
    'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
    'transition-colors',
    'dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-600',
    error ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700',
  ].join(' ')
}
