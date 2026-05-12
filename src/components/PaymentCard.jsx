import { formatCurrency } from '../utils/formatCurrency.js'
import { formatDate } from '../utils/formatDate.js'

// Placeholder — será implementado junto com o CRUD de pagamentos

export default function PaymentCard({ payment }) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm border border-gray-100 dark:border-gray-800">
      <p className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(payment?.amount)}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(payment?.date)}</p>
    </div>
  )
}
