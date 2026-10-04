import { remainingCaffeine } from './caffeine'
import type { CaffeineEntry } from './caffeine.types'

/** A list display cutoff only; excluded amounts still contribute to the home total. */
export const MIN_VISIBLE_REMAINING_MG = 1

export function remainingIntakes(entries: readonly CaffeineEntry[], at: Date, halfLifeHours: number): { entry: CaffeineEntry; remainingMg: number }[] {
  return entries
    .map(entry => ({ entry, remainingMg: remainingCaffeine([entry], at, halfLifeHours) }))
    .filter(item => item.remainingMg >= MIN_VISIBLE_REMAINING_MG)
    .sort((a, b) => Date.parse(b.entry.consumedAt) - Date.parse(a.entry.consumedAt))
}
