import { Download } from 'lucide-react'
import { buildCsvRows, downloadCsv } from '../../utils/financialReports.js'

export default function ExportCsvButton({ payments, month }) {
  function handleExport() {
    const rows = buildCsvRows(payments)
    if (!rows.length) return
    const suffix = month || 'todos'
    downloadCsv(rows, `relatorio-financeiro-${suffix}.csv`)
  }

  return (
    <button
      onClick={handleExport}
      disabled={payments.length === 0}
      className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <Download size={14} strokeWidth={2} />
      Exportar CSV
    </button>
  )
}
