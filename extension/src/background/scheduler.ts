// ── Working hours check ───────────────────────────────────────

/**
 * Returns true if the current local time (in the given timezone)
 * falls between start and end (both "HH:MM" strings, 24h format).
 */
export function isWithinWorkingHours(
  start: string,
  end: string,
  timezone: string
): boolean {
  const now = new Date()

  // Get HH and MM in the target timezone via Intl
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = fmt.formatToParts(now)
  const h = parseInt(parts.find(p => p.type === 'hour')!.value, 10)
  const m = parseInt(parts.find(p => p.type === 'minute')!.value, 10)
  const currentMinutes = h * 60 + m

  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const startMinutes = sh * 60 + sm
  const endMinutes   = eh * 60 + em

  if (startMinutes <= endMinutes) {
    // Normal range e.g. 09:00–18:00
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  } else {
    // Overnight range e.g. 22:00–06:00
    return currentMinutes >= startMinutes || currentMinutes < endMinutes
  }
}

// ── Gaussian delay (Box-Muller) ───────────────────────────────

/**
 * Generates a random delay with gaussian distribution,
 * clamped to [minSeconds, maxSeconds]. Resolves after delay.
 */
export async function humanDelay(
  minSeconds: number,
  maxSeconds: number
): Promise<void> {
  const mean = (minSeconds + maxSeconds) / 2
  const stdDev = (maxSeconds - minSeconds) / 6  // ~99.7% within range

  // Box-Muller transform
  const u1 = Math.random()
  const u2 = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)

  const seconds = Math.max(minSeconds, Math.min(maxSeconds, mean + z * stdDev))
  const ms = Math.round(seconds * 1000)

  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Date helpers ──────────────────────────────────────────────

/** Returns today's date as "YYYY-MM-DD" in local timezone. */
export function getTodayKey(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
