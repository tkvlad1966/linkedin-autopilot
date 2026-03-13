import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Post, PostStatus, InsertDTO, UpdateDTO } from '@shared/types'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useToast } from './useToast'

// ── List posts (optionally filtered by status) ──────────────
export function usePosts(status?: PostStatus) {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: ['posts', userId, status],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId!)
        .order('scheduled_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Post[]
    },
    enabled: !!userId,
  })
}

// ── Create post ─────────────────────────────────────────────
export function useCreatePost() {
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (input: {
      content: string
      status: PostStatus
      scheduled_at?: string | null
    }) => {
      const row: InsertDTO<'posts'> = {
        user_id: userId!,
        content: input.content,
        media_urls: [],
        status: input.status,
        scheduled_at: input.scheduled_at ?? null,
        published_at: null,
        linkedin_post_id: null,
      }

      const { data, error } = await supabase
        .from('posts')
        .insert(row as never)
        .select()
        .single()

      if (error) throw error
      return data as Post
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['posts'] })
      const msg = data.status === 'scheduled' ? 'Post scheduled' : 'Post created'
      toast.success(msg)
    },
    onError: () => {
      toast.error('Failed to create post')
    },
  })
}

// ── Update post ─────────────────────────────────────────────
export function useUpdatePost() {
  const qc = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateDTO<'posts'> & { id: string }) => {
      const { data, error } = await supabase
        .from('posts')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Post
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] })
      toast.success('Post updated')
    },
    onError: () => {
      toast.error('Failed to update post')
    },
  })
}

// ── Delete post ─────────────────────────────────────────────
export function useDeletePost() {
  const qc = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] })
      toast.success('Post deleted')
    },
    onError: () => {
      toast.error('Failed to delete post')
    },
  })
}
