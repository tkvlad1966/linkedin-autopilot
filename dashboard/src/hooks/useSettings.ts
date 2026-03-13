import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Profile, UpdateDTO } from '@shared/types'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useToast } from './useToast'

// ── Load profile ────────────────────────────────────────────

export function useProfile() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single()

      if (error) throw error
      return data as Profile
    },
    enabled: !!userId,
  })
}

// ── Update profile ──────────────────────────────────────────

export function useUpdateProfile() {
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  const fetchProfile = useAuthStore((s) => s.fetchProfile)
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (updates: UpdateDTO<'profiles'>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates as never)
        .eq('id', userId!)
        .select()
        .single()

      if (error) throw error
      return data as Profile
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      fetchProfile()
      toast.success('Settings saved')
    },
    onError: () => {
      toast.error('Failed to save settings')
    },
  })
}

// ── Regenerate extension token ──────────────────────────────

export function useRegenerateToken() {
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  const fetchProfile = useAuthStore((s) => s.fetchProfile)
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      // Generate a new random UUID token (column is type uuid)
      const newToken = crypto.randomUUID()

      const { data, error } = await supabase
        .from('profiles')
        .update({ extension_token: newToken } as never)
        .eq('id', userId!)
        .select()
        .single()

      if (error) throw error
      return data as Profile
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      fetchProfile()
      toast.success('Token regenerated. Re-connect your extension with the new token.')
    },
    onError: () => {
      toast.error('Failed to regenerate token')
    },
  })
}

// ── Pause all campaigns ─────────────────────────────────────

export function usePauseAllCampaigns() {
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'paused' } as never)
        .eq('user_id', userId!)
        .eq('status', 'active')

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('All active campaigns paused')
    },
    onError: () => {
      toast.error('Failed to pause campaigns')
    },
  })
}

// ── Clear pending queue ─────────────────────────────────────

export function useClearQueue() {
  const userId = useAuthStore((s) => s.user?.id)
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('message_queue')
        .update({ status: 'skipped' } as never)
        .eq('user_id', userId!)
        .eq('status', 'pending')

      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Pending queue cleared')
    },
    onError: () => {
      toast.error('Failed to clear queue')
    },
  })
}
