import { SELECTORS } from '../helpers/selectors'

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export interface ProfileData {
  name: string
  title: string
  company: string
  connected: boolean
}

export async function viewProfile(): Promise<ProfileData> {
  // Simulate natural reading — 3 random scroll events over ~5 seconds
  for (let i = 0; i < 3; i++) {
    const scrollAmount = randomInt(200, 600)
    window.scrollBy({ top: scrollAmount, behavior: 'smooth' })
    await sleep(randomInt(1200, 2200))
  }

  // Scrape profile data
  const nameEl = document.querySelector(SELECTORS.profileHeading)
  const titleEl = document.querySelector(SELECTORS.profileSubtitle)
  const companyEl = document.querySelector(SELECTORS.profileCompany)
  const connectedEl = document.querySelector(
    SELECTORS.alreadyConnectedIndicator,
  )

  return {
    name: nameEl?.textContent?.trim() ?? '',
    title: titleEl?.textContent?.trim() ?? '',
    company: companyEl?.textContent?.trim() ?? '',
    connected: connectedEl !== null,
  }
}
