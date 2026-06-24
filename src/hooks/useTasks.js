import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from './useAuth.js'
import { isBeforeToday } from '../utils/dateHelpers.js'

export const TASK_STATUS = [
  { value: 'pendente',     label: 'Pendente',      style: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { value: 'em_andamento', label: 'Em andamento',  style: 'bg-blue-50 text-blue-700 ring-blue-200' },
  { value: 'concluida',    label: 'Concluída',     style: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { value: 'cancelada',    label: 'Cancelada',     style: 'bg-gray-100 text-gray-500 ring-gray-200' },
]

export const TASK_PRIORITY = [
  { value: 'alta',  label: 'Alta',  style: 'bg-red-50 text-red-700 ring-red-200' },
  { value: 'media', label: 'Média', style: 'bg-amber-50 text-amber-600 ring-amber-200' },
  { value: 'baixa', label: 'Baixa', style: 'bg-gray-50 text-gray-500 ring-gray-200' },
]

// Marks pending/in_progress tasks as 'atrasada' when past due_date
export function effectiveTaskStatus(task) {
  const done = task.status === 'concluida' || task.status === 'cancelada'
  if (done) return task.status
  if (isBeforeToday(task.due_date)) return 'atrasada'
  return task.status
}

function sortTasks(list) {
  const priorityOrder = { alta: 0, media: 1, baixa: 2 }
  return [...list].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    const dateDiff = new Date(a.due_date) - new Date(b.due_date)
    if (dateDiff !== 0) return dateDiff
    return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
  })
}

export function useTasks() {
  const { user } = useAuth()
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchTasks = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('tasks')
      .select('*, client:clients(id, name)')
      .order('due_date', { ascending: true, nullsFirst: false })

    if (err) {
      setError('Não foi possível carregar as tarefas.')
    } else {
      setTasks(data)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function createTask(fields) {
    const { data, error: err } = await supabase
      .from('tasks')
      .insert({ ...fields, user_id: user.id })
      .select('*, client:clients(id, name)')
      .single()
    if (err) throw err
    setTasks(prev => sortTasks([...prev, data]))
  }

  async function updateTask(id, fields) {
    const { data, error: err } = await supabase
      .from('tasks')
      .update(fields)
      .eq('id', id)
      .select('*, client:clients(id, name)')
      .single()
    if (err) throw err
    setTasks(prev => sortTasks(prev.map(t => (t.id === id ? data : t))))
  }

  async function deleteTask(id) {
    const { error: err } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
    if (err) throw err
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return { tasks, loading, error, createTask, updateTask, deleteTask }
}
