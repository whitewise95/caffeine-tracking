export interface TimeInterval {
  start: string
  end: string
}

/** A snapshot uses the fields that affect the prediction, not presentation metadata. */
export interface SourceEntry {
  id: string
  caffeineMg: number
  consumedAt: string
  sourceType?: 'sample' | 'official' | 'custom'
}

export interface PredictionSnapshot {
  id: string
  modelVersion: string
  parameterVersion: number
  createdAt: string
  targetDate: string
  timeZone: string
  lastIntakeAt: string
  parameters: { perceivedDurationAdjustment: number }
  sourceEntries: SourceEntry[]
  sourceRevision: string
  trainingRevision: string
  interval: TimeInterval
  baselineHours: number
  candidateHours: number
  simpleHours: number
  appliedHours: number
}

export type FeedbackAnswer = 'earlier' | 'similar' | 'later' | 'unknown' | 'interval'

export interface FeedbackInput {
  targetDate: string
  lastIntakeAt: string
  timeZone: string
  predictionId?: string
  answer: FeedbackAnswer
  /** A directional daily self-report, independent of a previously displayed forecast. */
  responseKind?: 'daily-feeling'
  observedInterval?: TimeInterval
  /** True only when the absolute interval was entered before the check-in revealed its forecast. */
  observedWithoutComparison?: boolean
  confounders: string[]
}

export interface FeedbackRecord extends Omit<FeedbackInput, 'answer'> {
  id: string
  answer: FeedbackAnswer | 'skipped'
  respondedAt: string
  editedAt?: string
  sourceEntries: SourceEntry[]
  sourceRevision: string
}

export interface CheckInCandidate {
  targetDate: string
  lastIntakeAt: string
  timeZone: string
  prediction?: PredictionSnapshot
}

export type UpdateReason = 'learned' | 'unknown' | 'skipped' | 'confounded' | 'source-changed' | 'time-zone-changed' | 'invalid-observation' | 'missing-prediction' | 'stale' | 'contradictory'

export interface LearningUpdate {
  feedbackId: string
  previousAdjustment: number
  nextAdjustment: number
  weight: number
  reason: UpdateReason
}

export interface EvaluationSummary {
  count: number
  baselineErrorHours: number | null
  candidateErrorHours: number | null
  simpleErrorHours: number | null
}

export interface PersonalizationState {
  version: 1
  enabled: boolean
  parameterVersion: number
  perceivedDurationAdjustment: number
  predictions: PredictionSnapshot[]
  feedback: FeedbackRecord[]
  updates: LearningUpdate[]
  evaluation: EvaluationSummary
  holdReason: 'none' | 'time-zone-changed' | 'stale' | 'contradictory' | 'worse-than-baseline'
}

export interface LearningSummary {
  status: 'disabled' | 'collecting' | 'active' | 'self-reported' | 'held'
  effectiveCount: number
  evaluation: EvaluationSummary
  adjustmentHours: number
  reason: string
}
