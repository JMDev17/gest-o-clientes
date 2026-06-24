// Only photo and post are tracked in the UI
export const CONTENT_TYPES = [
  { value: 'photo', label: 'Foto',     shortLabel: 'Fotos' },
  { value: 'post',  label: 'Postagem', shortLabel: 'Postagens' },
]

export const PLAN_METRICS = [
  { key: 'photos_per_week', type: 'photo', label: 'Fotos/sem',     shortLabel: 'fotos' },
  { key: 'posts_per_week',  type: 'post',  label: 'Postagens/sem', shortLabel: 'postagens' },
]

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Week starts on Sunday. weekOffset: 0 = current, -1 = previous, etc.
export function getWeekBounds(weekOffset = 0) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay() + weekOffset * 7)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end, startStr: toDateStr(start), endStr: toDateStr(end) }
}

export function formatWeekLabel(weekBounds) {
  const fmt = d =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
  return `${fmt(weekBounds.start)} – ${fmt(weekBounds.end)}`
}

function countType(logs, type) {
  return logs
    .filter(l => l.content_type === type)
    .reduce((s, l) => s + (l.quantity ?? 1), 0)
}

// Returns metrics array with goal/done/remaining for each tracked type
export function computeMetrics(plan, logs) {
  return PLAN_METRICS.map(m => {
    const goal      = plan ? (plan[m.key] ?? 0) : 0
    const done      = countType(logs, m.type)
    const remaining = Math.max(0, goal - done)
    return { ...m, goal, done, remaining }
  }).filter(m => m.goal > 0)
}

// Overall status for a client given their plan and this week's logs
export function computeWeekStatus(plan, logs, weekOffset = 0) {
  if (!plan || !plan.is_active) return 'sem_plano'

  const photosGoal = plan.photos_per_week ?? 0
  const postsGoal  = plan.posts_per_week  ?? 0
  const totalGoal  = photosGoal + postsGoal

  if (totalGoal === 0) return 'sem_meta'

  const photosDone = countType(logs, 'photo')
  const postsDone  = countType(logs, 'post')

  const allMet =
    (photosGoal === 0 || photosDone >= photosGoal) &&
    (postsGoal  === 0 || postsDone  >= postsGoal)

  if (allMet) return 'meta_batida'

  const totalDone = photosDone + postsDone

  if (weekOffset < 0) return totalDone > 0 ? 'em_dia' : 'atrasado'

  // Current week: late (Thu+) with zero activity → atrasado
  const dayOfWeek = new Date().getDay()
  if (totalDone === 0 && dayOfWeek >= 4) return 'atrasado'
  if (totalDone === 0) return 'pendente'
  return 'em_dia'
}

export const STATUS_CONFIG = {
  meta_batida: { label: 'Meta batida', style: 'bg-emerald-50 text-emerald-700 ring-emerald-200', sortOrder: 3 },
  em_dia:      { label: 'Em dia',      style: 'bg-blue-50 text-blue-700 ring-blue-200',          sortOrder: 2 },
  pendente:    { label: 'Pendente',    style: 'bg-amber-50 text-amber-700 ring-amber-200',        sortOrder: 1 },
  atrasado:    { label: 'Atrasado',    style: 'bg-red-50 text-red-700 ring-red-200',              sortOrder: 0 },
  sem_plano:   { label: 'Sem plano',   style: 'bg-gray-100 text-gray-500 ring-gray-200',         sortOrder: 4 },
  sem_meta:    { label: 'Sem meta',    style: 'bg-gray-100 text-gray-500 ring-gray-200',         sortOrder: 5 },
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Returns 7-day array for the week, each with that day's logs
export function groupLogsByDay(logs, weekBounds) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekBounds.start)
    d.setDate(weekBounds.start.getDate() + i)
    const dateStr = toDateStr(d)
    const dayLogs = logs.filter(l => l.performed_at === dateStr)
    return {
      dateStr,
      dayName: DAY_NAMES[d.getDay()],
      logs: dayLogs,
      total: dayLogs.reduce((s, l) => s + (l.quantity ?? 1), 0),
    }
  })
}
