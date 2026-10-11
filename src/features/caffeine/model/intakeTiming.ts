import type { CaffeineIntakeTiming } from './caffeine.types'

/** Earlier clock times finish on the following local calendar day, not 24 hours later. */
export function inferIntakeEndDay(start: Date, end: Date): Date {
  const inferred = new Date(end)
  inferred.setFullYear(start.getFullYear(), start.getMonth(), start.getDate())
  if (end.getHours() * 60 + end.getMinutes() < start.getHours() * 60 + start.getMinutes()) {
    inferred.setDate(inferred.getDate() + 1)
  }
  return inferred
}

/** Validate chronology; repositories additionally validate the serialized ISO format. */
export function isValidIntakeTiming(timing: CaffeineIntakeTiming, at?: Date): boolean {
  const end = Date.parse(timing.consumedAt)
  if (!Number.isFinite(end)) return false
  if (at !== undefined && (!Number.isFinite(at.getTime()) || end > at.getTime())) return false
  if (timing.startedAt === undefined) return true
  const start = Date.parse(timing.startedAt)
  return Number.isFinite(start) && start < end
}
