import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import type { Lead, LeadFilters, LeadStatus, MessageQueueItem } from '@shared/types'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const PAGE_SIZE = 50

// ── Paginated leads ─────────────────────────────────────────
export function useLeads(filters: LeadFilters) {
  const userId = useAuthStore((s) => s.user?.id)

  return useInfiniteQuery({
    queryKey: ['leads', userId, filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1)

      if (filters.campaign_id) {
        query = query.eq('campaign_id', filters.campaign_id)
      }

      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
        query = query.in('status', statuses)
      }

      if (filters.tags?.length) {
        query = query.overlaps('tags', filters.tags)
      }

      if (filters.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,company.ilike.%${filters.search}%`,
        )
      }

      const { data, error, count } = await query
      if (error) throw error

      return {
        data: data as Lead[],
        total: count ?? 0,
        nextOffset: pageParam + PAGE_SIZE,
        hasMore: (data?.length ?? 0) === PAGE_SIZE,
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextOffset : undefined),
    enabled: !!userId,
  })
}

// ── Single lead ─────────────────────────────────────────────
export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id!)
        .single()

      if (error) throw error
      return data as Lead
    },
    enabled: !!id,
  })
}

// ── Lead activity (queue history) ───────────────────────────
export function useLeadActivity(id: string | undefined) {
  return useQuery({
    queryKey: ['lead_activity', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_queue')
        .select('*')
        .eq('lead_id', id!)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as MessageQueueItem[]
    },
    enabled: !!id,
  })
}

// ── Import leads (bulk insert) ──────────────────────────────
interface ImportRow {
  linkedin_url: string
  first_name?: string
  last_name?: string
  company?: string
  title?: string
}

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

export function useImportLeads() {
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: async ({
      rows,
      campaignId,
    }: {
      rows: ImportRow[]
      campaignId?: string
    }): Promise<ImportResult> => {
      const result: ImportResult = { imported: 0, skipped: 0, errors: [] }
      const BATCH_SIZE = 100

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE).map((row) => ({
          user_id: userId!,
          linkedin_url: row.linkedin_url,
          first_name: row.first_name ?? null,
          last_name: row.last_name ?? null,
          company: row.company ?? null,
          title: row.title ?? null,
          campaign_id: campaignId ?? null,
          status: 'pending' as const,
        }))

        const { data, error } = await supabase
          .from('leads')
          .upsert(batch as never[], {
            onConflict: 'linkedin_url,user_id',
            ignoreDuplicates: true,
          })
          .select('id')

        if (error) {
          result.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`)
        } else {
          result.imported += data?.length ?? 0
          result.skipped += batch.length - (data?.length ?? 0)
        }
      }

      return result
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

// ── Update single lead ──────────────────────────────────────
export function useUpdateLead() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Lead
    },
    onSuccess: (data) => {
      qc.setQueryData(['leads', data.id], data)
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

// ── Bulk update leads ───────────────────────────────────────
export function useUpdateLeadsBulk() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      ids,
      updates,
    }: {
      ids: string[]
      updates: { status?: LeadStatus; tags?: string[]; campaign_id?: string }
    }) => {
      const { error } = await supabase
        .from('leads')
        .update(updates as never)
        .in('id', ids)

      if (error) throw error
      return ids.length
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}
