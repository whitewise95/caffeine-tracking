/** These are conservative engineering policies, not established biological constants. */
export const SUBJECTIVE_POLICY = {
  modelVersion: 'subjective-offset-v1',
  baselineHours: 6,
  displayWindowHours: 1,
  minimumAdjustmentHours: -3,
  maximumAdjustmentHours: 6,
  maximumUpdateHours: 0.25,
  learningRate: 0.5,
  priorPenalty: 0.05,
  ordinalScaleHours: 1.5,
  similarWeight: 0.25,
  minimumEvaluationCount: 3,
  minimumImprovementHours: 0.25,
  recallHours: 48,
  staleDays: 14,
  maximumObservationHours: 24,
  maximumIntervalWidthHours: 4,
  evaluationWindow: 8,
} as const

export const HOUR_MS = 3_600_000
export const DAY_MS = HOUR_MS * 24
export const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))
export const durationHours = (start: string, end: string) => (Date.parse(end) - Date.parse(start)) / HOUR_MS
export const addHours = (instant: string, hours: number) => new Date(Date.parse(instant) + hours * HOUR_MS).toISOString()
export const isInstant = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false
  const stamp = Date.parse(value)
  return Number.isFinite(stamp) && new Date(stamp).toISOString() === value
}
export const isTimeZone = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length > 100) return false
  try { new Intl.DateTimeFormat('en', { timeZone: value }).format(0); return true } catch { return false }
}
export const deviceTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
const dateFormatters = new Map<string, Intl.DateTimeFormat>()
export function dateKey(date: Date, timeZone: string): string {
  let formatter = dateFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    if (dateFormatters.size >= 8) dateFormatters.clear()
    dateFormatters.set(timeZone, formatter)
  }
  const parts = formatter.formatToParts(date)
  const part = (key: string) => parts.find((item) => item.type === key)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}
export function previousDate(key: string): string {
  return new Date(Date.parse(`${key}T12:00:00.000Z`) - DAY_MS).toISOString().slice(0, 10)
}
export function assertClock(now: Date, timeZone: string): void {
  if (!Number.isFinite(now.getTime()) || !isTimeZone(timeZone)) throw new RangeError('Invalid personalization clock or time zone')
}
