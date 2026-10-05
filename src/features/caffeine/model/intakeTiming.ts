import type { CaffeineIntakeTiming } from './caffeine.types'

/** Validate chronology; repositories additionally validate the serialized ISO format. */
export function isValidIntakeTiming(timing: CaffeineIntakeTiming, at?: Date): boolean {
  const end = Date.parse(timing.consumedAt)
  if (!Number.isFinite(end)) return false
  if (at !== undefined && (!Number.isFinite(at.getTime()) || end > at.getTime())) return false
  if (timing.startedAt === undefined) return true
  const start = Date.parse(timing.startedAt)
  return Number.isFinite(start) && start < end
}
