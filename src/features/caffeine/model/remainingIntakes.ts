import { caffeineEstimate } from './caffeine'
import { DEFAULT_CAFFEINE_ABSORPTION_RATE_PER_HOUR, type CaffeineEstimate } from './pharmacokinetics'
import type { CaffeineEntry } from './caffeine.types'

/** A list display cutoff only; excluded amounts still contribute to the home total. */
export const MIN_VISIBLE_REMAINING_MG = 1

/** Minutes until unabsorbed caffeine falls below the list's display cutoff. */
export function absorptionMinutesRemaining(entry: CaffeineEntry, at: Date, halfLifeHours: number): number | null {
  const current = caffeineEstimate([entry], at, halfLifeHours)
  if (current.absorbingMg < MIN_VISIBLE_REMAINING_MG) return null

  // Valid imported periods can still be in progress. Include their remaining
  // input first, then decay the gut amount present at the final sip.
  const endMs = Math.max(at.getTime(), Date.parse(entry.consumedAt))
  const gutAtEnd = endMs === at.getTime()
    ? current.absorbingMg
    : caffeineEstimate([entry], new Date(endMs), halfLifeHours).absorbingMg
  const absorptionTailHours = Math.max(0, Math.log(gutAtEnd / MIN_VISIBLE_REMAINING_MG) / DEFAULT_CAFFEINE_ABSORPTION_RATE_PER_HOUR)
  const minutes = (endMs - at.getTime()) / 60_000 + absorptionTailHours * 60
  // Exactly 1mg still shows "absorbing"; never pair that state with 0 minutes.
  return Math.max(1, Math.ceil(minutes))
}

export function remainingIntakes(entries: readonly CaffeineEntry[], at: Date, halfLifeHours: number): (CaffeineEstimate & { entry: CaffeineEntry })[] {
  return entries
    .map(entry => ({ entry, ...caffeineEstimate([entry], at, halfLifeHours) }))
    .filter(item => item.remainingMg >= MIN_VISIBLE_REMAINING_MG || item.absorbingMg >= MIN_VISIBLE_REMAINING_MG)
    .sort((a, b) => Date.parse(b.entry.consumedAt) - Date.parse(a.entry.consumedAt))
}
