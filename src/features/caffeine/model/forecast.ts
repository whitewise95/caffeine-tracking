import type { CaffeineEntry } from './caffeine.types'
import { isValidIntakeTiming } from './intakeTiming'

/** Freeze oral input at now; a forecast must never assume any future sips. */
export function consumedEntriesAt(entries: readonly CaffeineEntry[], at: Date): CaffeineEntry[] {
  const now = at.getTime()
  if (!Number.isFinite(now)) return []
  return entries.flatMap(entry => {
    if (!isValidIntakeTiming(entry)) return []
    const end = Date.parse(entry.consumedAt)
    if (end <= now) return [entry]
    if (!entry.startedAt) return []
    const start = Date.parse(entry.startedAt)
    if (start >= now) return []
    // Normally entries are completed; this also handles imported intervals or a clock rollback.
    return [{ ...entry, consumedAt: at.toISOString(), caffeineMg: entry.caffeineMg * (now - start) / (end - start) }]
  })
}
