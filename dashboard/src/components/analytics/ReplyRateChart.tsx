import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import type { CampaignStat } from '../../hooks/useAnalytics'
import styles from './ReplyRateChart.module.scss'

interface ReplyRateChartProps {
  data: CampaignStat[]
}

// ── Color interpolation: red (0%) → amber (30%) → green (60%+) ──

function rateColor(rate: number): string {
  if (rate >= 60) return '#22c55e'   // green-500
  if (rate >= 30) return '#f59e0b'   // amber-400
  return '#f87171'                    // red-400
}

// ── Custom tooltip ──────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipName}>{d.name}</p>
      <p className={styles.tooltipValue}>{d.replyRate}% reply rate</p>
      <p className={styles.tooltipDetail}>
        {d.replied} / {d.messaged} messaged
      </p>
    </div>
  )
}

// ── ReplyRateChart ──────────────────────────────────────────

export function ReplyRateChart({ data }: ReplyRateChartProps) {
  const chartData = data
    .filter((c) => c.messaged > 0)
    .sort((a, b) => b.replyRate - a.replyRate)
    .slice(0, 8)
    .map((c) => ({
      ...c,
      name: c.name.length > 20 ? c.name.slice(0, 20) + '…' : c.name,
    }))

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Reply Rate by Campaign</h3>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 40, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={false}
              unit="%"
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-2)' }} />
            <Bar dataKey="replyRate" radius={[0, 4, 4, 0]} barSize={24}>
              {chartData.map((entry) => (
                <Cell key={entry.id} fill={rateColor(entry.replyRate)} />
              ))}
              <LabelList
                dataKey="replyRate"
                position="insideRight"
                formatter={(v: number) => `${v}%`}
                style={{ fontSize: 11, fontWeight: 600, fill: '#fff' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
