import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { useWorkspace } from '../../hooks/useWorkspace.js'
import { useTheme } from '../../context/ThemeContext.jsx'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500 dark:text-gray-400">{p.name}:</span>
          <span className="font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardRevenueChart({ data }) {
  const { workspaceType } = useWorkspace()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const title = workspaceType === 'estetica' ? 'Faturamento — últimos 6 meses' : 'Receita — últimos 6 meses'

  if (!data || data.length === 0) return null

  const tickColor = isDark ? '#6b7280' : '#9ca3af'
  const gridColor = isDark ? '#1f2937' : '#f0f0f0'
  const cursorStroke = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{title}</p>
      <div className="h-[260px] min-h-[260px]">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: tickColor }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: tickColor }}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: cursorStroke, strokeWidth: 1 }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconSize={8}
              iconType="circle"
              wrapperStyle={{ fontSize: 11, paddingBottom: 8, color: tickColor }}
            />
            <Line
              type="monotone"
              dataKey="received"
              name="Recebido"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="pending"
              name="Previsto"
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
