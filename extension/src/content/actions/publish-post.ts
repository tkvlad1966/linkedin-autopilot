import { SELECTORS } from '../helpers/selectors'
import {
  waitForElement,
  waitForElementGone,
  isOnPage,
} from '../helpers/dom-waiter'
import { humanClick, humanType } from '../helpers/human-input'
import { WrongPageError } from '../errors'

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function publishPost(payload: {
  content: string
}): Promise<void> {
  if (!isOnPage(/linkedin\.com\/feed/)) {
    throw new WrongPageError('linkedin.com/feed', location.href)
  }

  // Open post editor
  const startBtn = await waitForElement(SELECTORS.startPostButton)
  await humanClick(startBtn as HTMLElement)

  // Wait for editor modal
  await waitForElement(SELECTORS.postEditorModal)

  // Focus and type in the post textarea
  const textarea = await waitForElement(SELECTORS.postTextarea)
  await humanClick(textarea as HTMLElement)
  await humanType(textarea as HTMLElement, payload.content)

  // Review pause before publishing
  await new Promise((r) => setTimeout(r, randomInt(2000, 4000)))

  // Publish
  const publishBtn = await waitForElement(SELECTORS.postPublishButton)
  await humanClick(publishBtn as HTMLElement)

  // Wait for editor to close
  await waitForElementGone(SELECTORS.postEditorModal)
}
