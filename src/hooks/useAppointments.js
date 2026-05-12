import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from './useAuth.js'

export const APPOINTMENT_STATUS = [
  { value: 'agendado',   label: 'Agendado',   style: 'bg-blue-50 text-blue-700 ring-blue-200'       },
  { value: 'confirmado', label: 'Confirmado',  style: 'bg-violet-50 text-violet-700 ring-violet-200' },
  { value: 'realizado',  label: 'Realizado',   style: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { value: 'faltou',     label: 'Faltou',      style: 'bg-amber-50 text-amber-700 ring-amber-200'    },
  { value: 'cancelado',  label: 'Cancelado',   style: 'bg-gray-100 text-gray-500 ring-gray-200'      },
]

const SELECT_APPT = '*, client:clients(id,name), service:service_catalog(id,name)'

export function useAppointments() {
  const { user } = useAuth()

  async function createAppointment(fields) {
    const { data, error } = await supabase
      .from('appointments')
      .insert({ ...fields, user_id: user.id })
      .select(SELECT_APPT)
      .single()
    if (error) { console.error('[useAppointments] create:', error); throw error }
    return data
  }

  async function updateAppointment(id, fields) {
    const { data, error } = await supabase
      .from('appointments')
      .update(fields)
      .eq('id', id)
      .select(SELECT_APPT)
      .single()
    if (error) { console.error('[useAppointments] update:', error); throw error }
    return data
  }

  async function deleteAppointment(id) {
    const { error } = await supabase.from('appointments').delete().eq('id', id)
    if (error) { console.error('[useAppointments] delete:', error); throw error }
  }

  async function updateStatus(id, status) {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select(SELECT_APPT)
      .single()
    if (error) { console.error('[useAppointments] updateStatus:', error); throw error }
    return data
  }

  async function markAsRealizado(appointment) {
    const data = await updateStatus(appointment.id, 'realizado')

    if (appointment.contract_id) {
      const { data: contract, error: cErr } = await supabase
        .from('contracts')
        .select('total_sessions, completed_sessions')
        .eq('id', appointment.contract_id)
        .single()

      if (!cErr && contract?.total_sessions) {
        const current = contract.completed_sessions ?? 0
        if (current < contract.total_sessions) {
          const { error: uErr } = await supabase
            .from('contracts')
            .update({ completed_sessions: current + 1 })
            .eq('id', appointment.contract_id)
          if (uErr) console.error('[useAppointments] session increment:', uErr)
        }
      }
    }

    return data
  }

  return { createAppointment, updateAppointment, deleteAppointment, updateStatus, markAsRealizado }
}
