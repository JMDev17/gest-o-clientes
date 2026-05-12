import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from './useAuth.js'
import { isBeforeToday } from '../utils/dateHelpers.js'

export const EVENT_CONFIG = {
  appointment:      { label: 'Agendamento', chipStyle: 'bg-violet-100 text-violet-800',  dotColor: 'bg-violet-500'  },
  task:             { label: 'Tarefa',      chipStyle: 'bg-blue-100 text-blue-800',       dotColor: 'bg-blue-500'    },
  contract:         { label: 'Vencimento',  chipStyle: 'bg-emerald-100 text-emerald-800', dotColor: 'bg-emerald-500' },
  // payment visual configs keyed by effective status — looked up as `payment_${paymentStatus}`
  payment:          { label: 'Pagamento',   chipStyle: 'bg-amber-100 text-amber-800',     dotColor: 'bg-amber-500'   },
  payment_pendente: { label: 'Pagamento',   chipStyle: 'bg-amber-100 text-amber-800',     dotColor: 'bg-amber-500'   },
  payment_atrasado: { label: 'Atrasado',    chipStyle: 'bg-red-100 text-red-800',         dotColor: 'bg-red-500'     },
  payment_pago:     { label: 'Recebido',    chipStyle: 'bg-emerald-100 text-emerald-800', dotColor: 'bg-emerald-500' },
  payment_cancelado:{ label: 'Cancelado',   chipStyle: 'bg-gray-100 text-gray-600',       dotColor: 'bg-gray-400'    },
}

function effectivePaymentStatus(p) {
  if (p.status === 'pago' || p.status === 'cancelado') return p.status
  if (isBeforeToday(p.due_date)) return 'atrasado'
  return 'pendente'
}

function toEvent(type, raw, { date, title, clientName, status }, extra = {}) {
  return { id: `${type}-${raw.id}`, type, title, date, status: status ?? '', clientName: clientName ?? null, raw, ...extra }
}

async function safeQuery(promise) {
  const { data, error } = await promise
  if (error) console.error('[useCalendarEvents] query error:', error)
  return data ?? []
}

export function useCalendarEvents({ startDate, endDate, workspaceType }) {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!user || !startDate || !endDate) return
    setLoading(true)
    try {
      const [tasks, payments, contracts, appointments] = await Promise.all([
        safeQuery(
          supabase.from('tasks')
            .select('*, client:clients(id,name)')
            .gte('due_date', startDate)
            .lte('due_date', endDate)
        ),
        safeQuery(
          supabase.from('payments')
            .select('*, client:clients(id,name)')
            // fetch by due_date range (pending/overdue) OR paid_date range (paid)
            .or(`and(due_date.gte.${startDate},due_date.lte.${endDate}),and(paid_date.gte.${startDate},paid_date.lte.${endDate})`)
        ),
        safeQuery(
          supabase.from('contracts')
            .select('*, client:clients(id,name)')
            .eq('contract_type', workspaceType)
            .gte('end_date', startDate)
            .lte('end_date', endDate)
        ),
        workspaceType === 'estetica'
          ? safeQuery(
              supabase.from('appointments')
                .select('*, client:clients(id,name), service:service_catalog(id,name)')
                .gte('appointment_date', startDate)
                .lte('appointment_date', endDate)
                .order('start_time', { ascending: true, nullsFirst: false })
            )
          : Promise.resolve([]),
      ])

      setEvents([
        ...appointments.map(a => toEvent('appointment', a, {
          date: a.appointment_date,
          title: a.title,
          clientName: a.client?.name,
          status: a.status,
        })),
        ...tasks.map(t => toEvent('task', t, {
          date: t.due_date,
          title: t.title,
          clientName: t.client?.name,
          status: t.status,
        })),
        ...payments.map(p => {
          const payStatus  = effectivePaymentStatus(p)
          const eventDate  = payStatus === 'pago' ? (p.paid_date || p.due_date) : p.due_date
          return toEvent('payment', p, {
            date: eventDate,
            title: p.description || 'Pagamento',
            clientName: p.client?.name,
            status: p.status,
          }, { paymentStatus: payStatus })
        }),
        ...contracts.map(c => toEvent('contract', c, {
          date: c.end_date,
          title: `Venc.: ${c.name}`,
          clientName: c.client?.name,
          status: c.status,
        })),
      ])
    } catch (err) {
      console.error('[useCalendarEvents] load:', err)
    } finally {
      setLoading(false)
    }
  }, [user, startDate, endDate, workspaceType])

  useEffect(() => { load() }, [load])

  return { events, loading, reload: load }
}
