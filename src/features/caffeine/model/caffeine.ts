import type { CaffeineEntry, CaffeineState, CaffeineVisualLevel } from './caffeine.types'
import { DEFAULT_CAFFEINE_HALF_LIFE_HOURS, oralCaffeineEstimate, uniformOralCaffeineEstimate, type CaffeineEstimate } from './pharmacokinetics'
import { isValidIntakeTiming } from './intakeTiming'

export { DEFAULT_CAFFEINE_HALF_LIFE_HOURS } from './pharmacokinetics'
export const MAX_CAFFEINE_MG = 1000

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000

function timestamp(date: Date): number {
  const value = date.getTime()
  if (!Number.isFinite(value)) throw new RangeError('계산에 사용할 시각이 올바르지 않아요.')
  return value
}

function isValidDose(caffeineMg: number): boolean {
  return Number.isFinite(caffeineMg) && caffeineMg >= 0 && caffeineMg <= MAX_CAFFEINE_MG
}

/** Model estimates only: these are not measured caffeine concentrations. */
export function caffeineEstimate(
  entries: readonly CaffeineEntry[],
  at: Date,
  halfLifeHours = DEFAULT_CAFFEINE_HALF_LIFE_HOURS,
): CaffeineEstimate {
  const atMs = timestamp(at)

  return entries.reduce<CaffeineEstimate>((total, entry) => {
    const consumedMs = Date.parse(entry.consumedAt)
    if (!isValidDose(entry.caffeineMg) || !isValidIntakeTiming(entry)) return total
    const startedMs = entry.startedAt === undefined ? consumedMs : Date.parse(entry.startedAt)
    if (startedMs > atMs) return total

    const elapsedHours = (atMs - startedMs) / MILLISECONDS_PER_HOUR
    const dose = entry.startedAt === undefined
      ? oralCaffeineEstimate(entry.caffeineMg, elapsedHours, halfLifeHours)
      : uniformOralCaffeineEstimate(entry.caffeineMg, elapsedHours, (consumedMs - startedMs) / MILLISECONDS_PER_HOUR, halfLifeHours)
    return {
      remainingMg: total.remainingMg + dose.remainingMg,
      absorbingMg: total.absorbingMg + dose.absorbingMg,
    }
  }, { remainingMg: 0, absorbingMg: 0 })
}

export function remainingCaffeine(
  entries: readonly CaffeineEntry[],
  at: Date,
  halfLifeHours = DEFAULT_CAFFEINE_HALF_LIFE_HOURS,
): number {
  return caffeineEstimate(entries, at, halfLifeHours).remainingMg
}

export function todayIntake(entries: readonly CaffeineEntry[], now: Date): number {
  const nowMs = timestamp(now)
  const dayKey = localDateKey(now)

  return entries.reduce((total, entry) => {
    const consumedAt = new Date(entry.consumedAt)
    const consumedMs = consumedAt.getTime()
    if (!isValidDose(entry.caffeineMg) || !isValidIntakeTiming(entry) || consumedMs > nowMs) return total
    return localDateKey(consumedAt) === dayKey ? total + entry.caffeineMg : total
  }, 0)
}

/** These levels control visual appearance, not medical risk categories. */
export function getVisualLevel(mg: number): CaffeineVisualLevel {
  if (!Number.isFinite(mg) || mg <= 40) return 'LOW'
  if (mg <= 100) return 'LIGHT'
  if (mg <= 200) return 'FILLED'
  return 'HIGH_VISUAL'
}

export function localDateKey(date: Date): string {
  timestamp(date)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function formatTime(date: Date): string {
  timestamp(date)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function nextEvening(now: Date): Date {
  const nowMs = timestamp(now)
  const evening = new Date(nowMs)
  evening.setHours(22, 0, 0, 0)
  if (evening.getTime() <= nowMs) evening.setDate(evening.getDate() + 1)
  return evening
}

export function createInitialState(): CaffeineState {
  return {
    version: 4,
    entries: [],
    customDrinks: [],
    customCategories: [],
    settings: { halfLifeHours: DEFAULT_CAFFEINE_HALF_LIFE_HOURS },
  }
}
