const formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatCurrency(value) {
  if (value == null || isNaN(value)) return '—'
  return formatter.format(value)
}
