import { SELECTORS } from '../helpers/selectors'
import { waitForElement } from '../helpers/dom-waiter'
import { humanClick, humanType } from '../helpers/human-input'

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function sendFollowup(payload: {
  message: string
  thread_url?: string
}): Promise<void> {
  // If a thread URL is provided, navigate to it first
  if (payload.thread_url) {
    location.href = payload.thread_url
    // Wait for navigation and page load
    await new Promise((r) => setTimeout(r, 3000))
  }

  // For follow-ups, look for the message input in an existing conversation
  // or open the message modal from the profile
  let input: Element

  const existingInput = document.querySelector(SELECTORS.messageInput)
  if (existingInput) {
    input = existingInput
  } else {
    // Open message modal from profile
    const messageBtn = await waitForElement(SELECTORS.messageButtonOnProfile)
    await humanClick(messageBtn as HTMLElement)

    await waitForElement(SELECTORS.messageModal)
    input = await waitForElement(SELECTORS.messageInput)
  }

  await humanClick(input as HTMLElement)
  await humanType(input as HTMLElement, payload.message)

  // Human pause before sending
  await new Promise((r) => setTimeout(r, randomInt(1000, 2000)))

  const sendBtn = await waitForElement(SELECTORS.messageSendButton)
  await humanClick(sendBtn as HTMLElement)

  // Verify message was sent
  await waitForElement(SELECTORS.messageConfirmation)
}
