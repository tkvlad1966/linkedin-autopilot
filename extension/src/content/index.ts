import type { MessageQueueItem } from '@shared/types'
import { SELECTORS } from './helpers/selectors'
import { sendConnection } from './actions/send-connection'
import { sendMessage } from './actions/send-message'
import { sendFollowup } from './actions/send-followup'
import { viewProfile } from './actions/view-profile'
import { publishPost } from './actions/publish-post'

type ActionResult = {
  type: 'ACTION_RESULT'
  taskId: string
  success: boolean
  data?: unknown
  error?: string
}

// ------------------------------------------------------------------
// Route incoming EXECUTE_ACTION messages to the correct action handler
// ------------------------------------------------------------------
chrome.runtime.onMessage.addListener(
  (
    message: { type: string; task: MessageQueueItem },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ActionResult) => void,
  ) => {
    if (message.type !== 'EXECUTE_ACTION') return false

    const { task } = message

    // Execute asynchronously and send the response when done
    executeAction(task)
      .then((data) => {
        sendResponse({
          type: 'ACTION_RESULT',
          taskId: task.id,
          success: true,
          data,
        })
      })
      .catch((err: Error) => {
        sendResponse({
          type: 'ACTION_RESULT',
          taskId: task.id,
          success: false,
          error: `[${err.name}] ${err.message}`,
        })
      })

    // Return true to indicate we will respond asynchronously
    return true
  },
)

// ------------------------------------------------------------------
// Action dispatcher
// ------------------------------------------------------------------
async function executeAction(task: MessageQueueItem): Promise<unknown> {
  const { action, payload } = task

  switch (action) {
    case 'send_connection':
      await sendConnection(payload as { note?: string })
      return null

    case 'send_message':
      await sendMessage(payload as { message: string })
      return null

    case 'send_followup':
      await sendFollowup(payload as { message: string; thread_url?: string })
      return null

    case 'view_profile':
      return await viewProfile()

    case 'publish_post':
      await publishPost(payload as { content: string })
      return null

    default:
      throw new Error(`Unknown action: ${action}`)
  }
}

// ------------------------------------------------------------------
// Restriction detection — check on page load
// ------------------------------------------------------------------
function checkForRestrictions(): void {
  const restrictionEl = document.querySelector(SELECTORS.restrictionWarning)
  if (restrictionEl) {
    chrome.runtime.sendMessage({
      type: 'LINKEDIN_RESTRICTION',
      detail: restrictionEl.textContent?.trim() ?? 'Unknown restriction',
    })
  }

  const weeklyLimitEl = document.querySelector(SELECTORS.weeklyLimitWarning)
  if (weeklyLimitEl) {
    const text = weeklyLimitEl.textContent?.trim() ?? ''
    if (text.toLowerCase().includes('limit') || text.toLowerCase().includes('restrict')) {
      chrome.runtime.sendMessage({
        type: 'LINKEDIN_RESTRICTION',
        detail: text,
      })
    }
  }
}

// Run restriction check once the page is ready
checkForRestrictions()

// Also observe for dynamically inserted restriction modals
const restrictionObserver = new MutationObserver(() => {
  checkForRestrictions()
})

restrictionObserver.observe(document.body, {
  childList: true,
  subtree: true,
})

console.log('[LinkedIn Autopilot] Content script loaded')
