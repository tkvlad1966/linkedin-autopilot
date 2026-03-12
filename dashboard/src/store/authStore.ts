import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@shared/types'
import { supabase } from '../lib/supabase'

interface AuthStore {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  setSession(session: Session | null): void
  fetchProfile(): Promise<void>
  logout(): Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,

  setSession(session) {
    set({
      session,
      user: session?.user ?? null,
      isLoading: false,
    })

    if (session?.user) {
      get().fetchProfile()
    } else {
      set({ profile: null })
    }
  },

  async fetchProfile() {
    const { user } = get()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      set({ profile: data as Profile })
    }
  },

  async logout() {
    await supabase.auth.signOut()
    set({ user: null, profile: null, session: null })
  },
}))
