import { useQuery } from '@tanstack/react-query'
import { subDays, format, parseISO } from 'date-fns'
import type { DailyStat, Campaign } from '@shared/types'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

// ── Types ────────────────────────────────────────────────────

export type AnalyticsPeriod = '7d' | '30d' | '90d'

export interface AnalyticsTotals {
  connectionsSent: number
  messagesSent: number
  repliesReceived: number
  postsPublished: number
  replyRate: number
}

export interface AnalyticsTrend {
  connectionsSent: number  // % change vs previous period
  messagesSent: number
  repliesReceived: number
  postsPublished: number
  replyRate: number
}

export interface ChartPoint {
  date: string           // "YYYY-MM-DD"
  label: string          // "Mar 1"
  connectionsSent: number
  messagesSent: number
  repliesReceived: number
  replyRate: number
}

export interface CampaignStat {
  id: string
  name: string
  totalLeads: number
  messaged: number
  replied: number
  replyRate: number
  avgResponseTime: string
}

// ── Helpers ──────────────────────────────────────────────────

function periodToDays(period: AnalyticsPeriod): number {
  return period === '7d' ? 7 : period === '30d' ? 30 : 90
}

function computeTotals(rows: DailyStat[]): AnalyticsTotals {
  const connectionsSent = rows.reduce((s, r) => s + r.connections_sent, 0)
  const messagesSent = rows.reduce((s, r) => s + r.messages_sent, 0)
  const repliesReceived = rows.reduce((s, r) => s + r.replies_received, 0)
  const postsPublished = rows.reduce((s, r) => s + r.posts_published, 0)
  const replyRate = messagesSent > 0 ? (repliesReceived / messagesSent) * 100 : 0

  return { connectionsSent, messagesSent, repliesReceived, postsPublished, replyRate }
}

function computeTrend(current: AnalyticsTotals, previous: AnalyticsTotals): AnalyticsTrend {
  const pct = (cur: number, prev: number) =>
    prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100

  return {
    connectionsSent: pct(current.connectionsSent, previous.connectionsSent),
    messagesSent: pct(current.messagesSent, previous.messagesSent),
    repliesReceived: pct(current.repliesReceived, previous.repliesReceived),
    postsPublished: pct(current.postsPublished, previous.postsPublished),
    replyRate: pct(current.replyRate, previous.replyRate),
  }
}

function toChartData(rows: DailyStat[]): ChartPoint[] {
  return rows
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({
      date: r.date,
      label: format(parseISO(r.date), 'MMM d'),
      connectionsSent: r.connections_sent,
      messagesSent: r.messages_sent,
      repliesReceived: r.replies_received,
      replyRate:
        r.messages_sent > 0
          ? Math.round((r.replies_received / r.messages_sent) * 100)
          : 0,
    }))
}

// ── useAnalytics ─────────────────────────────────────────────

export function useAnalytics(period: AnalyticsPeriod = '30d') {
  const userId = useAuthStore((s) => s.user?.id)
  const days = periodToDays(period)

  return useQuery({
    queryKey: ['analytics', userId, period],
    queryFn: async () => {
      const now = new Date()
      const currentFrom = format(subDays(now, days), 'yyyy-MM-dd')
      const previousFrom = format(subDays(now, days * 2), 'yyyy-MM-dd')
      const currentTo = format(now, 'yyyy-MM-dd')

      // Fetch current + previous period in one query
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', userId!)
        .gte('date', previousFrom)
        .lte('date', currentTo)
        .order('date', { ascending: true })

      if (error) throw error

      const rows = data as DailyStat[]
      const currentRows = rows.filter((r) => r.date >= currentFrom)
      const previousRows = rows.filter((r) => r.date < currentFrom)

      const totals = computeTotals(currentRows)
      const previousTotals = computeTotals(previousRows)
      const trend = computeTrend(totals, previousTotals)
      const chartData = toChartData(currentRows)

      return { totals, trend, chartData }
    },
    enabled: !!userId,
  })
}

// ── useCampaignAnalytics ─────────────────────────────────────

export function useCampaignAnalytics() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: ['campaign-analytics', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })

      if (error) throw error

      const campaigns = data as Campaign[]

      return campaigns.map((c): CampaignStat => {
        const replyRate =
          c.leads_messaged > 0
            ? Math.round((c.leads_replied / c.leads_messaged) * 100)
            : 0

        return {
          id: c.id,
          name: c.name,
          totalLeads: c.total_leads,
          messaged: c.leads_messaged,
          replied: c.leads_replied,
          replyRate,
          avgResponseTime: '—', // computed server-side in future
        }
      })
    },
    enabled: !!userId,
  })
}
