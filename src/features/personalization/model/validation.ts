import type { FeedbackInput, PersonalizationState } from './types'
import { SUBJECTIVE_POLICY as P, addHours, dateKey, durationHours, isInstant, isTimeZone } from './policy'

const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const integer = (value: unknown): value is number => finite(value) && Number.isSafeInteger(value) && value >= 0
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 500
const bounded = (value: unknown, min: number, max: number): value is number => finite(value) && value >= min && value <= max
const adjustment = (value: unknown): value is number => bounded(value, P.minimumAdjustmentHours, P.maximumAdjustmentHours)
const hours = (value: unknown): value is number => bounded(value, P.baselineHours + P.minimumAdjustmentHours, P.baselineHours + P.maximumAdjustmentHours)
const date = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && isInstant(`${value}T00:00:00.000Z`)
const optional = (value: unknown, validator: (value: unknown) => boolean) => value === undefined || validator(value)
const uniqueIds = (values: unknown[]) => {
  const ids = values.map((item) => object(item) ? item.id : undefined)
  return new Set(ids).size === ids.length
}
function interval(value: unknown): value is { start: string; end: string } {
  return object(value) && isInstant(value.start) && isInstant(value.end) && value.start <= value.end && durationHours(value.start, value.end) <= P.maximumIntervalWidthHours
}
function source(value: unknown): boolean {
  return object(value) && text(value.id) && finite(value.caffeineMg) && value.caffeineMg > 0 && isInstant(value.consumedAt) &&
    optional(value.sourceType, (type) => type === 'sample' || type === 'official' || type === 'custom')
}
function sourceSnapshot(value: Record<string, unknown>): boolean {
  if (!Array.isArray(value.sourceEntries) || !value.sourceEntries.length || !value.sourceEntries.every(source) || !uniqueIds(value.sourceEntries)) return false
  return typeof value.sourceRevision === 'string' && value.sourceRevision === JSON.stringify(value.sourceEntries)
}
function target(value: Record<string, unknown>): boolean {
  return date(value.targetDate) && isTimeZone(value.timeZone) && isInstant(value.lastIntakeAt) && dateKey(new Date(value.lastIntakeAt), value.timeZone) === value.targetDate
}
export function isFeedbackInput(value: unknown): value is FeedbackInput {
  if (!object(value) || !target(value) || !['earlier', 'similar', 'later', 'unknown', 'interval'].includes(String(value.answer))) return false
  if (!Array.isArray(value.confounders) || value.confounders.length > 10 || !value.confounders.every(text)) return false
  if (!optional(value.predictionId, text) || !optional(value.observedWithoutComparison, (item) => typeof item === 'boolean')) return false
  if (!optional(value.responseKind, (kind) => kind === 'daily-feeling')) return false
  if (value.responseKind === 'daily-feeling') {
    return ['earlier', 'similar', 'later'].includes(String(value.answer)) && value.predictionId === undefined && value.observedInterval === undefined && value.observedWithoutComparison === undefined
  }
  if (value.answer === 'interval') return interval(value.observedInterval)
  return value.observedInterval === undefined && value.observedWithoutComparison === undefined
}
function feedback(value: unknown): boolean {
  if (!object(value) || !text(value.id) || !isInstant(value.respondedAt) || !sourceSnapshot(value)) return false
  if (!optional(value.editedAt, isInstant) || (isInstant(value.editedAt) && value.editedAt < value.respondedAt)) return false
  const input = value.answer === 'skipped' ? { ...value, answer: 'unknown' } : value
  if (!isFeedbackInput(input) || !isInstant(value.lastIntakeAt) || value.respondedAt < value.lastIntakeAt) return false
  if (input.responseKind === 'daily-feeling') {
    const entries = value.sourceEntries as Array<{ consumedAt: string }>
    if (entries.at(-1)?.consumedAt !== value.lastIntakeAt || entries.some((entry) => entry.consumedAt > input.lastIntakeAt || dateKey(new Date(entry.consumedAt), input.timeZone) !== input.targetDate)) return false
  }
  if (input.observedInterval && (input.observedInterval.start < input.lastIntakeAt || input.observedInterval.end > (value.editedAt ?? value.respondedAt) || durationHours(input.lastIntakeAt, input.observedInterval.end) > P.maximumObservationHours)) return false
  return true
}
function prediction(value: unknown): boolean {
  if (!object(value) || !text(value.id) || !target(value) || value.modelVersion !== P.modelVersion || !integer(value.parameterVersion) || !isInstant(value.createdAt)) return false
  if (!object(value.parameters) || !adjustment(value.parameters.perceivedDurationAdjustment) || !sourceSnapshot(value) || !interval(value.interval) || typeof value.trainingRevision !== 'string') return false
  if (value.baselineHours !== P.baselineHours || !hours(value.candidateHours) || !hours(value.simpleHours) || !hours(value.appliedHours)) return false
  if (value.candidateHours !== P.baselineHours + value.parameters.perceivedDurationAdjustment || !isInstant(value.lastIntakeAt)) return false
  if (value.appliedHours !== value.baselineHours && value.appliedHours !== value.candidateHours) return false
  if (value.interval.start !== addHours(value.lastIntakeAt, value.appliedHours - P.displayWindowHours) || value.interval.end !== addHours(value.lastIntakeAt, value.appliedHours + P.displayWindowHours)) return false
  if (value.createdAt < value.lastIntakeAt || value.interval.start <= value.createdAt) return false
  const entries = value.sourceEntries as Array<{ consumedAt: string }>
  if (entries.at(-1)?.consumedAt !== value.lastIntakeAt || entries.some((entry) => entry.consumedAt > (value.createdAt as string) || dateKey(new Date(entry.consumedAt), value.timeZone as string) !== value.targetDate)) return false
  return /^subjective-offset-v1:\d+:[0-9a-z]+:[0-9a-z]+$/.test(value.trainingRevision)
}
function update(value: unknown): boolean {
  const reasons = ['learned', 'unknown', 'skipped', 'confounded', 'source-changed', 'time-zone-changed', 'invalid-observation', 'missing-prediction', 'stale', 'contradictory']
  return object(value) && text(value.feedbackId) && adjustment(value.previousAdjustment) && adjustment(value.nextAdjustment) && Math.abs(value.nextAdjustment - value.previousAdjustment) <= P.maximumUpdateHours + 1e-9 && bounded(value.weight, 0, 1) && reasons.includes(String(value.reason))
}
function evaluation(value: unknown): boolean {
  if (!object(value) || !integer(value.count) || value.count > P.evaluationWindow) return false
  return ['baselineErrorHours', 'candidateErrorHours', 'simpleErrorHours'].every((key) => value.count === 0 ? value[key] === null : bounded(value[key], 0, P.maximumObservationHours))
}
export function isPersonalizationState(value: unknown): value is PersonalizationState {
  if (!object(value) || value.version !== 1 || typeof value.enabled !== 'boolean' || !integer(value.parameterVersion) || !adjustment(value.perceivedDurationAdjustment)) return false
  if (!Array.isArray(value.predictions) || !value.predictions.every(prediction) || !uniqueIds(value.predictions)) return false
  if (!Array.isArray(value.feedback) || !value.feedback.every(feedback) || !uniqueIds(value.feedback)) return false
  const targets = value.feedback.map((record) => object(record) ? `${record.targetDate}:${record.timeZone}` : '')
  if (new Set(targets).size !== targets.length || !Array.isArray(value.updates) || !value.updates.every(update)) return false
  const feedbackIds = new Set(value.feedback.map((record) => object(record) ? record.id : ''))
  if (value.updates.some((item) => !object(item) || !feedbackIds.has(item.feedbackId)) || new Set(value.updates.map((item) => object(item) ? item.feedbackId : '')).size !== value.updates.length) return false
  return evaluation(value.evaluation) && ['none', 'time-zone-changed', 'stale', 'contradictory', 'worse-than-baseline'].includes(String(value.holdReason))
}
