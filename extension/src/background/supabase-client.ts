import type { SupabaseClient } from '@supabase/supabase-js'
import { createExtensionClient } from '../../../shared/lib/supabase-extension'
import type { Database } from '../../../shared/types'
import { logger } from './logger'
import { getSettings, setSettings, clearAuthTokens } from './storage'

const EDGE_FN_PATH = '/functions/v1/extension-auth'
const REFRESH_BUFFER_MS = 5 * 60 * 1000  // refresh 5 min before expiry

// ── Token exchange ─────────────────────────────────────────────

export async function exchangeExtensionToken(extensionToken: string): Promise<string> {
  const settings = await getSettings()
  const url = (process.env.SUPABASE_URL! || settings.supabaseUrl) + EDGE_FN_PATH

  logger.info('Exchanging extension token…')

  // Prefer .env value — storage may have stale keys from prior installs
  const anonKey = process.env.SUPABASE_ANON_KEY! || settings.supabaseAnonKey

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ extension_token: extensionToken }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Token exchange failed (${res.status}): ${err.error ?? 'unknown'}`)
  }

  const { access_token, user_id, expires_in } = await res.json() as {
    access_token: string
    user_id: string
    expires_in: number
  }

  await setSettings({
    accessToken: access_token,
    userId: user_id,
    expiresAt: Date.now() + expires_in * 1000,
  })

  logger.info('Token exchange successful', { userId: user_id })
  return access_token
}

// ── Authenticated client ───────────────────────────────────────

export async function getAuthenticatedClient(): Promise<SupabaseClient<Database>> {
  const settings = await getSettings()

  const needsRefresh =
    !settings.accessToken ||
    !settings.expiresAt ||
    settings.expiresAt < Date.now() + REFRESH_BUFFER_MS

  if (needsRefresh) {
    if (!settings.extensionToken) {
      throw new Error('No extension_token found. Please link the extension from your dashboard Settings.')
    }
    logger.info('Access token expired or missing — refreshing…')
    await exchangeExtensionToken(settings.extensionToken)

    // Re-read after refresh
    const updated = await getSettings()
    return createExtensionClient(updated.accessToken)
  }

  return createExtensionClient(settings.accessToken)
}

// ── Clear auth ────────────────────────────────────────────────

export async function clearAuth(): Promise<void> {
  await clearAuthTokens()
  logger.info('Auth tokens cleared')
}
