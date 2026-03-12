import { logger } from './logger'

const LINKEDIN_ORIGIN = 'https://www.linkedin.com'

// ── Find existing LinkedIn tab ────────────────────────────────

export async function findLinkedInTab(): Promise<chrome.tabs.Tab | null> {
  const tabs = await chrome.tabs.query({ url: `${LINKEDIN_ORIGIN}/*` })
  return tabs[0] ?? null
}

// ── Open or focus LinkedIn tab ────────────────────────────────

export async function openOrFocusLinkedIn(url: string): Promise<chrome.tabs.Tab> {
  const existing = await findLinkedInTab()

  if (existing?.id != null) {
    // Focus existing tab and navigate if needed
    await chrome.tabs.update(existing.id, { active: true, url })
    await chrome.windows.update(existing.windowId!, { focused: true })
    logger.debug('Focused existing LinkedIn tab', { tabId: existing.id, url })
    return existing
  }

  // Open a new tab
  const tab = await chrome.tabs.create({ url, active: false })
  logger.debug('Opened new LinkedIn tab', { tabId: tab.id, url })
  return tab
}

// ── Navigate an existing tab ──────────────────────────────────

export async function navigateTab(tabId: number, url: string): Promise<void> {
  await chrome.tabs.update(tabId, { url })
  logger.debug('Navigated tab', { tabId, url })
}

// ── Wait for tab to finish loading ───────────────────────────

export async function waitForTabComplete(
  tabId: number,
  timeout = 15000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener)
      reject(new Error(`Tab ${tabId} did not complete within ${timeout}ms`))
    }, timeout)

    function listener(
      updatedTabId: number,
      changeInfo: chrome.tabs.TabChangeInfo
    ): void {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timer)
        chrome.tabs.onUpdated.removeListener(listener)
        logger.debug('Tab completed loading', { tabId })
        resolve()
      }
    }

    chrome.tabs.onUpdated.addListener(listener)
  })
}
