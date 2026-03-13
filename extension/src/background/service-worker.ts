import { logger } from './logger'
import { getSession, setSession, resetSession, DEFAULT_SETTINGS, setSettings } from './storage'
import { processQueue } from './queue-processor'
import { clearAuth } from './supabase-client'

const ALARM_NAME = 'queue-processor'
const RESTRICTION_PAUSE_HOURS = 24

// ── Install / Update ──────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  logger.info('Extension installed/updated', { reason })

  // Initialize storage with defaults (only set keys that aren't already set)
  const currentSettings = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS))
  const missing: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (currentSettings[key] === undefined) missing[key] = value
  }
  // Always update URL + keys so stale values from prior installs are overwritten
  if (DEFAULT_SETTINGS.supabaseUrl) missing.supabaseUrl = DEFAULT_SETTINGS.supabaseUrl
  if (DEFAULT_SETTINGS.supabaseAnonKey) missing.supabaseAnonKey = DEFAULT_SETTINGS.supabaseAnonKey
  if (Object.keys(missing).length > 0) {
    await chrome.storage.sync.set(missing)
  }

  await resetSession()

  // Register the recurring alarm (fires every minute)
  await chrome.alarms.clear(ALARM_NAME)
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 })
  logger.info('Queue processor alarm registered')
})

// ── Alarm handler ─────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return
  logger.debug('Alarm fired — running queue processor')
  try {
    await processQueue()
  } catch (err) {
    logger.error('Queue processor threw unexpectedly', err)
  }
})

// ── Message handler ───────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch((err) => {
    logger.error('Message handler error', err)
    sendResponse({ error: String(err) })
  })
  return true  // keep channel open for async sendResponse
})

async function handleMessage(
  message: { type: string; [key: string]: unknown }
): Promise<unknown> {
  switch (message.type) {
    // ── Popup queries ──────────────────────────────────────────
    case 'GET_STATUS': {
      const session = await getSession()
      return { ok: true, session }
    }

    case 'PAUSE': {
      await setSession({ isPaused: true })
      logger.info('Queue paused by user')
      return { ok: true }
    }

    case 'RESUME': {
      await setSession({ isPaused: false })
      logger.info('Queue resumed by user')
      return { ok: true }
    }

    case 'CLEAR_AUTH': {
      await clearAuth()
      return { ok: true }
    }

    case 'SET_EXTENSION_TOKEN': {
      const token = message.token as string
      if (!token) return { ok: false, error: 'Missing token' }
      await setSettings({ extensionToken: token })
      logger.info('Extension token saved')
      return { ok: true }
    }

    // ── Content script results ─────────────────────────────────
    // ACTION_RESULT is forwarded to queue-processor via its own listener,
    // so we just acknowledge receipt here.
    case 'ACTION_RESULT':
      return { ok: true }

    // ── LinkedIn safety signals ───────────────────────────────
    case 'LINKEDIN_RESTRICTION': {
      const resumeAt = Date.now() + RESTRICTION_PAUSE_HOURS * 60 * 60 * 1000
      await setSession({ isPaused: true })
      await setSettings({ expiresAt: 0 })   // force token refresh on resume
      logger.warn('LinkedIn restriction detected — pausing for 24h', { resumeAt })

      // Schedule auto-resume alarm
      chrome.alarms.create('auto-resume', { when: resumeAt })
      return { ok: true }
    }

    default:
      logger.warn('Unknown message type', { type: message.type })
      return { ok: false, error: `Unknown message type: ${message.type}` }
  }
}

// ── Auto-resume after restriction pause ──────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'auto-resume') return
  await setSession({ isPaused: false })
  logger.info('Auto-resumed after LinkedIn restriction pause')
})

logger.info('Service worker started')
