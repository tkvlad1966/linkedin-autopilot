import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ChartPoint } from '../../hooks/useAnalytics'
import styles from './ActivityChart.module.scss'

interface ActivityChartProps {
  data: ChartPoint[]
}

// ── Custom tooltip ──────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipDate}>{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} className={styles.tooltipRow}>
          <span
            className={styles.tooltipDot}
            style={{ background: entry.color }}
          />
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ── ActivityChart ───────────────────────────────────────────

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Activity Overview</h3>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="gradConnections" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradMessages" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0891b2" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#0891b2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="connectionsSent"
              name="Connections"
              stroke="#2563eb"
              strokeWidth={2}
              fill="url(#gradConnections)"
            />
            <Area
              type="monotone"
              dataKey="messagesSent"
              name="Messages"
              stroke="#0891b2"
              strokeWidth={2}
              fill="url(#gradMessages)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
