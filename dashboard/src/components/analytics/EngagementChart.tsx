import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ChartPoint } from '../../hooks/useAnalytics'
import styles from './EngagementChart.module.scss'

interface EngagementChartProps {
  data: ChartPoint[]
}

// ── Custom dot ──────────────────────────────────────────────

function CustomDot(props: any) {
  const { cx, cy } = props
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#fff"
      stroke="#2563eb"
      strokeWidth={2}
    />
  )
}

// ── Custom tooltip ──────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipDate}>{label}</p>
      <p className={styles.tooltipValue}>
        {payload[0].value}% reply rate
      </p>
    </div>
  )
}

// ── EngagementChart ─────────────────────────────────────────

export function EngagementChart({ data }: EngagementChartProps) {
  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Daily Reply Rate Trend</h3>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="replyRate"
              stroke="#2563eb"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
