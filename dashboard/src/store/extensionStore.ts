import { create } from 'zustand'

interface ExtensionStore {
  isConnected: boolean
  isPaused: boolean
  todayCount: number
  dailyLimit: number
  currentTask: string | null
  checkConnection(): void
  togglePause(): void
}

export const useExtensionStore = create<ExtensionStore>((set, get) => ({
  isConnected: false,
  isPaused: false,
  todayCount: 0,
  dailyLimit: 50,
  currentTask: null,

  checkConnection() {
    // Post message to extension content script to check status
    window.postMessage({ type: 'AUTOPILOT_PING' }, '*')

    // Listen for response
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'AUTOPILOT_PONG') {
        set({
          isConnected: true,
          isPaused: event.data.isPaused ?? false,
          todayCount: event.data.todayCount ?? 0,
          dailyLimit: event.data.dailyLimit ?? 50,
          currentTask: event.data.currentTask ?? null,
        })
        window.removeEventListener('message', handler)
      }
    }

    window.addEventListener('message', handler)

    // Timeout — extension not connected
    setTimeout(() => {
      window.removeEventListener('message', handler)
      if (!get().isConnected) {
        set({ isConnected: false })
      }
    }, 2000)
  },

  togglePause() {
    const newPaused = !get().isPaused
    set({ isPaused: newPaused })
    window.postMessage(
      { type: newPaused ? 'AUTOPILOT_PAUSE' : 'AUTOPILOT_RESUME' },
      '*',
    )
  },
}))
