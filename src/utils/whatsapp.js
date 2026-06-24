export const DEFAULT_TEMPLATE = `Olá, {nome}!

Passando para lembrar que o pagamento referente a "{servico}" possui vencimento em {vencimento}.

Valor: R$ {valor}

Qualquer dúvida estou à disposição.

Obrigado!`

/**
 * Formats a raw Brazilian phone string to the international format (55XXXXXXXXXXX).
 * Strips spaces, parentheses, and dashes; prepends 55 if not present.
 * Returns null if the raw input is empty or produces no digits.
 */
export function formatPhone(raw) {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return '55' + digits
}

export function buildWhatsappLink(phone, message) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function buildMessage(template, vars) {
  return (template || DEFAULT_TEMPLATE)
    .replace(/\{nome\}/g,       vars.nome       || '')
    .replace(/\{empresa\}/g,    vars.empresa    || '')
    .replace(/\{valor\}/g,      vars.valor      || '')
    .replace(/\{vencimento\}/g, vars.vencimento || '')
    .replace(/\{servico\}/g,    vars.servico    || '')
}
