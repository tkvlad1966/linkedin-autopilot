import type { MessageQueueItem, QueueAction, QueueStatus, LeadStatus } from '../../../shared/types'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any
import { logger } from './logger'
import { getSession, setSession, getSettings } from './storage'
import { getAuthenticatedClient } from './supabase-client'
import { isWithinWorkingHours, humanDelay, getTodayKey } from './scheduler'
import { openOrFocusLinkedIn, waitForTabComplete } from './tab-manager'

const ACTION_TIMEOUT_MS = 30_000
const RETRY_DELAY_MINUTES = 10
const MAX_RETRIES = 3

// ── Lead status mapping ───────────────────────────────────────

const ACTION_TO_LEAD_STATUS: Partial<Record<QueueAction, string>> = {
  send_connection: 'connected',
  send_message:    'messaged',
  send_followup:   'messaged',
}

const ACTION_TO_STAT_FIELD: Partial<Record<QueueAction, string>> = {
  send_connection: 'connections_sent',
  send_message:    'messages_sent',
  send_followup:   'messages_sent',
  like_post:       'profile_views',   // approximate mapping
  view_profile:    'profile_views',
}

// ── Wait for content script response ─────────────────────────

function waitForActionResult(
  expectedTaskId: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.runtime.onMessage.removeListener(listener)
      reject(new Error(`Action timed out after ${ACTION_TIMEOUT_MS}ms`))
    }, ACTION_TIMEOUT_MS)

    function listener(
      message: { type: string; taskId: string; success: boolean; error?: string }
    ): void {
      if (message.type === 'ACTION_RESULT' && message.taskId === expectedTaskId) {
        clearTimeout(timer)
        chrome.runtime.onMessage.removeListener(listener)
        resolve({ success: message.success, error: message.error })
      }
    }

    chrome.runtime.onMessage.addListener(listener)
  })
}

// ── Main processor ────────────────────────────────────────────

export async function processQueue(): Promise<void> {
  const session = await getSession()
  const settings = await getSettings()

  // 1. Paused?
  if (session.isPaused) {
    logger.debug('Queue paused — skipping')
    return
  }

  // 2. Working hours?
  if (!isWithinWorkingHours(
    settings.workingHoursStart,
    settings.workingHoursEnd,
    settings.timezone
  )) {
    logger.debug('Outside working hours — skipping')
    return
  }

  // 3. Daily limit check (with date reset)
  const todayKey = getTodayKey()
  let { todayCount, todayDate } = session

  if (todayDate !== todayKey) {
    todayCount = 0
    todayDate = todayKey
    await setSession({ todayCount: 0, todayDate })
  }

  if (todayCount >= settings.dailyLimit) {
    logger.info('Daily limit reached', { todayCount, limit: settings.dailyLimit })
    return
  }

  // 4. Fetch next pending task
  let client
  try {
    client = await getAuthenticatedClient()
  } catch (err) {
    logger.error('Failed to get authenticated client', err)
    return
  }

  const now = new Date().toISOString()
  const { data: tasks, error: fetchError } = await client
    .from('message_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(1)

  if (fetchError) {
    logger.error('Failed to fetch queue', fetchError)
    return
  }

  if (!tasks || tasks.length === 0) {
    logger.debug('Queue is empty')
    return
  }

  const task = tasks[0] as MessageQueueItem

  // 5. Mark in_progress
  // Cast to AnyClient: hand-authored Database type doesn't match GenericSchema exactly.
  // Replace with `supabase gen types typescript` output to restore full type safety.
  const db = client as AnyClient
  const { error: updateError } = await db
    .from('message_queue')
    .update({ status: 'in_progress' as QueueStatus })
    .eq('id', task.id)

  if (updateError) {
    logger.error('Failed to mark task in_progress', updateError)
    return
  }

  await setSession({ currentTask: task.id })
  logger.info('Processing task', { id: task.id, action: task.action })

  // 6. Find / open LinkedIn tab
  let tab: chrome.tabs.Tab
  try {
    tab = await openOrFocusLinkedIn('https://www.linkedin.com/')
    if (tab.id == null) throw new Error('Tab has no ID')
    await waitForTabComplete(tab.id)
  } catch (err) {
    logger.error('Failed to open LinkedIn tab', err)
    await markFailed(client, task, 'Could not open LinkedIn tab')
    await setSession({ currentTask: null })
    return
  }

  // 7. Human-like delay before acting
  await humanDelay(2, 5)

  // 8. Send action to content script
  chrome.tabs.sendMessage(tab.id!, {
    type: 'EXECUTE_ACTION',
    task,
  })

  // 9. Wait for result
  let result: { success: boolean; error?: string }
  try {
    result = await waitForActionResult(task.id)
  } catch (err) {
    logger.warn('Action timed out', { taskId: task.id })
    await scheduleRetry(client, task, 'Action timed out')
    await setSession({ currentTask: null })
    return
  }

  if (result.success) {
    // 10a. Mark done
    await db
      .from('message_queue')
      .update({ status: 'done' as QueueStatus, executed_at: new Date().toISOString() })
      .eq('id', task.id)

    // Update lead status if applicable
    const leadStatus = ACTION_TO_LEAD_STATUS[task.action]
    if (leadStatus && task.lead_id) {
      await db
        .from('leads')
        .update({ status: leadStatus as LeadStatus, updated_at: new Date().toISOString() })
        .eq('id', task.lead_id)
    }

    // Increment today count
    const newCount = todayCount + 1
    await setSession({ todayCount: newCount, currentTask: null })

    // Upsert daily_stats
    const statField = ACTION_TO_STAT_FIELD[task.action]
    if (statField) {
      await db.rpc('increment_daily_stat', {
        p_user_id: task.user_id,
        p_date: todayKey,
        p_field: statField,
      }).then(({ error }: { error: unknown } ) => {
        if (error) logger.warn('Failed to update daily_stats', error)
      })
    }

    logger.info('Task completed', { id: task.id, action: task.action, todayCount: newCount })
  } else {
    // 10b. Failure
    logger.warn('Task failed', { taskId: task.id, error: result.error })
    await scheduleRetry(client, task, result.error ?? 'Unknown error')
    await setSession({ currentTask: null })
  }
}

// ── Helpers ───────────────────────────────────────────────────

async function scheduleRetry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  task: MessageQueueItem,
  errorMessage: string
): Promise<void> {
  if (task.retry_count >= MAX_RETRIES - 1) {
    await markFailed(client, task, errorMessage)
    return
  }

  const retryAt = new Date(Date.now() + RETRY_DELAY_MINUTES * 60 * 1000).toISOString()
  await client
    .from('message_queue')
    .update({
      status: 'pending',
      retry_count: task.retry_count + 1,
      scheduled_at: retryAt,
      error_message: errorMessage,
    })
    .eq('id', task.id)

  logger.info('Task scheduled for retry', {
    taskId: task.id,
    attempt: task.retry_count + 1,
    retryAt,
  })
}

async function markFailed(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  task: MessageQueueItem,
  errorMessage: string
): Promise<void> {
  await client
    .from('message_queue')
    .update({ status: 'failed', error_message: errorMessage })
    .eq('id', task.id)

  logger.error('Task permanently failed', { taskId: task.id, errorMessage })
}
