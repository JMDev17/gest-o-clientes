// Safe date utilities for YYYY-MM-DD strings stored in Supabase.
// NEVER use `new Date("YYYY-MM-DD")` — the spec treats date-only ISO strings
// as UTC, which shifts the displayed date by one day in UTC-3 (Brazil).
// All functions here use the local-time constructor `new Date(y, m, d)`.

export function parseLocalDate(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDateBR(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addMonthsToDate(dateStr, months) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  const result = new Date(y, m - 1 + months, d)
  return `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`
}

export function isBeforeToday(dateStr) {
  if (!dateStr) return false
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59) < new Date()
}
