import { useState, useEffect, useCallback, useRef } from 'react'

interface ExtensionState {
  isConnected: boolean
  isRunning: boolean
  isPaused: boolean
  todayCount: number
  dailyLimit: number
  currentTask: string | null
  workingHours: string
  email: string
  error: string | null
  isConnecting: boolean
  connect(token: string): Promise<void>
  disconnect(): Promise<void>
  togglePause(): Promise<void>
}

// ── Send message to background service worker ───────────────

function sendMessage(msg: { type: string; [k: string]: unknown }): Promise<any> {
  return chrome.runtime.sendMessage(msg)
}

// ── Hook ────────────────────────────────────────────────────

export function useExtensionState(): ExtensionState {
  const [isConnected, setIsConnected] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [todayCount, setTodayCount] = useState(0)
  const [dailyLimit, setDailyLimit] = useState(20)
  const [currentTask, setCurrentTask] = useState<string | null>(null)
  const [workingHours, setWorkingHours] = useState('09:00–18:00')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Poll status every 2s ──────────────────────────────────

  const fetchStatus = useCallback(async () => {
    try {
      // Check if there's a token in sync storage
      const syncData = await chrome.storage.sync.get([
        'accessToken', 'extensionToken', 'dailyLimit',
        'workingHoursStart', 'workingHoursEnd',
      ])

      const hasToken = !!syncData.accessToken
      setIsConnected(hasToken)

      if (!hasToken) return

      setDailyLimit(syncData.dailyLimit ?? 20)
      setWorkingHours(
        `${syncData.workingHoursStart ?? '09:00'}–${syncData.workingHoursEnd ?? '18:00'}`
      )

      // Get runtime state from background
      const res = await sendMessage({ type: 'GET_STATUS' })
      if (res?.ok && res.session) {
        setIsRunning(res.session.isRunning ?? false)
        setIsPaused(res.session.isPaused ?? false)
        setTodayCount(res.session.todayCount ?? 0)
        setCurrentTask(res.session.currentTask ?? null)
      }
    } catch {
      // Extension context may be invalidated
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    intervalRef.current = setInterval(fetchStatus, 2000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchStatus])

  // ── Connect ───────────────────────────────────────────────

  const connect = useCallback(async (token: string) => {
    setIsConnecting(true)
    setError(null)

    try {
      // Save token to sync storage
      await sendMessage({ type: 'SET_EXTENSION_TOKEN', token })
      await chrome.storage.sync.set({ extensionToken: token })

      // Exchange token via the edge function
      // Prefer .env values — storage may have stale keys from prior installs
      const settings = await chrome.storage.sync.get(['supabaseUrl'])
      const baseUrl = process.env.SUPABASE_URL! || settings.supabaseUrl
      const anonKey = process.env.SUPABASE_ANON_KEY!
      const url = baseUrl + '/functions/v1/extension-auth'

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ extension_token: token }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Token exchange failed (${res.status})`)
      }

      const { access_token, user_id, expires_in } = await res.json()

      await chrome.storage.sync.set({
        accessToken: access_token,
        userId: user_id,
        expiresAt: Date.now() + expires_in * 1000,
      })

      setIsConnected(true)
      await fetchStatus()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg.includes('Invalid token')
        ? 'Invalid token. Check your Dashboard Settings.'
        : `Connection failed: ${msg}`)
    } finally {
      setIsConnecting(false)
    }
  }, [fetchStatus])

  // ── Disconnect ────────────────────────────────────────────

  const disconnect = useCallback(async () => {
    await sendMessage({ type: 'CLEAR_AUTH' })
    await chrome.storage.sync.remove([
      'accessToken', 'userId', 'expiresAt', 'extensionToken',
    ])
    setIsConnected(false)
    setIsRunning(false)
    setIsPaused(false)
    setTodayCount(0)
    setCurrentTask(null)
  }, [])

  // ── Toggle pause ──────────────────────────────────────────

  const togglePause = useCallback(async () => {
    const type = isPaused ? 'RESUME' : 'PAUSE'
    await sendMessage({ type })
    setIsPaused(!isPaused)
  }, [isPaused])

  return {
    isConnected, isRunning, isPaused,
    todayCount, dailyLimit, currentTask, workingHours,
    email, error, isConnecting,
    connect, disconnect, togglePause,
  }
}
