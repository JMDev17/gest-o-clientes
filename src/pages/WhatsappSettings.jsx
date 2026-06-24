import { useState } from 'react'
import { Save, RotateCcw, MessageCircle } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import { useWhatsappSettings } from '../hooks/useWhatsappSettings.js'
import { DEFAULT_TEMPLATE } from '../utils/whatsapp.js'

const PLACEHOLDERS = [
  { key: '{nome}',       desc: 'Nome do cliente' },
  { key: '{empresa}',    desc: 'Empresa do cliente' },
  { key: '{valor}',      desc: 'Valor do pagamento' },
  { key: '{vencimento}', desc: 'Data de vencimento' },
  { key: '{servico}',    desc: 'Serviço / descrição' },
]

const inputCls = 'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors'

export default function WhatsappSettings() {
  const { settings, saveSettings } = useWhatsappSettings()

  const [companyName,     setCompanyName]     = useState(settings.companyName)
  const [signature,       setSignature]       = useState(settings.signature)
  const [messageTemplate, setMessageTemplate] = useState(settings.messageTemplate)
  const [saved, setSaved] = useState(false)

  function handleSave(e) {
    e.preventDefault()
    saveSettings({ companyName, signature, messageTemplate })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleReset() {
    setMessageTemplate(DEFAULT_TEMPLATE)
  }

  return (
    <Layout title="Configurações — WhatsApp">
      <div className="max-w-2xl space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle size={20} className="text-green-500" strokeWidth={1.75} />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">WhatsApp</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Personalize a mensagem usada nas cobranças. As alterações são salvas localmente no seu navegador.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">

          {/* Nome da empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nome da empresa
            </label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Ex: Marketing Digital Ltda"
              className={inputCls}
            />
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
              Aparecerá nas mensagens via placeholder <code className="font-mono">{'{empresa}'}</code>.
            </p>
          </div>

          {/* Assinatura */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Assinatura padrão
            </label>
            <input
              type="text"
              value={signature}
              onChange={e => setSignature(e.target.value)}
              placeholder="Ex: Equipe de Atendimento"
              className={inputCls}
            />
          </div>

          {/* Placeholders info */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 px-4 py-3">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2.5">
              Placeholders disponíveis
            </p>
            <div className="space-y-1.5">
              {PLACEHOLDERS.map(({ key, desc }) => (
                <div key={key} className="flex items-center gap-3">
                  <code className="text-xs font-mono text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800/40 px-1.5 py-0.5 rounded shrink-0">
                    {key}
                  </code>
                  <span className="text-xs text-blue-600 dark:text-blue-400">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Template da mensagem */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Mensagem padrão
              </label>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <RotateCcw size={11} />
                Restaurar padrão
              </button>
            </div>
            <textarea
              value={messageTemplate}
              onChange={e => setMessageTemplate(e.target.value)}
              rows={11}
              className={`${inputCls} resize-none font-mono text-xs leading-relaxed`}
            />
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
              Use os placeholders acima para inserir dados dinâmicos do pagamento.
            </p>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            <Save size={14} />
            {saved ? '✓ Salvo!' : 'Salvar configurações'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
