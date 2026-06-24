import { useState } from 'react'
import { X, MessageCircle, Phone, AlertCircle } from 'lucide-react'
import { useWhatsappSettings } from '../../hooks/useWhatsappSettings.js'
import { useWhatsappLogs } from '../../hooks/useWhatsappLogs.js'
import { formatPhone, buildWhatsappLink, buildMessage } from '../../utils/whatsapp.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { formatDateBR } from '../../utils/dateHelpers.js'
import { effectiveStatus } from '../../hooks/usePayments.js'

/**
 * payment must have: id, amount, due_date, notes, status
 * payment.client (optional): id, name, company_name, whatsapp
 * If payment.client is missing, pass clientData prop with the same shape.
 */
export default function WhatsappChargeModal({ payment, clientData, onClose }) {
  const { settings } = useWhatsappSettings()
  const { createLog } = useWhatsappLogs()

  const client   = payment.client ?? clientData
  const rawPhone = client?.whatsapp
  const phone    = formatPhone(rawPhone)
  const effStatus = effectiveStatus(payment)

  const defaultMessage = buildMessage(settings.messageTemplate, {
    nome:       client?.name || 'Cliente',
    empresa:    client?.company_name || '',
    valor:      Number(payment.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    vencimento: formatDateBR(payment.due_date),
    servico:    payment.notes || 'serviços prestados',
  })

  const [message, setMessage] = useState(defaultMessage)
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!phone) return
    setSending(true)
    const link = buildWhatsappLink(phone, message)
    window.open(link, '_blank', 'noopener,noreferrer')
    try {
      await createLog({
        client_id:  client?.id  ?? null,
        payment_id: payment.id  ?? null,
        phone,
        message,
      })
    } catch (err) {
      console.error('WhatsApp log error:', err)
    }
    setSending(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-green-500" strokeWidth={1.75} />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Enviar cobrança via WhatsApp</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Client info */}
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 space-y-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {client?.name || <span className="italic text-gray-400">Sem cliente</span>}
            </p>
            {client?.company_name && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{client.company_name}</p>
            )}
            <div className="flex items-center gap-1.5 mt-1">
              <Phone size={11} className="text-gray-400 shrink-0" />
              {phone ? (
                <span className="text-xs text-gray-600 dark:text-gray-300 font-mono">+{phone}</span>
              ) : (
                <span className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={10} />
                  Cliente não possui WhatsApp cadastrado.
                </span>
              )}
            </div>
          </div>

          {/* Payment summary */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(payment.amount)}</span>
            <span>·</span>
            <span>Venc: {formatDateBR(payment.due_date)}</span>
            {effStatus === 'atrasado' && (
              <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-semibold">
                Atrasado
              </span>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Mensagem
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={9}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
            />
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
              Edite a mensagem antes de enviar se necessário.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={!phone || sending || !message.trim()}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-500 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <MessageCircle size={15} />
            {sending ? 'Abrindo…' : 'Enviar no WhatsApp'}
          </button>
        </div>

      </div>
    </div>
  )
}
