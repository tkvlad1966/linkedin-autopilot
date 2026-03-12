import { create } from 'zustand'
import type { LeadFilters, LeadStatus } from '@shared/types'

interface LeadsStore {
  selectedLeadIds: Set<string>
  activeFilters: LeadFilters
  toggleSelect(id: string): void
  selectAll(ids: string[]): void
  clearSelection(): void
  setFilter<K extends keyof LeadFilters>(key: K, value: LeadFilters[K]): void
  clearFilters(): void
}

export const useLeadsStore = create<LeadsStore>((set) => ({
  selectedLeadIds: new Set(),
  activeFilters: {},

  toggleSelect(id) {
    set((state) => {
      const next = new Set(state.selectedLeadIds)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return { selectedLeadIds: next }
    })
  },

  selectAll(ids) {
    set({ selectedLeadIds: new Set(ids) })
  },

  clearSelection() {
    set({ selectedLeadIds: new Set() })
  },

  setFilter(key, value) {
    set((state) => ({
      activeFilters: { ...state.activeFilters, [key]: value },
    }))
  },

  clearFilters() {
    set({ activeFilters: {} })
  },
}))

// Helper to check if any filter is active
export function hasActiveFilters(filters: LeadFilters): boolean {
  return !!(filters.campaign_id || filters.status || filters.tags?.length || filters.search)
}

// Map lead status to badge variant
export const statusVariant: Record<LeadStatus, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  pending: 'neutral',
  visiting: 'info',
  connected: 'success',
  messaged: 'info',
  replied: 'success',
  not_interested: 'danger',
  done: 'warning',
}
