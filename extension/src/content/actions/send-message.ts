import { SELECTORS } from '../helpers/selectors'
import { waitForElement } from '../helpers/dom-waiter'
import { humanClick, humanType } from '../helpers/human-input'

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function sendMessage(payload: {
  message: string
}): Promise<void> {
  // Open message modal
  const messageBtn = await waitForElement(SELECTORS.messageButtonOnProfile)
  await humanClick(messageBtn as HTMLElement)

  // Wait for modal and input
  await waitForElement(SELECTORS.messageModal)
  const input = await waitForElement(SELECTORS.messageInput)
  await humanClick(input as HTMLElement)

  // Type the message
  await humanType(input as HTMLElement, payload.message)

  // Human pause before sending
  await new Promise((r) => setTimeout(r, randomInt(1000, 2000)))

  // Send
  const sendBtn = await waitForElement(SELECTORS.messageSendButton)
  await humanClick(sendBtn as HTMLElement)

  // Verify message was sent
  await waitForElement(SELECTORS.messageConfirmation)
}
