import type { CaffeineEntry } from '../../caffeine/model/caffeine.types'
import { MAX_CAFFEINE_MG } from '../../caffeine/model/caffeine'
import type {
  CheckInCandidate, EvaluationSummary, FeedbackInput, FeedbackRecord, LearningSummary,
  LearningUpdate, PersonalizationState, PredictionSnapshot, SourceEntry, UpdateReason,
} from './types'
import {
  SUBJECTIVE_POLICY as P, DAY_MS, addHours, assertClock, clamp, dateKey,
  deviceTimeZone, durationHours, isInstant, previousDate,
} from './policy'
import { isFeedbackInput } from './validation'

export { SUBJECTIVE_POLICY } from './policy'

export interface SubjectiveUpdatePolicy { learningRate: number; priorPenalty: number; maximumUpdateHours: number }
export function updateSubjectiveAdjustment(adjustment: number, gradient: number, weight: number, policy: SubjectiveUpdatePolicy = P): number {
  if (![adjustment, gradient, weight, policy.learningRate, policy.priorPenalty, policy.maximumUpdateHours].every(Number.isFinite) || weight < 0 || weight > 1 || policy.learningRate <= 0 || policy.priorPenalty < 0 || policy.maximumUpdateHours <= 0) throw new RangeError('Invalid subjective update input')
  const delta = clamp(-policy.learningRate * (weight * gradient + policy.priorPenalty * adjustment), -policy.maximumUpdateHours, policy.maximumUpdateHours)
  return clamp(adjustment + delta, P.minimumAdjustmentHours, P.maximumAdjustmentHours)
}

const emptyEvaluation = (): EvaluationSummary => ({ count: 0, baselineErrorHours: null, candidateErrorHours: null, simpleErrorHours: null })
export function createPersonalizationState(): PersonalizationState {
  return { version: 1, enabled: true, parameterVersion: 0, perceivedDurationAdjustment: 0, predictions: [], feedback: [], updates: [], evaluation: emptyEvaluation(), holdReason: 'none' }
}

type SourceContext = Array<{ entry: SourceEntry; day: string }>
function prepareSources(entries: CaffeineEntry[], timeZone: string): SourceContext {
  return entries.flatMap((entry) => {
      if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(entry.consumedAt) || !isInstant(`${entry.consumedAt.slice(0, 10)}T00:00:00.000Z`)) return []
      const stamp = Date.parse(entry.consumedAt)
      if (!Number.isFinite(stamp) || !Number.isFinite(entry.caffeineMg) || entry.caffeineMg <= 0 || entry.caffeineMg > MAX_CAFFEINE_MG) return []
      const sourceType = 'sourceType' in entry && (entry.sourceType === 'sample' || entry.sourceType === 'official' || entry.sourceType === 'custom') ? entry.sourceType : undefined
      return [{ entry: { id: entry.id, caffeineMg: entry.caffeineMg, consumedAt: new Date(stamp).toISOString(), ...(sourceType ? { sourceType } : {}) }, day: dateKey(new Date(stamp), timeZone) }]
    })
    .sort((a, b) => a.entry.consumedAt.localeCompare(b.entry.consumedAt) || a.entry.id.localeCompare(b.entry.id))
}
function sources(entries: CaffeineEntry[], day: string, timeZone: string, until: string, prepared = prepareSources(entries, timeZone)): SourceEntry[] {
  return prepared.filter((item) => item.entry.consumedAt <= until && item.day >= day).map((item) => item.entry)
}
const revision = (entries: SourceEntry[]) => JSON.stringify(entries)
const fingerprint = (text: string) => {
  let hash = 2166136261
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619)
  return (hash >>> 0).toString(36)
}
function targetEntries(entries: CaffeineEntry[], day: string, now: Date, timeZone: string): SourceEntry[] {
  return sources(entries, day, timeZone, now.toISOString()).filter((entry) => dateKey(new Date(entry.consumedAt), timeZone) === day)
}
function sourceMatches(snapshot: { sourceRevision: string; targetDate: string; timeZone: string }, entries: CaffeineEntry[], until: string, prepared?: SourceContext): boolean {
  return snapshot.sourceRevision === revision(sources(entries, snapshot.targetDate, snapshot.timeZone, until, prepared))
}
function predictionMatches(prediction: PredictionSnapshot, entries: CaffeineEntry[], now: Date, timeZone: string, prepared?: SourceContext): boolean {
  return prediction.modelVersion === P.modelVersion && prediction.timeZone === timeZone && prediction.createdAt <= now.toISOString() &&
    sourceMatches(prediction, entries, prediction.interval.end, prepared)
}
type LearningFingerprint = { count: number; left: number; right: number }
const emptyFingerprint = (): LearningFingerprint => ({ count: 0, left: 2166136261, right: 2246822519 })
const extendFingerprint = (previous: LearningFingerprint, record: FeedbackRecord): LearningFingerprint => {
  const fields = [record.id, record.answer, record.observedInterval, record.editedAt ?? record.respondedAt, record.sourceRevision]
  // Preserve the fingerprints of previously stored, forecast-relative feedback.
  if (record.responseKind) fields.push(record.responseKind)
  const value = JSON.stringify(fields)
  let { left, right } = previous
  for (let index = 0; index < value.length; index++) {
    left = Math.imul(left ^ value.charCodeAt(index), 16777619)
    right = Math.imul(right ^ value.charCodeAt(index), 2246822519)
  }
  return { count: previous.count + 1, left: left >>> 0, right: right >>> 0 }
}
// Compact deterministic change detection, not a security or authenticity mechanism.
const fingerprintRevision = (value: LearningFingerprint) => `${P.modelVersion}:${value.count}:${value.left.toString(36)}:${value.right.toString(36)}`
const learningRevision = (records: FeedbackRecord[]) => fingerprintRevision(records.reduce(extendFingerprint, emptyFingerprint()))
function learnedRecords(state: PersonalizationState): FeedbackRecord[] {
  if (state.holdReason === 'stale' || state.holdReason === 'time-zone-changed') return []
  const ids = new Set(state.updates.filter((update) => update.reason === 'learned').map((update) => update.feedbackId))
  return state.feedback.filter((record) => ids.has(record.id)).sort((a, b) => a.respondedAt.localeCompare(b.respondedAt) || a.id.localeCompare(b.id))
}

export function getCurrentPrediction(state: PersonalizationState, entries: CaffeineEntry[], now: Date, timeZone = deviceTimeZone()): PredictionSnapshot | null {
  assertClock(now, timeZone)
  if (!state.enabled) return null
  return currentPrediction(reconcilePersonalization(state, entries, now, timeZone), entries, now, timeZone)
}
function currentPrediction(state: PersonalizationState, entries: CaffeineEntry[], now: Date, timeZone: string): PredictionSnapshot | null {
  const day = dateKey(now, timeZone)
  const latest = targetEntries(entries, day, now, timeZone).at(-1)
  if (!latest) return null
  const trainingRevision = learningRevision(learnedRecords(state))
  return [...state.predictions].reverse().find((prediction) => prediction.targetDate === day && prediction.lastIntakeAt === latest.consumedAt && prediction.trainingRevision === trainingRevision && predictionMatches(prediction, entries, now, timeZone)) ?? null
}

/** Call only in response to actually showing the forecast; persist the returned snapshot unchanged. */
export function createPrediction(state: PersonalizationState, entries: CaffeineEntry[], now: Date, timeZone = deviceTimeZone()): PredictionSnapshot | null {
  assertClock(now, timeZone)
  if (!state.enabled) return null
  const current = reconcilePersonalization(state, entries, now, timeZone)
  if (currentPrediction(current, entries, now, timeZone)) return null
  const targetDate = dateKey(now, timeZone)
  const sourceEntries = targetEntries(entries, targetDate, now, timeZone)
  const latest = sourceEntries.at(-1)
  if (!latest) return null
  const previous = learnedRecords(current)
  const intervalDurations = previous.filter((record) => record.answer === 'interval' && record.observedInterval).map((record) => {
    const interval = record.observedInterval!
    return (durationHours(record.lastIntakeAt, interval.start) + durationHours(record.lastIntakeAt, interval.end)) / 2
  })
  const baselineHours = P.baselineHours
  const candidateHours = baselineHours + current.perceivedDurationAdjustment
  const simpleHours = intervalDurations.length ? clamp(intervalDurations.reduce((a, b) => a + b, 0) / intervalDurations.length, 3, 12) : baselineHours
  const status = getLearningSummary(current).status
  const appliedHours = status === 'active' || status === 'self-reported' ? candidateHours : baselineHours
  // All three comparison forecasts must precede their possible outcomes.
  const earliestHours = Math.min(baselineHours, candidateHours, simpleHours, appliedHours) - P.displayWindowHours
  if (addHours(latest.consumedAt, earliestHours) <= now.toISOString()) return null
  const sourceRevision = revision(sourceEntries)
  const id = `prediction:${targetDate}:${fingerprint(`${timeZone}:${sourceRevision}`)}:${current.parameterVersion}`
  if (state.predictions.some((prediction) => prediction.id === id)) return null
  return {
    id, modelVersion: P.modelVersion, parameterVersion: current.parameterVersion, createdAt: now.toISOString(),
    targetDate, timeZone, lastIntakeAt: latest.consumedAt,
    parameters: { perceivedDurationAdjustment: current.perceivedDurationAdjustment }, sourceEntries, sourceRevision,
    trainingRevision: learningRevision(previous), baselineHours, candidateHours, simpleHours, appliedHours,
    interval: { start: addHours(latest.consumedAt, appliedHours - P.displayWindowHours), end: addHours(latest.consumedAt, appliedHours + P.displayWindowHours) },
  }
}

export function getCheckIn(state: PersonalizationState, entries: CaffeineEntry[], now: Date, timeZone = deviceTimeZone()): CheckInCandidate | null {
  assertClock(now, timeZone)
  if (!state.enabled) return null
  const targetDate = previousDate(dateKey(now, timeZone))
  if (state.feedback.some((record) => record.answer !== 'skipped' && record.targetDate === targetDate && record.timeZone === timeZone)) return null
  const latest = targetEntries(entries, targetDate, now, timeZone).at(-1)
  if (!latest) return null
  if (state.feedback.some((record) => record.answer !== 'skipped' && record.lastIntakeAt === latest.consumedAt)) return null
  const prediction = [...state.predictions].reverse().find((candidate) => candidate.targetDate === targetDate && candidate.lastIntakeAt === latest.consumedAt && predictionMatches(candidate, entries, now, timeZone))
  return { targetDate, lastIntakeAt: latest.consumedAt, timeZone, ...(prediction ? { prediction } : {}) }
}

function observationReason(record: FeedbackRecord, entries: CaffeineEntry[], now: Date, timeZone: string, prediction?: PredictionSnapshot, prepared?: SourceContext): UpdateReason | null {
  if (record.answer === 'unknown' || record.answer === 'skipped') return record.answer
  if (record.confounders.length) return 'confounded'
  if (record.timeZone !== timeZone) return 'time-zone-changed'
  if (record.respondedAt > now.toISOString()) return 'invalid-observation'
  const responseAt = record.editedAt ?? record.respondedAt
  if (responseAt > now.toISOString()) return 'invalid-observation'
  if (durationHours(record.lastIntakeAt, responseAt) > P.recallHours) return 'stale'
  if (record.responseKind === 'daily-feeling') {
    if (!['earlier', 'similar', 'later'].includes(record.answer) || record.respondedAt < record.lastIntakeAt) return 'invalid-observation'
    const latest = prepared?.filter((item) => item.day === record.targetDate && item.entry.consumedAt <= now.toISOString()).at(-1)?.entry
    if (latest?.consumedAt !== record.lastIntakeAt || !sourceMatches(record, entries, record.lastIntakeAt, prepared)) return 'source-changed'
    return null
  }
  const end = record.observedInterval?.end ?? prediction?.interval.end ?? addHours(record.lastIntakeAt, P.baselineHours + P.maximumAdjustmentHours + P.displayWindowHours)
  if (!sourceMatches(record, entries, end, prepared)) return 'source-changed'
  // A new dose inside the reported outcome cannot be attributed to yesterday's last dose,
  // even when it was already present when this feedback snapshot was first created.
  if (record.sourceEntries.some((entry) => entry.consumedAt > record.lastIntakeAt)) return 'source-changed'
  if (record.answer !== 'interval') {
    if (!prediction || !predictionMatches(prediction, entries, now, timeZone, prepared) || prediction.createdAt >= record.respondedAt) return 'missing-prediction'
  }
  if (record.answer === 'interval' && (!record.observedInterval || record.observedInterval.start < record.lastIntakeAt || record.observedInterval.end > responseAt || durationHours(record.lastIntakeAt, record.observedInterval.end) > P.maximumObservationHours)) return 'invalid-observation'
  return null
}

/** Censored logistic likelihood: ordinal labels never become fabricated exact times. */
function ordinalGradient(meanHours: number, record: FeedbackRecord, prediction: PredictionSnapshot): number {
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
  const lower = durationHours(record.lastIntakeAt, prediction.interval.start)
  const upper = durationHours(record.lastIntakeAt, prediction.interval.end)
  const a = sigmoid((lower - meanHours) / P.ordinalScaleHours)
  const b = sigmoid((upper - meanHours) / P.ordinalScaleHours)
  if (record.answer === 'earlier') return (1 - a) / P.ordinalScaleHours
  if (record.answer === 'later') return -b / P.ordinalScaleHours
  return (b * (1 - b) - a * (1 - a)) / (P.ordinalScaleHours * Math.max(b - a, 1e-8))
}
const intervalError = (hours: number, lower: number, upper: number) => Math.abs(hours - clamp(hours, lower, upper))

export function reconcilePersonalization(state: PersonalizationState, entries: CaffeineEntry[], now: Date, timeZone = deviceTimeZone()): PersonalizationState {
  assertClock(now, timeZone)
  const prepared = prepareSources(entries, timeZone)
  let adjustment = 0
  const updates: LearningUpdate[] = []
  const learned: FeedbackRecord[] = []
  const learningFingerprints: LearningFingerprint[] = [emptyFingerprint()]
  const recentDirections: number[] = []
  const errors: Array<{ baseline: number; candidate: number; simple: number }> = []
  let lastLearnedAt: string | null = null
  const ordered = [...state.feedback].sort((a, b) => a.respondedAt.localeCompare(b.respondedAt) || a.id.localeCompare(b.id))
  for (const record of ordered) {
    const prediction = state.predictions.find((candidate) => candidate.id === record.predictionId)
    const reason = observationReason(record, entries, now, timeZone, prediction, prepared)
    if (reason) {
      updates.push({ feedbackId: record.id, previousAdjustment: adjustment, nextAdjustment: adjustment, weight: 0, reason })
      continue
    }
    // Forget an old episode only after a gap in usable feedback, not on each day.
    // This retains the contemporaneous provenance of forecasts during continuous use.
    if (lastLearnedAt && durationHours(lastLearnedAt, record.respondedAt) > P.staleDays * 24) {
      adjustment = 0
      learned.length = 0
      learningFingerprints.splice(0, learningFingerprints.length, emptyFingerprint())
      errors.length = 0
      recentDirections.length = 0
      for (const update of updates) {
        if (update.reason === 'learned' || update.reason === 'contradictory') {
          update.reason = 'stale'
          update.weight = 0
          update.previousAdjustment = 0
          update.nextAdjustment = 0
        }
      }
    }
    if (record.responseKind === 'daily-feeling') {
      // This is a manual, experimental calibration of subjective duration. It is
      // neither a measured elimination half-life nor an accuracy observation.
      const direction = record.answer === 'later' ? 1 : record.answer === 'earlier' ? -1 : 0
      const nextAdjustment = clamp(adjustment + direction * P.maximumUpdateHours, P.minimumAdjustmentHours, P.maximumAdjustmentHours)
      updates.push({ feedbackId: record.id, previousAdjustment: adjustment, nextAdjustment, weight: 1, reason: 'learned' })
      adjustment = nextAdjustment
      learned.push(record)
      learningFingerprints.push(extendFingerprint(learningFingerprints.at(-1)!, record))
      lastLearnedAt = record.respondedAt
      continue
    }
    const mean = P.baselineHours + adjustment
    const lower = record.observedInterval ? durationHours(record.lastIntakeAt, record.observedInterval.start) : 0
    const upper = record.observedInterval ? durationHours(record.lastIntakeAt, record.observedInterval.end) : 0
    const priorCount = learned.filter((previous) => previous.respondedAt <= (prediction?.createdAt ?? '')).length
    // Score immutable predictions before this response contributes to the learner.
    // Edited or comparison-anchored labels are deliberately excluded from this gate.
    if (record.answer === 'interval' && prediction && !record.editedAt && record.observedWithoutComparison === true && prediction.createdAt < record.observedInterval!.start &&
      predictionMatches(prediction, entries, now, timeZone, prepared) && prediction.trainingRevision === fingerprintRevision(learningFingerprints[priorCount])) {
      errors.push({ baseline: intervalError(prediction.baselineHours, lower, upper), candidate: intervalError(prediction.candidateHours, lower, upper), simple: intervalError(prediction.simpleHours, lower, upper) })
    }
    const gradient = record.answer === 'interval' ? mean - clamp(mean, lower, upper) : ordinalGradient(mean, record, prediction!)
    const direction = record.answer === 'interval' ? Math.sign(lower > P.baselineHours ? 1 : upper < P.baselineHours ? -1 : 0) : record.answer === 'earlier' ? -1 : record.answer === 'later' ? 1 : 0
    if (direction !== 0) recentDirections.push(direction)
    const lastDirections = recentDirections.slice(-4)
    const reversals = lastDirections.slice(1).filter((sign, index) => sign !== lastDirections[index]).length
    const contradictory = lastDirections.length === 4 && reversals >= 2
    if (contradictory) {
      updates.push({ feedbackId: record.id, previousAdjustment: adjustment, nextAdjustment: adjustment, weight: 0, reason: 'contradictory' })
      continue
    }
    const weight = record.answer === 'similar' ? P.similarWeight : 1
    const nextAdjustment = updateSubjectiveAdjustment(adjustment, gradient, weight)
    updates.push({ feedbackId: record.id, previousAdjustment: adjustment, nextAdjustment, weight, reason: 'learned' })
    adjustment = nextAdjustment
    learned.push(record)
    learningFingerprints.push(extendFingerprint(learningFingerprints.at(-1)!, record))
    lastLearnedAt = record.respondedAt
  }
  const recentErrors = errors.slice(-P.evaluationWindow)
  const average = (key: 'baseline' | 'candidate' | 'simple') => recentErrors.length ? recentErrors.reduce((total, row) => total + row[key], 0) / recentErrors.length : null
  const evaluation = { count: recentErrors.length, baselineErrorHours: average('baseline'), candidateErrorHours: average('candidate'), simpleErrorHours: average('simple') }
  let holdReason: PersonalizationState['holdReason'] = 'none'
  const latest = ordered.at(-1)
  const hasDailyCalibration = learned.some((record) => record.responseKind === 'daily-feeling')
  if (latest && latest.timeZone !== timeZone) holdReason = 'time-zone-changed'
  else if (lastLearnedAt && now.getTime() - Date.parse(lastLearnedAt) > P.staleDays * DAY_MS) holdReason = 'stale'
  // Legacy accuracy/conflict gates cannot validate or veto a manual daily calibration.
  // Keep their historical evidence, while still respecting clock and stale-data holds.
  else if (!hasDailyCalibration && updates.slice(-4).some((update) => update.reason === 'contradictory')) holdReason = 'contradictory'
  else if (!hasDailyCalibration && evaluation.count >= P.minimumEvaluationCount && evaluation.candidateErrorHours! > evaluation.baselineErrorHours!) holdReason = 'worse-than-baseline'
  if (holdReason === 'stale' || holdReason === 'time-zone-changed') adjustment = 0
  const currentEvaluation = holdReason === 'stale' || holdReason === 'time-zone-changed' ? emptyEvaluation() : evaluation
  const changed = adjustment !== state.perceivedDurationAdjustment || JSON.stringify(updates) !== JSON.stringify(state.updates)
  const result: PersonalizationState = { ...state, perceivedDurationAdjustment: adjustment, parameterVersion: state.parameterVersion + (changed ? 1 : 0), updates, evaluation: currentEvaluation, holdReason }
  return JSON.stringify(result) === JSON.stringify(state) ? state : result
}

function buildFeedback(candidate: CheckInCandidate, entries: CaffeineEntry[], now: Date, input: FeedbackInput, skipped = false): FeedbackRecord {
  const end = input.responseKind === 'daily-feeling' ? candidate.lastIntakeAt : input.observedInterval?.end ?? candidate.prediction?.interval.end ?? addHours(candidate.lastIntakeAt, P.baselineHours + P.maximumAdjustmentHours + P.displayWindowHours)
  const sourceEntries = sources(entries, candidate.targetDate, candidate.timeZone, end)
  return {
    id: `feedback:${candidate.targetDate}:${candidate.timeZone}`, targetDate: candidate.targetDate,
    lastIntakeAt: candidate.lastIntakeAt, timeZone: candidate.timeZone, respondedAt: now.toISOString(),
    answer: skipped ? 'skipped' : input.answer, confounders: [...input.confounders],
    ...(input.responseKind ? { responseKind: input.responseKind } : {}),
    ...(candidate.prediction && !input.responseKind ? { predictionId: candidate.prediction.id } : {}),
    ...(input.observedInterval ? { observedInterval: { ...input.observedInterval } } : {}),
    ...(input.observedWithoutComparison === undefined ? {} : { observedWithoutComparison: input.observedWithoutComparison }),
    sourceEntries, sourceRevision: revision(sourceEntries),
  }
}
function inputMatches(input: FeedbackInput, candidate: CheckInCandidate, now: Date): boolean {
  if (!isFeedbackInput(input) || input.targetDate !== candidate.targetDate || input.lastIntakeAt !== candidate.lastIntakeAt || input.timeZone !== candidate.timeZone) return false
  if (input.responseKind === 'daily-feeling') return true
  if (input.predictionId !== candidate.prediction?.id) return false
  if (input.answer !== 'interval' && input.answer !== 'unknown' && !candidate.prediction) return false
  if (input.answer === 'interval') {
    if (!input.observedInterval || input.observedInterval.start < input.lastIntakeAt || input.observedInterval.end > now.toISOString() || durationHours(input.lastIntakeAt, input.observedInterval.end) > P.maximumObservationHours) return false
  }
  return true
}
export function submitFeedback(state: PersonalizationState, entries: CaffeineEntry[], now: Date, input: FeedbackInput, timeZone = deviceTimeZone()): PersonalizationState {
  const candidate = getCheckIn(state, entries, now, timeZone)
  if (!candidate || !inputMatches(input, candidate, now)) return state
  const retained = state.feedback.filter((record) => !(record.answer === 'skipped' && record.targetDate === candidate.targetDate && record.timeZone === candidate.timeZone))
  return reconcilePersonalization({ ...state, feedback: [...retained, buildFeedback(candidate, entries, now, input)] }, entries, now, timeZone)
}
export function dismissCheckIn(state: PersonalizationState, entries: CaffeineEntry[], now: Date, timeZone = deviceTimeZone()): PersonalizationState {
  const candidate = getCheckIn(state, entries, now, timeZone)
  if (!candidate) return state
  const input: FeedbackInput = { ...candidate, answer: 'unknown', confounders: [], predictionId: candidate.prediction?.id }
  const retained = state.feedback.filter((record) => !(record.answer === 'skipped' && record.targetDate === candidate.targetDate && record.timeZone === candidate.timeZone))
  return reconcilePersonalization({ ...state, feedback: [...retained, buildFeedback(candidate, entries, now, input, true)] }, entries, now, timeZone)
}
export function deleteFeedback(state: PersonalizationState, entries: CaffeineEntry[], now: Date, id: string, timeZone = deviceTimeZone()): PersonalizationState {
  if (!state.feedback.some((record) => record.id === id)) return state
  return reconcilePersonalization({ ...state, feedback: state.feedback.filter((record) => record.id !== id) }, entries, now, timeZone)
}
export function editFeedback(state: PersonalizationState, entries: CaffeineEntry[], now: Date, id: string, input: FeedbackInput, timeZone = deviceTimeZone()): PersonalizationState {
  assertClock(now, timeZone)
  const record = state.feedback.find((item) => item.id === id)
  if (!record || record.answer === 'skipped' || record.timeZone !== timeZone || record.respondedAt > now.toISOString()) return state
  if (input.responseKind !== record.responseKind) return state
  const prediction = state.predictions.find((item) => item.id === record.predictionId)
  const candidate: CheckInCandidate = { targetDate: record.targetDate, timeZone: record.timeZone, lastIntakeAt: record.lastIntakeAt, ...(prediction ? { prediction } : {}) }
  if (!inputMatches(input, candidate, now)) return state
  const changed = { ...buildFeedback(candidate, entries, now, input), id: record.id, respondedAt: record.respondedAt, editedAt: now.toISOString(), sourceEntries: record.sourceEntries, sourceRevision: record.sourceRevision }
  return reconcilePersonalization({ ...state, feedback: state.feedback.map((item) => item.id === id ? changed : item) }, entries, now, timeZone)
}
export function setPersonalizationEnabled(state: PersonalizationState, enabled: boolean): PersonalizationState { return state.enabled === enabled ? state : { ...state, enabled } }
export function restoreDefault(state: PersonalizationState): PersonalizationState { return setPersonalizationEnabled(state, false) }
export function resetLearning(state: PersonalizationState): PersonalizationState { return { ...createPersonalizationState(), enabled: state.enabled } }
export function getLearningSummary(state: PersonalizationState): LearningSummary {
  const records = learnedRecords(state)
  const effectiveCount = records.length
  const hasDailyCalibration = records.some((record) => record.responseKind === 'daily-feeling')
  const improved = state.evaluation.count >= P.minimumEvaluationCount && state.evaluation.baselineErrorHours! - state.evaluation.candidateErrorHours! >= P.minimumImprovementHours
  const status = !state.enabled ? 'disabled' : state.holdReason !== 'none' ? 'held' : hasDailyCalibration ? 'self-reported' : improved ? 'active' : 'collecting'
  const reason = status === 'disabled' ? '체감 예측과 체크인을 껐어요. 잔존 mg 추정은 계속 표시해요.' : status === 'held' ? '기록 변화나 상충하는 응답으로 기본 예측을 유지해요.' : status === 'self-reported' ? '답변에 따라 체감 지속 시간을 조금씩 조정해요. 실험적 보정이며 예측 정확도는 아직 검증되지 않았어요.' : status === 'active' ? '제한된 자기보고 비교에서 개선되어 실험적 체감 보정을 적용해요.' : '비교 자료가 부족하거나 개선이 확인되지 않아 기본 예측을 유지해요.'
  return { status, effectiveCount, evaluation: state.evaluation, adjustmentHours: state.perceivedDurationAdjustment, reason }
}
