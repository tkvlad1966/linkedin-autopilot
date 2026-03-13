import { useMemo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import styles from './KPICard.module.scss'

interface KPICardProps {
  label: string
  value: string | number
  trend: number          // % change
  sparklineData?: number[]
  isLoading?: boolean
}

// ── Sparkline (pure SVG, 7 points) ──────────────────────────

function Sparkline({ data }: { data: number[] }) {
  const width = 80
  const height = 28
  const padding = 2

  const path = useMemo(() => {
    if (data.length < 2) return ''
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1

    const points = data.map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2)
      const y = padding + (1 - (v - min) / range) * (height - padding * 2)
      return `${x},${y}`
    })

    return `M${points.join(' L')}`
  }, [data])

  if (data.length < 2) return null

  return (
    <svg
      className={styles.sparkline}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
    >
      <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />
    </svg>
  )
}

// ── Skeleton loader ─────────────────────────────────────────

function Skeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.skeletonLabel} />
      <div className={styles.skeletonValue} />
      <div className={styles.skeletonTrend} />
    </div>
  )
}

// ── KPICard ─────────────────────────────────────────────────

export function KPICard({ label, value, trend, sparklineData, isLoading }: KPICardProps) {
  if (isLoading) return <Skeleton />

  const isPositive = trend >= 0

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        {sparklineData && <Sparkline data={sparklineData} />}
      </div>
      <div className={styles.value}>{value}</div>
      <div className={`${styles.trend} ${isPositive ? styles.trendUp : styles.trendDown}`}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{Math.abs(trend).toFixed(1)}% vs last period</span>
      </div>
    </div>
  )
}
