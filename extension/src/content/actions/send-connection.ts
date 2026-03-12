import { SELECTORS } from '../helpers/selectors'
import {
  waitForElement,
  waitForElementGone,
  isOnPage,
  scrollIntoViewAndWait,
} from '../helpers/dom-waiter'
import { humanClick, humanType } from '../helpers/human-input'
import { AlreadyConnectedError, WrongPageError } from '../errors'

export async function sendConnection(payload: {
  note?: string
}): Promise<void> {
  if (!isOnPage(/\/in\/[^/]+/)) {
    throw new WrongPageError('/in/<profile>', location.href)
  }

  // Check if already connected
  const alreadyConnected = document.querySelector(
    SELECTORS.alreadyConnectedIndicator,
  )
  if (alreadyConnected) {
    throw new AlreadyConnectedError()
  }

  // Find and click Connect button
  const connectBtn = await waitForElement(SELECTORS.connectButton)
  await scrollIntoViewAndWait(connectBtn)
  await humanClick(connectBtn as HTMLElement)

  // Wait for the connection modal
  await waitForElement(SELECTORS.connectModal)

  // Optionally add a note
  if (payload.note) {
    const addNoteBtn = await waitForElement(SELECTORS.addNoteButton)
    await humanClick(addNoteBtn as HTMLElement)

    const textarea = await waitForElement(SELECTORS.connectionNoteTextarea)
    await humanType(textarea as HTMLElement, payload.note)
  }

  // Click "Send now"
  const sendBtn = await waitForElement(SELECTORS.connectionSendButton)
  await humanClick(sendBtn as HTMLElement)

  // Wait for modal to close
  await waitForElementGone(SELECTORS.connectModal)
}
