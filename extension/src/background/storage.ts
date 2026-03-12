// ── Types ──────────────────────────────────────────────────────

export interface SessionState {
  isRunning: boolean
  isPaused: boolean
  todayCount: number
  todayDate: string         // YYYY-MM-DD; reset todayCount when this changes
  currentTask: string | null
  lastSyncAt: number | null
}

export interface SyncSettings {
  supabaseUrl: string
  supabaseAnonKey: string
  // Auth — populated after exchangeExtensionToken()
  extensionToken: string    // user copies from dashboard Settings page
  accessToken: string       // JWT received from Edge Function extension-auth
  userId: string            // uuid from profile
  expiresAt: number         // ms timestamp; refresh when < Date.now() + 5 min
  // User preferences (synced from profile)
  dailyLimit: number
  workingHoursStart: string // "HH:MM"
  workingHoursEnd: string   // "HH:MM"
  timezone: string
  dashboardUrl: string
}

// ── Defaults ──────────────────────────────────────────────────

export const DEFAULT_SESSION: SessionState = {
  isRunning: false,
  isPaused: false,
  todayCount: 0,
  todayDate: '',
  currentTask: null,
  lastSyncAt: null,
}

export const DEFAULT_SETTINGS: Partial<SyncSettings> = {
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
  extensionToken: '',
  accessToken: '',
  userId: '',
  expiresAt: 0,
  dailyLimit: 20,
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  timezone: 'Europe/Lisbon',
  dashboardUrl: process.env.DASHBOARD_URL ?? 'https://app.linkedin-autopilot.com',
}

// ── chrome.storage.local — session state (ephemeral) ─────────

export async function getSession(): Promise<SessionState> {
  const result = await chrome.storage.local.get(Object.keys(DEFAULT_SESSION))
  return { ...DEFAULT_SESSION, ...result } as SessionState
}

export async function setSession(patch: Partial<SessionState>): Promise<void> {
  await chrome.storage.local.set(patch)
}

export async function resetSession(): Promise<void> {
  await chrome.storage.local.set(DEFAULT_SESSION)
}

// ── chrome.storage.sync — user settings (persisted across devices) ──

export async function getSettings(): Promise<SyncSettings> {
  const keys = Object.keys(DEFAULT_SETTINGS)
  const result = await chrome.storage.sync.get(keys)
  return { ...DEFAULT_SETTINGS, ...result } as SyncSettings
}

export async function setSettings(patch: Partial<SyncSettings>): Promise<void> {
  await chrome.storage.sync.set(patch)
}

export async function clearAuthTokens(): Promise<void> {
  await chrome.storage.sync.remove(['accessToken', 'userId', 'expiresAt'])
}
