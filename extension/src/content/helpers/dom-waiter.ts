import { ElementNotFoundError, TimeoutError } from '../errors'

const POLL_INTERVAL = 200

export async function waitForElement(
  selector: string,
  timeout = 10000,
): Promise<Element> {
  const start = Date.now()

  while (Date.now() - start < timeout) {
    const el = document.querySelector(selector)
    if (el) return el

    await new Promise((r) => setTimeout(r, POLL_INTERVAL))
  }

  throw new ElementNotFoundError(selector, timeout)
}

export async function waitForElementGone(
  selector: string,
  timeout = 5000,
): Promise<void> {
  const start = Date.now()

  while (Date.now() - start < timeout) {
    if (!document.querySelector(selector)) return

    await new Promise((r) => setTimeout(r, POLL_INTERVAL))
  }

  throw new TimeoutError(`waitForElementGone("${selector}")`, timeout)
}

export function isOnPage(urlPattern: RegExp): boolean {
  return urlPattern.test(location.href)
}

export async function scrollIntoViewAndWait(element: Element): Promise<void> {
  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  await new Promise((r) => setTimeout(r, 300))
}
