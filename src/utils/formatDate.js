import { formatDateBR } from './dateHelpers.js'

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(value) {
  return formatDateBR(value)
}

export function formatDateTime(value) {
  if (!value) return '—'
  return dateTimeFormatter.format(new Date(value))
}
