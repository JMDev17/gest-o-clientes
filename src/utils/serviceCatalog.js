export const SERVICE_CATEGORIES = [
  { value: 'facial',    label: 'Facial'    },
  { value: 'corporal',  label: 'Corporal'  },
  { value: 'injetavel', label: 'Injetável' },
  { value: 'massagem',  label: 'Massagem'  },
  { value: 'pacote',    label: 'Pacote'    },
  { value: 'outro',     label: 'Outro'     },
]

export const CATEGORY_STYLE = {
  facial:    'bg-pink-50 text-pink-700 ring-pink-200',
  corporal:  'bg-violet-50 text-violet-700 ring-violet-200',
  injetavel: 'bg-blue-50 text-blue-700 ring-blue-200',
  massagem:  'bg-amber-50 text-amber-700 ring-amber-200',
  pacote:    'bg-emerald-50 text-emerald-700 ring-emerald-200',
  outro:     'bg-gray-100 text-gray-500 ring-gray-200',
}

export function categoryLabel(value) {
  return SERVICE_CATEGORIES.find(c => c.value === value)?.label ?? value ?? '—'
}

export function formatBRL(value) {
  if (value == null || value === '') return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
