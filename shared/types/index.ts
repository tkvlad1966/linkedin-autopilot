// ============================================================
// shared/types/index.ts
// Hand-authored types that mirror the Supabase schema.
// Replace with `supabase gen types typescript` output once
// the local DB is running (the generated file is a superset).
// ============================================================

// ── Enums / Unions ────────────────────────────────────────────

export type Plan = 'free' | 'pro' | 'agency'

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed'

export type SequenceStepType =
  | 'connect'
  | 'message'
  | 'followup'
  | 'like'
  | 'view_profile'

export type LeadStatus =
  | 'pending'
  | 'visiting'
  | 'connected'
  | 'messaged'
  | 'replied'
  | 'not_interested'
  | 'done'

export type QueueAction =
  | 'send_connection'
  | 'send_message'
  | 'send_followup'
  | 'like_post'
  | 'view_profile'
  | 'publish_post'

export type QueueStatus = 'pending' | 'in_progress' | 'done' | 'failed' | 'skipped'

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed'

// ── Discriminated union for queue payloads ────────────────────

export type QueuePayload =
  | { action: 'send_connection'; note?: string }
  | { action: 'send_message'; message: string }
  | { action: 'send_followup'; message: string; thread_url?: string }
  | { action: 'like_post'; post_url: string }
  | { action: 'view_profile' }
  | { action: 'publish_post'; content: string }

// ── Table row interfaces ──────────────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  linkedin_connected: boolean
  extension_token: string
  plan: Plan
  daily_limit: number
  working_hours_start: string   // "HH:MM" (Postgres time)
  working_hours_end: string
  timezone: string
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  user_id: string
  name: string
  status: CampaignStatus
  daily_limit: number
  working_hours_start: string
  working_hours_end: string
  timezone: string
  total_leads: number
  leads_messaged: number
  leads_replied: number
  created_at: string
  updated_at: string
}

export interface SequenceStep {
  id: string
  campaign_id: string
  step_order: number
  type: SequenceStepType
  delay_days: number
  message_template: string | null
  created_at: string
}

export interface Lead {
  id: string
  campaign_id: string | null
  user_id: string
  linkedin_url: string
  linkedin_id: string | null
  first_name: string | null
  last_name: string | null
  title: string | null
  company: string | null
  location: string | null
  avatar_url: string | null
  status: LeadStatus
  current_step: number
  connected_at: string | null
  messaged_at: string | null
  replied_at: string | null
  notes: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface MessageQueueItem {
  id: string
  user_id: string
  lead_id: string | null
  campaign_id: string | null
  step_id: string | null
  action: QueueAction
  payload: QueuePayload
  status: QueueStatus
  scheduled_at: string
  executed_at: string | null
  error_message: string | null
  retry_count: number
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  media_urls: string[]
  status: PostStatus
  scheduled_at: string | null
  published_at: string | null
  linkedin_post_id: string | null
  likes_count: number
  comments_count: number
  reposts_count: number
  impressions_count: number
  created_at: string
  updated_at: string
}

export interface DailyStat {
  id: string
  user_id: string
  date: string           // "YYYY-MM-DD"
  connections_sent: number
  connections_accepted: number
  messages_sent: number
  replies_received: number
  posts_published: number
  profile_views: number
}

// ── Supabase Database type (codegen-compatible pattern) ───────

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at' | 'extension_token'> &
          Partial<Pick<Profile, 'extension_token'>>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      campaigns: {
        Row: Campaign
        Insert: Omit<Campaign, 'id' | 'created_at' | 'updated_at' |
          'total_leads' | 'leads_messaged' | 'leads_replied'> &
          Partial<Pick<Campaign, 'total_leads' | 'leads_messaged' | 'leads_replied'>>
        Update: Partial<Omit<Campaign, 'id' | 'user_id' | 'created_at'>>
      }
      sequence_steps: {
        Row: SequenceStep
        Insert: Omit<SequenceStep, 'id' | 'created_at'>
        Update: Partial<Omit<SequenceStep, 'id' | 'campaign_id' | 'created_at'>>
      }
      leads: {
        Row: Lead
        Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'current_step' | 'tags'> &
          Partial<Pick<Lead, 'current_step' | 'tags'>>
        Update: Partial<Omit<Lead, 'id' | 'user_id' | 'created_at'>>
      }
      message_queue: {
        Row: MessageQueueItem
        Insert: Omit<MessageQueueItem, 'id' | 'created_at' | 'retry_count'> &
          Partial<Pick<MessageQueueItem, 'retry_count'>>
        Update: Partial<Omit<MessageQueueItem, 'id' | 'user_id' | 'created_at'>>
      }
      posts: {
        Row: Post
        Insert: Omit<Post, 'id' | 'created_at' | 'updated_at' |
          'likes_count' | 'comments_count' | 'reposts_count' | 'impressions_count'> &
          Partial<Pick<Post, 'likes_count' | 'comments_count' | 'reposts_count' | 'impressions_count'>>
        Update: Partial<Omit<Post, 'id' | 'user_id' | 'created_at'>>
      }
      daily_stats: {
        Row: DailyStat
        Insert: Omit<DailyStat, 'id'> & Partial<Omit<DailyStat, 'id' | 'user_id' | 'date'>>
        Update: Partial<Omit<DailyStat, 'id' | 'user_id'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      plan: Plan
      campaign_status: CampaignStatus
      lead_status: LeadStatus
      queue_action: QueueAction
      queue_status: QueueStatus
      post_status: PostStatus
    }
  }
}

// ── Utility types ─────────────────────────────────────────────

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertDTO<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateDTO<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// ── Filters / query helpers ───────────────────────────────────

export interface LeadFilters {
  campaign_id?: string
  status?: LeadStatus | LeadStatus[]
  tags?: string[]
  search?: string           // matches first_name, last_name, company
}

export interface DateRangeFilter {
  from: string              // ISO date string
  to: string
}

// ── Generic API response wrappers ─────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
}
