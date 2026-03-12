import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { Campaign, SequenceStep } from '@shared/types'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

// ── List all campaigns ──────────────────────────────────────
export function useCampaigns() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: ['campaigns', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Campaign[]
    },
    enabled: !!userId,
  })
}

// ── Single campaign with realtime ───────────────────────────
export function useCampaign(id: string | undefined) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['campaigns', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id!)
        .single()

      if (error) throw error
      return data as Campaign
    },
    enabled: !!id,
  })

  useEffect(() => {
    if (!id) return

    const channel = supabase
      .channel(`campaign-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaigns', filter: `id=eq.${id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            qc.invalidateQueries({ queryKey: ['campaigns'] })
          } else {
            qc.setQueryData(['campaigns', id], payload.new)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, qc])

  return query
}

// ── Create campaign ─────────────────────────────────────────
interface CreateCampaignInput {
  name: string
  status: Campaign['status']
  daily_limit: number
  working_hours_start: string
  working_hours_end: string
  timezone: string
}

export function useCreateCampaign() {
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({ ...input, user_id: userId! } as never)
        .select()
        .single()

      if (error) throw error
      return data as Campaign
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

// ── Update campaign ─────────────────────────────────────────
export function useUpdateCampaign() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Campaign
    },
    onSuccess: (data) => {
      qc.setQueryData(['campaigns', data.id], data)
      qc.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

// ── Sequence steps ──────────────────────────────────────────
export function useSequenceSteps(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['sequence_steps', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sequence_steps')
        .select('*')
        .eq('campaign_id', campaignId!)
        .order('step_order', { ascending: true })

      if (error) throw error
      return data as SequenceStep[]
    },
    enabled: !!campaignId,
  })
}

// ── Upsert step ─────────────────────────────────────────────
export function useUpsertStep() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (
      input: Partial<SequenceStep> & { campaign_id: string; type: SequenceStep['type'] },
    ) => {
      if (input.id) {
        const { id, campaign_id: _cid, created_at: _ca, ...updates } = input
        const { data, error } = await supabase
          .from('sequence_steps')
          .update(updates as never)
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        return data as SequenceStep
      } else {
        const { id: _id, created_at: _ca, ...rest } = input
        const { data, error } = await supabase
          .from('sequence_steps')
          .insert(rest as never)
          .select()
          .single()
        if (error) throw error
        return data as SequenceStep
      }
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['sequence_steps', variables.campaign_id] })
    },
  })
}

// ── Delete step ─────────────────────────────────────────────
export function useDeleteStep() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, campaignId }: { id: string; campaignId: string }) => {
      const { error } = await supabase.from('sequence_steps').delete().eq('id', id)
      if (error) throw error
      return campaignId
    },
    onSuccess: (campaignId) => {
      qc.invalidateQueries({ queryKey: ['sequence_steps', campaignId] })
    },
  })
}

// ── Reorder steps (after drag-drop) ─────────────────────────
export function useReorderSteps() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      campaignId,
      orderedIds,
    }: {
      campaignId: string
      orderedIds: string[]
    }) => {
      const updates = orderedIds.map((id, index) =>
        supabase
          .from('sequence_steps')
          .update({ step_order: index + 1 } as never)
          .eq('id', id),
      )

      const results = await Promise.all(updates)
      const failed = results.find((r) => r.error)
      if (failed?.error) throw failed.error

      return campaignId
    },
    onSuccess: (campaignId) => {
      qc.invalidateQueries({ queryKey: ['sequence_steps', campaignId] })
    },
  })
}
