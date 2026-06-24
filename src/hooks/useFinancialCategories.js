import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from './useAuth.js'

const COMPANY_DEFAULTS = [
  { name: 'Marketing',    color: '#8b5cf6', is_system: false },
  { name: 'Ferramentas',  color: '#6366f1', is_system: false },
  { name: 'Impostos',     color: '#ef4444', is_system: false },
  { name: 'Internet',     color: '#3b82f6', is_system: false },
  { name: 'Energia',      color: '#f59e0b', is_system: false },
  { name: 'Telefone',     color: '#10b981', is_system: false },
  { name: 'Equipamentos', color: '#06b6d4', is_system: false },
  { name: 'Serviços',     color: '#ec4899', is_system: false },
  { name: 'Terceiros',    color: '#f97316', is_system: false },
  { name: 'Pró-labore',   color: '#14b8a6', is_system: true  },
  { name: 'Outros',       color: '#6b7280', is_system: false },
]

const PERSONAL_DEFAULTS = [
  { name: 'Alimentação',      color: '#f97316', is_system: false },
  { name: 'Moradia',          color: '#8b5cf6', is_system: false },
  { name: 'Transporte',       color: '#3b82f6', is_system: false },
  { name: 'Saúde',            color: '#10b981', is_system: false },
  { name: 'Lazer',            color: '#ec4899', is_system: false },
  { name: 'Educação',         color: '#6366f1', is_system: false },
  { name: 'Igreja / Doações', color: '#f59e0b', is_system: false },
  { name: 'Investimentos',    color: '#06b6d4', is_system: false },
  { name: 'Pró-labore',       color: '#14b8a6', is_system: true  },
  { name: 'Outros',           color: '#6b7280', is_system: false },
]

export function useFinancialCategories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCategories = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)

    const { data, error } = await supabase
      .from('financial_categories')
      .select('*')
      .order('name')

    if (!error) {
      if (!data || data.length === 0) {
        await seedDefaults(user.id)
        const { data: seeded } = await supabase
          .from('financial_categories')
          .select('*')
          .order('name')
        setCategories(seeded ?? [])
      } else {
        setCategories(data)
      }
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  async function seedDefaults(userId) {
    const rows = [
      ...COMPANY_DEFAULTS.map(c => ({ ...c, scope: 'company', user_id: userId })),
      ...PERSONAL_DEFAULTS.map(c => ({ ...c, scope: 'personal', user_id: userId })),
    ]
    await supabase.from('financial_categories').insert(rows)
  }

  async function createCategory({ scope, name, color }) {
    const { data, error } = await supabase
      .from('financial_categories')
      .insert({ scope, name, color: color || '#6b7280', is_system: false, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')))
    return data
  }

  async function updateCategory(id, fields) {
    const { data, error } = await supabase
      .from('financial_categories')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setCategories(prev => prev.map(c => c.id === id ? data : c))
    return data
  }

  async function deleteCategory(id) {
    const { error } = await supabase
      .from('financial_categories')
      .delete()
      .eq('id', id)
    if (error) throw error
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  const companyCategories  = categories.filter(c => c.scope === 'company')
  const personalCategories = categories.filter(c => c.scope === 'personal')

  return {
    categories,
    companyCategories,
    personalCategories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  }
}
