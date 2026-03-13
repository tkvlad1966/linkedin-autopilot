import { useState, useMemo } from 'react'
import type { AnalyticsPeriod } from '../hooks/useAnalytics'
import { useAnalytics, useCampaignAnalytics } from '../hooks/useAnalytics'
import { KPICard } from '../components/analytics/KPICard'
import { ActivityChart } from '../components/analytics/ActivityChart'
import { ReplyRateChart } from '../components/analytics/ReplyRateChart'
import { EngagementChart } from '../components/analytics/EngagementChart'
import styles from './Analytics.module.scss'

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
]

export function Analytics() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d')
  const { data: analytics, isLoading } = useAnalytics(period)
  const { data: campaigns = [] } = useCampaignAnalytics()

  // Sparkline data (last 7 points per metric)
  const sparklines = useMemo(() => {
    if (!analytics?.chartData) return null
    const last7 = analytics.chartData.slice(-7)
    return {
      connections: last7.map((d) => d.connectionsSent),
      messages: last7.map((d) => d.messagesSent),
      replies: last7.map((d) => d.repliesReceived),
      replyRate: last7.map((d) => d.replyRate),
    }
  }, [analytics])

  // Top campaigns sorted by reply rate
  const topCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => b.replyRate - a.replyRate)
  }, [campaigns])

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Analytics</h1>
        <div className={styles.periodSelector}>
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`${styles.periodPill} ${period === p.value ? styles.periodActive : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1 — KPI Cards */}
      <div className={styles.kpiGrid}>
        <KPICard
          label="Connections Sent"
          value={analytics?.totals.connectionsSent ?? 0}
          trend={analytics?.trend.connectionsSent ?? 0}
          sparklineData={sparklines?.connections}
          isLoading={isLoading}
        />
        <KPICard
          label="Messages Sent"
          value={analytics?.totals.messagesSent ?? 0}
          trend={analytics?.trend.messagesSent ?? 0}
          sparklineData={sparklines?.messages}
          isLoading={isLoading}
        />
        <KPICard
          label="Reply Rate"
          value={`${(analytics?.totals.replyRate ?? 0).toFixed(1)}%`}
          trend={analytics?.trend.replyRate ?? 0}
          sparklineData={sparklines?.replyRate}
          isLoading={isLoading}
        />
        <KPICard
          label="Posts Published"
          value={analytics?.totals.postsPublished ?? 0}
          trend={analytics?.trend.postsPublished ?? 0}
          sparklineData={sparklines?.replies}
          isLoading={isLoading}
        />
      </div>

      {/* Row 2 — Charts (2 columns) */}
      <div className={styles.chartRow}>
        <ActivityChart data={analytics?.chartData ?? []} />
        <ReplyRateChart data={campaigns} />
      </div>

      {/* Row 3 — Engagement trend (full width) */}
      <EngagementChart data={analytics?.chartData ?? []} />

      {/* Row 4 — Top Campaigns Table */}
      <div className={styles.tableCard}>
        <h3 className={styles.tableTitle}>Top Campaigns</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Campaign</th>
                <th className={styles.th}>Leads</th>
                <th className={styles.th}>Messaged</th>
                <th className={styles.th}>Replied</th>
                <th className={styles.th}>Reply Rate</th>
                <th className={styles.th}>Avg Response Time</th>
              </tr>
            </thead>
            <tbody>
              {topCampaigns.map((c) => (
                <tr key={c.id} className={styles.tr}>
                  <td className={styles.td}>
                    <span className={styles.campaignName}>{c.name}</span>
                  </td>
                  <td className={styles.td}>{c.totalLeads}</td>
                  <td className={styles.td}>{c.messaged}</td>
                  <td className={styles.td}>{c.replied}</td>
                  <td className={styles.td}>
                    <span className={styles.rateBadge} data-rate={
                      c.replyRate >= 60 ? 'high' : c.replyRate >= 30 ? 'mid' : 'low'
                    }>
                      {c.replyRate}%
                    </span>
                  </td>
                  <td className={styles.td}>{c.avgResponseTime}</td>
                </tr>
              ))}
              {topCampaigns.length === 0 && (
                <tr>
                  <td className={styles.td} colSpan={6}>
                    <span className={styles.empty}>No campaigns yet</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
