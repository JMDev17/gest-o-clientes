import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isConfigured } from './lib/supabaseClient.js'
import MissingConfig from './components/MissingConfig.jsx'
import Login from './pages/Login.jsx'
import SetupWorkspace from './pages/SetupWorkspace.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Clients from './pages/Clients.jsx'
import ClientDetails from './pages/ClientDetails.jsx'
import Payments from './pages/Payments.jsx'
import Tasks from './pages/Tasks.jsx'
import ContentTracking from './pages/ContentTracking.jsx'
import Calendar from './pages/Calendar.jsx'
import Contracts from './pages/Contracts.jsx'
import ServiceCatalog from './pages/ServiceCatalog.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import ProfileGate from './routes/ProfileGate.jsx'

// Módulo Financeiro
import FinanceiroDashboard    from './pages/financeiro/FinanceiroDashboard.jsx'
import EmpresaFinancas        from './pages/financeiro/EmpresaFinancas.jsx'
import ProLabore              from './pages/financeiro/ProLabore.jsx'
import FluxoCaixa             from './pages/financeiro/FluxoCaixa.jsx'
import RelatoriosFinanceiros  from './pages/financeiro/RelatoriosFinanceiros.jsx'
// Configurações
import WhatsappSettings from './pages/WhatsappSettings.jsx'

export default function App() {
  if (!isConfigured) return <MissingConfig />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/setup-workspace" element={<SetupWorkspace />} />

          <Route element={<ProfileGate />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientDetails />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/content" element={<ContentTracking />} />
            <Route path="/services" element={<ServiceCatalog />} />
            <Route path="/calendar" element={<Calendar />} />
            {/* Módulo Financeiro */}
            <Route path="/financeiro"                element={<FinanceiroDashboard />} />
            <Route path="/financeiro/empresa"        element={<EmpresaFinancas />} />
            <Route path="/financeiro/pessoal"        element={<ProLabore />} />
            <Route path="/financeiro/fluxo"          element={<FluxoCaixa />} />
            <Route path="/financeiro/relatorios"     element={<RelatoriosFinanceiros />} />
            {/* Configurações */}
            <Route path="/configuracoes"             element={<WhatsappSettings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
