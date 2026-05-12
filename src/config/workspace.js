// ─────────────────────────────────────────────────────────────────────────────
// Configuração do workspace
// Para trocar o tipo de negócio, adicione no .env.local:
//   VITE_WORKSPACE_TYPE=marketing   (padrão)
//   VITE_WORKSPACE_TYPE=estetica
// ─────────────────────────────────────────────────────────────────────────────

export const WORKSPACE_TYPES = ['marketing', 'estetica']

export const configs = {
  marketing: {
    appName: 'ClientHub',

    client: {
      singular:  'Cliente',
      plural:    'Clientes',
      newLabel:  'Novo cliente',
      editLabel: 'Editar cliente',
    },

    nav: [
      { to: '/dashboard',  label: 'Dashboard',   icon: 'LayoutDashboard' },
      { to: '/clients',    label: 'Clientes',    icon: 'Users' },
      { to: '/contracts',  label: 'Contratos',   icon: 'FileText' },
      { to: '/payments',   label: 'Pagamentos',  icon: 'CreditCard' },
      { to: '/financeiro', label: 'Financeiro',  icon: 'BarChart3' },
      { to: '/tasks',      label: 'Tarefas',     icon: 'CheckSquare' },
      { to: '/content',    label: 'Conteúdo',    icon: 'Newspaper' },
      { to: '/calendar',   label: 'Calendário',  icon: 'CalendarDays' },
    ],

    fields: {
      name:         { label: 'Empresa',               placeholder: 'Ex: Agência XYZ, Boutique da Ana' },
      company_name: { label: 'Nome do responsável',   placeholder: 'Ex: João Silva' },
      niche:        { label: 'Nicho / Segmento',      placeholder: 'Ex: E-commerce, Saúde' },
      city:         { label: 'Cidade',                placeholder: 'Ex: São Paulo' },
      whatsapp:     { label: 'WhatsApp',              placeholder: '(11) 99999-9999' },
      notes:        { label: 'Observações',           placeholder: 'Informações adicionais sobre o cliente...' },
    },

    statusOptions: [
      { value: 'ativo',     label: 'Ativo',      style: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
      { value: 'inativo',   label: 'Inativo',    style: 'bg-gray-100 text-gray-500 ring-gray-200' },
      { value: 'prospecto', label: 'Prospecto',  style: 'bg-violet-50 text-violet-700 ring-violet-200' },
    ],

    dashboard: {
      stats: [
        { label: 'Clientes ativos',    icon: 'Users',       color: 'violet',  key: 'activeClients'   },
        { label: 'Receita do mês',     icon: 'TrendingUp',  color: 'emerald', key: 'monthRevenue'    },
        { label: 'Pgtos. pendentes',   icon: 'CreditCard',  color: 'amber',   key: 'pendingPayments' },
        { label: 'Tarefas abertas',    icon: 'CheckSquare', color: 'blue',    key: 'openTasks'       },
      ],
    },

    payments: {
      clientLabel:      'Cliente',
      descriptionLabel: 'Serviço / Gestão',
      dueDateLabel:     'Vencimento',
      amountLabel:      'Valor mensal',
    },

    tasks: {
      pageTitle:   'Tarefas',
      clientLabel: 'Cliente',
      typeLabel:   'Tipo de tarefa',
      dueDateLabel:'Data limite',
      newLabel:    'Nova tarefa',
      types: [
        { value: 'postagem',  label: 'Postagem' },
        { value: 'foto',      label: 'Foto / Conteúdo' },
        { value: 'conteudo',  label: 'Conteúdo' },
        { value: 'avaliacao', label: 'Avaliação' },
        { value: 'relatorio', label: 'Relatório' },
        { value: 'seo',       label: 'SEO' },
        { value: 'site',      label: 'Site' },
        { value: 'gmn',       label: 'Google Meu Negócio' },
        { value: 'outro',     label: 'Outro' },
      ],
    },

    pages: {
      tasks:    { title: 'Tarefas',      subtitle: 'Gerencie tarefas e entregas dos seus clientes' },
      payments: { title: 'Pagamentos',   subtitle: 'Controle de cobranças e recebimentos' },
      calendar: { title: 'Calendário Operacional', subtitle: 'Tarefas, pagamentos e vencimentos no tempo' },
      contracts:{ title: 'Contratos',    subtitle: 'Gestão de contratos e mensalidades' },
      financialReports: { title: 'Financeiro', subtitle: 'Análise de receitas, pagamentos e inadimplência' },
    },

    reports: {
      clientLabel:   'Cliente',
      contractLabel: 'Contrato',
      revenueLabel:  'Receita mensal',
    },
    
    contracts: {
      pageTitle:     'Contratos',
      itemLabel:     'contrato',
      newLabel:      'Novo contrato',
      durationLabel: 'Duração (meses)',
      amountLabel:   'Valor recorrente',
      remainingLabel:'Meses restantes',
      totalLabel:    'Valor do contrato',
    },
  },

  estetica: {
    appName: 'Clínica Pro',

    client: {
      singular:  'Paciente',
      plural:    'Pacientes',
      newLabel:  'Nova paciente',
      editLabel: 'Editar paciente',
    },

    nav: [
      { to: '/dashboard',  label: 'Dashboard',    icon: 'LayoutDashboard' },
      { to: '/clients',    label: 'Pacientes',    icon: 'Users' },
      { to: '/contracts',  label: 'Pacotes',      icon: 'FileText' },
      { to: '/payments',   label: 'Pagamentos',   icon: 'CreditCard' },
      { to: '/financeiro', label: 'Faturamento',  icon: 'BarChart3' },
      { to: '/tasks',      label: 'Retornos',     icon: 'RefreshCw' },
      { to: '/services',   label: 'Serviços',     icon: 'Scissors' },
      { to: '/calendar',   label: 'Agendamentos', icon: 'CalendarDays' },
    ],

    fields: {
      name:         { label: 'Nome da paciente',          placeholder: 'Ex: Ana Lima' },
      company_name: { label: 'Procedimento de interesse', placeholder: 'Ex: Limpeza de pele, Botox' },
      niche:        { label: 'Como nos conheceu',         placeholder: 'Ex: Instagram, indicação' },
      city:         { label: 'Cidade / Bairro',           placeholder: 'Ex: Moema, SP' },
      whatsapp:     { label: 'WhatsApp',                  placeholder: '(11) 99999-9999' },
      notes:        { label: 'Observações clínicas',      placeholder: 'Alergias, histórico, preferências da paciente...' },
    },

    statusOptions: [
      { value: 'ativo',        label: 'Ativa',         style: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
      { value: 'em_avaliacao', label: 'Em avaliação',  style: 'bg-amber-50 text-amber-700 ring-amber-200' },
      { value: 'retornou',     label: 'Retornou',      style: 'bg-violet-50 text-violet-700 ring-violet-200' },
      { value: 'inativo',      label: 'Inativa',       style: 'bg-gray-100 text-gray-500 ring-gray-200' },
    ],

    dashboard: {
      stats: [
        { label: 'Pacientes ativas',    icon: 'Users',        color: 'violet',  key: 'activeClients'     },
        { label: 'Agendamentos/semana', icon: 'CalendarDays', color: 'blue',    key: 'weekTasks'         },
        { label: 'Retornos pendentes',  icon: 'RefreshCw',    color: 'amber',   key: 'openTasks'         },
        { label: 'Sessões restantes',   icon: 'Activity',     color: 'emerald', key: 'remainingSessions' },
        { label: 'Pgtos. pendentes',    icon: 'CreditCard',   color: 'amber',   key: 'pendingPayments'   },
        { label: 'Faturamento do mês',  icon: 'TrendingUp',   color: 'emerald', key: 'monthRevenue'      },
      ],
    },

    payments: {
      clientLabel:      'Paciente / Cliente',
      descriptionLabel: 'Procedimento',
      dueDateLabel:     'Data de vencimento',
      amountLabel:      'Valor do atendimento',
    },

    tasks: {
      pageTitle:   'Retornos e Tarefas',
      clientLabel: 'Paciente / Cliente',
      typeLabel:   'Tipo de acompanhamento',
      dueDateLabel:'Data de retorno',
      newLabel:    'Nova tarefa',
      types: [
        { value: 'retorno',          label: 'Retorno' },
        { value: 'confirmacao',      label: 'Confirmação de agenda' },
        { value: 'pos_atendimento',  label: 'Pós-atendimento' },
        { value: 'avaliacao',        label: 'Avaliação' },
        { value: 'procedimento',     label: 'Procedimento' },
        { value: 'pagamento',        label: 'Cobrança / Pagamento' },
        { value: 'outro',            label: 'Outro' },
      ],
    },

    pages: {
      tasks:    { title: 'Retornos',     subtitle: 'Acompanhamento e retornos de pacientes' },
      payments: { title: 'Pagamentos',   subtitle: 'Controle de cobranças e recebimentos' },
      calendar: { title: 'Agenda da Clínica', subtitle: 'Agendamentos, retornos e procedimentos' },
      contracts:{ title: 'Pacotes',      subtitle: 'Gestão de pacotes de procedimentos' },
      financialReports: { title: 'Faturamento', subtitle: 'Análise de faturamento e pagamentos de pacientes' },
    },

    reports: {
      clientLabel:   'Paciente/Cliente',
      contractLabel: 'Pacote',
      revenueLabel:  'Faturamento',
    },

    contracts: {
      pageTitle:     'Pacotes',
      itemLabel:     'pacote',
      newLabel:      'Novo pacote',
      durationLabel: 'Total de sessões',
      amountLabel:   'Valor do pacote',
      remainingLabel:'Sessões restantes',
      totalLabel:    'Valor total',
    },
  },
}

