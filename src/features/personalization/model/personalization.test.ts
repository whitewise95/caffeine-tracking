import { describe, expect, it } from 'vitest'
import type { CaffeineEntry } from '../../caffeine/model/caffeine.types'
import {
  createPersonalizationState, createPrediction, getCheckIn, submitFeedback,
  dismissCheckIn, deleteFeedback, editFeedback, reconcilePersonalization,
  setPersonalizationEnabled, restoreDefault, resetLearning, getLearningSummary,
  isPersonalizationState, getCurrentPrediction, updateSubjectiveAdjustment,
} from './index'
import type { FeedbackInput, PersonalizationState } from './types'

const zone = 'Asia/Seoul'
const at = (day: number, hour: number) => new Date(Date.UTC(2026, 9, day, hour - 9))
function entry(day = 1, hour = 10, id = `drink-${day}`): CaffeineEntry {
  return { id, drinkId: 'coffee', drinkName: '커피', caffeineMg: 150, consumedAt: at(day, hour).toISOString(), icon: 'coffee' }
}
function show(state: PersonalizationState, entries: CaffeineEntry[], day = 1) {
  const prediction = createPrediction(state, entries, at(day, 11), zone)
  if (!prediction) throw new Error('expected prospective prediction')
  return { ...state, predictions: [...state.predictions, prediction] }
}
function input(state: PersonalizationState, entries: CaffeineEntry[], day = 1, answer: FeedbackInput['answer'] = 'later'): FeedbackInput {
  const checkIn = getCheckIn(state, entries, at(day + 1, 9), zone)
  if (!checkIn) throw new Error('expected check-in')
  return { ...checkIn, predictionId: checkIn.prediction?.id, answer, confounders: [] }
}
function answerInterval(state: PersonalizationState, entries: CaffeineEntry[], day: number, hour = 18) {
  return submitFeedback(state, entries, at(day + 1, 9), {
    ...input(state, entries, day, 'interval'),
    observedInterval: { start: at(day, hour).toISOString(), end: at(day, hour + 1).toISOString() },
    observedWithoutComparison: true,
  }, zone)
}
function dailyInput(state: PersonalizationState, entries: CaffeineEntry[], day = 1, answer: 'later' | 'similar' | 'earlier' = 'later'): FeedbackInput {
  const candidate = getCheckIn(state, entries, at(day + 1, 9), zone)
  if (!candidate) throw new Error('expected daily check-in')
  return { targetDate: candidate.targetDate, lastIntakeAt: candidate.lastIntakeAt, timeZone: zone, responseKind: 'daily-feeling', answer, confounders: [] }
}

describe('prospective snapshots and check-in policy', () => {
  it('creates a fixed product-prior forecast with immutable source snapshots and no half-life parameter', () => {
    const records = [entry()]
    const prediction = createPrediction(createPersonalizationState(), records, at(1, 11), zone)!
    expect(prediction.baselineHours).toBe(6)
    expect(prediction.interval).toEqual({ start: at(1, 15).toISOString(), end: at(1, 17).toISOString() })
    expect(prediction.parameters).toEqual({ perceivedDurationAdjustment: 0 })
    records[0].caffeineMg = 500
    expect(prediction.sourceEntries[0].caffeineMg).toBe(150)
  })

  it('rejects empty, invalid, zero, future, previous-day, retroactive, and duplicate forecasts', () => {
    const state = createPersonalizationState()
    expect(createPrediction(state, [], at(1, 11), zone)).toBeNull()
    expect(createPrediction(state, [{ ...entry(), caffeineMg: 0 }], at(1, 11), zone)).toBeNull()
    expect(createPrediction(state, [{ ...entry(), caffeineMg: Infinity }], at(1, 11), zone)).toBeNull()
    expect(createPrediction(state, [{ ...entry(), consumedAt: 'bad' }], at(1, 11), zone)).toBeNull()
    expect(createPrediction(state, [{ ...entry(), consumedAt: '2026-09-30T24:00:00Z' }], at(1, 11), zone)).toBeNull()
    expect(createPrediction(state, [entry(1, 12)], at(1, 11), zone)).toBeNull()
    expect(createPrediction(state, [entry()], at(2, 11), zone)).toBeNull()
    expect(createPrediction(state, [entry()], at(1, 16), zone)).toBeNull()
    expect(createPrediction(show(state, [entry()]), [entry()], at(1, 12), zone)).toBeNull()
  })

  it('offers yesterday immediately after local midnight and never invents a forecast', () => {
    const state = createPersonalizationState()
    expect(getCheckIn(state, [entry(1, 23)], at(2, 0), zone)).toEqual({ targetDate: '2026-10-01', lastIntakeAt: at(1, 23).toISOString(), timeZone: zone })
    expect(getCheckIn(state, [entry(1, 23)], at(2, 12), zone)?.prediction).toBeUndefined()
    expect(getCheckIn(state, [{ ...entry(), caffeineMg: 0 }], at(2, 9), zone)).toBeNull()
    expect(getCheckIn(state, [], at(2, 9), zone)).toBeNull()
    expect(getCheckIn(state, [entry()], at(3, 9), zone)).toBeNull()
    expect(getCheckIn(state, [entry()], at(1, 23), zone)).toBeNull()
    const displayed = show(state, [entry()])
    expect(getCheckIn(displayed, [entry()], at(2, 9), zone)?.prediction?.id).toBe(displayed.predictions[0].id)
  })

  it('does not compare when the source was edited or an extra intake occurred in its outcome window', () => {
    const initial = show(createPersonalizationState(), [entry()])
    expect(getCheckIn(initial, [{ ...entry(), caffeineMg: 80 }], at(2, 9), zone)?.prediction).toBeUndefined()
    expect(getCheckIn(initial, [entry(), entry(1, 16, 'extra')], at(2, 9), zone)?.prediction).toBeUndefined()
    expect(getCheckIn(initial, [entry(), entry(2, 8, 'tomorrow')], at(2, 9), zone)?.prediction?.id).toBe(initial.predictions[0].id)
  })

  it('offers a previously skipped day again and replaces its skipped record on answer', () => {
    const state = dismissCheckIn(createPersonalizationState(), [entry()], at(2, 9), zone)
    expect(state.feedback[0].answer).toBe('skipped')
    expect(state.perceivedDurationAdjustment).toBe(0)
    expect(getCheckIn(JSON.parse(JSON.stringify(state)), [entry()], at(2, 10), zone)).not.toBeNull()
    const answered = submitFeedback(state, [entry()], at(2, 10), dailyInput(state, [entry()]), zone)
    expect(answered.feedback).toHaveLength(1)
    expect(answered.feedback[0].answer).toBe('later')
    expect(answered.perceivedDurationAdjustment).toBe(0.25)
    expect(isPersonalizationState(answered)).toBe(true)
    expect(getCheckIn(answered, [entry()], at(2, 11), zone)).toBeNull()
  })

  it('normalizes existing ISO offset entries before sorting and comparing snapshot sources', () => {
    const records = [{ ...entry(), consumedAt: '2026-10-01T10:00:00+09:00' }]
    const state = show(createPersonalizationState(), records)
    expect(state.predictions[0].lastIntakeAt).toBe(at(1, 10).toISOString())
    expect(getCurrentPrediction(state, records, at(1, 12), zone)?.id).toBe(state.predictions[0].id)
    expect(getCurrentPrediction(state, [{ ...records[0], caffeineMg: 80 }], at(1, 12), zone)).toBeNull()
  })

  it('disabling stops forecasts and check-ins while preserving history', () => {
    const state = setPersonalizationEnabled(show(createPersonalizationState(), [entry()]), false)
    expect(createPrediction(state, [entry()], at(1, 12), zone)).toBeNull()
    expect(getCurrentPrediction(state, [entry()], at(1, 12), zone)).toBeNull()
    expect(getCheckIn(state, [entry()], at(2, 12), zone)).toBeNull()
    expect(state.predictions).toHaveLength(1)
  })
})

describe('daily directional self-report calibration', () => {
  it.each([
    ['later', 0.25], ['similar', 0], ['earlier', -0.25],
  ] as const)('applies %s without a forecast and excludes it from accuracy evaluation', (answer, adjustment) => {
    const initial = createPersonalizationState()
    const records = [entry()]
    const next = submitFeedback(initial, records, at(2, 9), dailyInput(initial, records, 1, answer), zone)
    expect(next.perceivedDurationAdjustment).toBe(adjustment)
    expect(next.predictions).toHaveLength(0)
    expect(next.feedback[0].predictionId).toBeUndefined()
    expect(next.feedback[0].observedInterval).toBeUndefined()
    expect(next.evaluation.count).toBe(0)
    expect(getLearningSummary(next).status).toBe('self-reported')
    expect(getLearningSummary(next).reason).toContain('검증되지')
    expect(getCheckIn(next, records, at(2, 10), zone)).toBeNull()
    expect(isPersonalizationState(JSON.parse(JSON.stringify(next)))).toBe(true)
    records.push(entry(2))
    expect(createPrediction(next, records, at(2, 11), zone)?.appliedHours).toBe(6 + adjustment)
    expect(createPrediction(next, records, at(2, 23), zone)).toBeNull()
  })

  it('holds a nonzero adjustment exactly for the middle answer, including after reload', () => {
    const records = [entry()]
    const initial = createPersonalizationState()
    const longer = submitFeedback(initial, records, at(2, 9), dailyInput(initial, records), zone)
    records.push(entry(2))
    const held = submitFeedback(JSON.parse(JSON.stringify(longer)), records, at(3, 9), dailyInput(longer, records, 2, 'similar'), zone)
    expect(held.perceivedDurationAdjustment).toBe(0.25)
    expect(held.updates[1].nextAdjustment).toBe(held.updates[1].previousAdjustment)
    expect(reconcilePersonalization(held, records, at(3, 10), zone)).toEqual(held)
  })

  it('accepts a midnight answer and ignores next-day drinks in daily source snapshots', () => {
    const records = [entry(1, 23), entry(2, 0, 'new-day')]
    const initial = createPersonalizationState()
    const candidate = getCheckIn(initial, records, at(2, 0), zone)!
    const next = submitFeedback(initial, records, at(2, 0), {
      targetDate: candidate.targetDate, lastIntakeAt: candidate.lastIntakeAt, timeZone: zone,
      responseKind: 'daily-feeling', answer: 'later', confounders: [],
    }, zone)
    expect(next.perceivedDurationAdjustment).toBe(0.25)
    expect(next.feedback[0].sourceEntries.map((record) => record.id)).toEqual(['drink-1'])
    expect(isPersonalizationState(next)).toBe(true)
    expect(reconcilePersonalization(next, [...records, entry(2, 8, 'new-day-later')], at(2, 9), zone).perceivedDurationAdjustment).toBe(0.25)
  })

  it('replays edited/deleted answers and invalidates forecasts trained on them', () => {
    const records = [entry()]
    const initial = createPersonalizationState()
    const response = dailyInput(initial, records)
    const learned = submitFeedback(initial, records, at(2, 9), response, zone)
    expect(submitFeedback(learned, records, at(2, 10), response, zone)).toEqual(learned)
    records.push(entry(2))
    const shown = show(learned, records, 2)
    const changed = editFeedback(shown, records, at(2, 12), learned.feedback[0].id, { ...response, answer: 'earlier' }, zone)
    expect(changed.perceivedDurationAdjustment).toBe(-0.25)
    expect(changed.feedback[0].editedAt).toBe(at(2, 12).toISOString())
    expect(changed.predictions).toEqual(shown.predictions)
    expect(getCurrentPrediction(changed, records, at(2, 12), zone)).toBeNull()
    expect(createPrediction(changed, records, at(2, 12), zone)?.appliedHours).toBe(5.75)
    expect(isPersonalizationState(changed)).toBe(true)
    const deleted = deleteFeedback(changed, records, at(2, 12), changed.feedback[0].id, zone)
    expect(deleted.perceivedDurationAdjustment).toBe(0)
    expect(deleted.feedback).toHaveLength(0)
    expect(getCheckIn(deleted, records, at(2, 12), zone)).not.toBeNull()
  })

  it('removes contributions when yesterday source records change and does not revive them on feedback edit', () => {
    const records = [entry()]
    const initial = createPersonalizationState()
    const response = dailyInput(initial, records)
    const learned = submitFeedback(initial, records, at(2, 9), response, zone)
    for (const changedRecords of [[], [{ ...entry(), caffeineMg: 80 }], [entry(), entry(1, 12, 'late-added')]]) {
      const replayed = reconcilePersonalization(learned, changedRecords, at(2, 10), zone)
      expect(replayed.perceivedDurationAdjustment).toBe(0)
      expect(replayed.updates[0].reason).toBe('source-changed')
      const edited = editFeedback(replayed, changedRecords, at(2, 11), learned.feedback[0].id, { ...response, answer: 'earlier' }, zone)
      expect(edited.perceivedDurationAdjustment).toBe(0)
      expect(edited.updates[0].reason).toBe('source-changed')
    }
  })

  it('enforces bounds and applies each requested direction without interpreting reversals as accuracy data', () => {
    for (const answer of ['later', 'earlier'] as const) {
      let state = createPersonalizationState()
      const records: CaffeineEntry[] = []
      for (let day = 1; day <= 30; day++) {
        records.push(entry(day))
        state = submitFeedback(state, records, at(day + 1, 9), dailyInput(state, records, day, answer), zone)
      }
      expect(state.perceivedDurationAdjustment).toBe(answer === 'later' ? 6 : -3)
      expect(state.evaluation.count).toBe(0)
      expect(isPersonalizationState(state)).toBe(true)
    }
    let alternating = createPersonalizationState()
    const records: CaffeineEntry[] = []
    for (let day = 1; day <= 4; day++) {
      records.push(entry(day))
      alternating = submitFeedback(alternating, records, at(day + 1, 9), dailyInput(alternating, records, day, day % 2 ? 'later' : 'earlier'), zone)
    }
    expect(alternating.perceivedDurationAdjustment).toBe(0)
    expect(getLearningSummary(alternating).status).toBe('self-reported')
  })

  it('validates daily semantics and provenance without reinterpreting old forecast-relative feedback', () => {
    const initial = createPersonalizationState()
    const records = [entry()]
    const response = dailyInput(initial, records)
    const state = submitFeedback(initial, records, at(2, 9), response, zone)
    for (const change of [{ responseKind: 'invalid' }, { predictionId: 'invented' }, { answer: 'interval' }, { answer: 'unknown' }, { observedWithoutComparison: true }]) {
      expect(isPersonalizationState({ ...state, feedback: [{ ...state.feedback[0], ...change }] })).toBe(false)
    }
    const falseSource = [...state.feedback[0].sourceEntries, { id: 'today', caffeineMg: 100, consumedAt: at(2, 8).toISOString() }]
    expect(isPersonalizationState({ ...state, feedback: [{ ...state.feedback[0], sourceEntries: falseSource, sourceRevision: JSON.stringify(falseSource) }] })).toBe(false)
    const legacy = answerInterval(show(initial, records), records, 1)
    expect(isPersonalizationState(legacy)).toBe(true)
    expect(editFeedback(legacy, records, at(2, 10), legacy.feedback[0].id, response, zone)).toEqual(legacy)
  })

  it.each(['worse-than-baseline', 'contradictory'] as const)('applies daily calibration despite a legacy %s hold while preserving historical evaluation', (holdReason) => {
    const records = [entry()]
    let state = answerInterval(createPersonalizationState(), records, 1)
    for (let day = 2; day <= 4; day++) {
      records.push(entry(day))
      state = show(state, records, day)
      state = answerInterval(state, records, day, holdReason === 'worse-than-baseline' ? 15 : day % 2 === 0 ? 12 : 18)
    }
    expect(state.holdReason).toBe(holdReason)
    const historicalEvaluation = state.evaluation
    records.push(entry(5))
    const calibrated = submitFeedback(state, records, at(6, 9), dailyInput(state, records, 5), zone)
    expect(calibrated.perceivedDurationAdjustment).toBeCloseTo(state.perceivedDurationAdjustment + 0.25)
    expect(calibrated.holdReason).toBe('none')
    expect(getLearningSummary(calibrated).status).toBe('self-reported')
    expect(calibrated.evaluation).toEqual(historicalEvaluation)
    records.push(entry(6))
    expect(createPrediction(calibrated, records, at(6, 11), zone)?.appliedHours).toBe(6 + calibrated.perceivedDurationAdjustment)
    expect(reconcilePersonalization(calibrated, records, at(25, 9), zone).holdReason).toBe('stale')
    expect(reconcilePersonalization(calibrated, records, at(6, 11), 'America/New_York').holdReason).toBe('time-zone-changed')
  })
})

describe('bounded subjective learning', () => {
  it.each(['earlier', 'later'] as const)('learns %s in the right direction without treating it as an exact time', (answer) => {
    const entries = [entry()]
    const initial = show(createPersonalizationState(), entries)
    const next = submitFeedback(initial, entries, at(2, 9), input(initial, entries, 1, answer), zone)
    expect(Math.sign(next.perceivedDurationAdjustment)).toBe(answer === 'earlier' ? -1 : 1)
    expect(Math.abs(next.perceivedDurationAdjustment)).toBeLessThanOrEqual(0.25)
    expect(next.feedback[0].observedInterval).toBeUndefined()
    expect(next.evaluation.count).toBe(0)
    expect(getLearningSummary(next).status).toBe('collecting')
  })

  it('does not learn unknown, skipped, confounded, malformed, or ungrounded ordinal answers', () => {
    const entries = [entry()]
    const initial = show(createPersonalizationState(), entries)
    const unknown = submitFeedback(initial, entries, at(2, 9), input(initial, entries, 1, 'unknown'), zone)
    expect(unknown.perceivedDurationAdjustment).toBe(0)
    const confounded = submitFeedback(initial, entries, at(2, 9), { ...input(initial, entries), confounders: ['unrecorded-caffeine'] }, zone)
    expect(confounded.perceivedDurationAdjustment).toBe(0)
    const malformed = submitFeedback(initial, entries, at(2, 9), {
      ...input(initial, entries, 1, 'interval'), observedInterval: { start: 'bad', end: 'bad' },
    }, zone)
    expect(malformed).toEqual(initial)
    const noForecast = createPersonalizationState()
    expect(submitFeedback(noForecast, entries, at(2, 9), input(noForecast, entries), zone)).toEqual(noForecast)
  })

  it('uses interval bounds without substituting the midpoint and shrinks a contained response toward the prior', () => {
    const initial = createPersonalizationState()
    const sixIncluded = submitFeedback(initial, [entry()], at(2, 9), {
      ...input(initial, [entry()], 1, 'interval'),
      observedInterval: { start: at(1, 15).toISOString(), end: at(1, 19).toISOString() },
    }, zone)
    expect(sixIncluded.perceivedDurationAdjustment).toBe(0)
    expect(sixIncluded.evaluation.count).toBe(0)
  })

  it('is idempotent under repeated submission and reconciliation', () => {
    const entries = [entry()]
    const initial = show(createPersonalizationState(), entries)
    const response = input(initial, entries)
    const next = submitFeedback(initial, entries, at(2, 9), response, zone)
    expect(submitFeedback(next, entries, at(2, 10), response, zone)).toEqual(next)
    expect(reconcilePersonalization(next, entries, at(2, 10), zone)).toEqual(next)
  })

  it('excludes additional next-day intake inside a freshly reported outcome, even without an old forecast', () => {
    const records = [entry(1, 23), entry(2, 8, 'next-day')]
    for (const initial of [createPersonalizationState(), (() => {
      const state = createPersonalizationState()
      const prediction = createPrediction(state, [records[0]], at(1, 23), zone)!
      return { ...state, predictions: [prediction] }
    })()]) {
      const candidate = getCheckIn(initial, records, at(2, 13), zone)!
      const next = submitFeedback(initial, records, at(2, 13), {
        ...candidate, predictionId: candidate.prediction?.id, answer: 'interval', confounders: [],
        observedInterval: { start: at(2, 9).toISOString(), end: at(2, 10).toISOString() }, observedWithoutComparison: true,
      }, zone)
      expect(next.perceivedDurationAdjustment).toBe(0)
      expect(next.evaluation.count).toBe(0)
      expect(next.updates[0].reason).toBe('source-changed')
    }
  })

  it('replays without an edited/deleted record contribution and preserves the original predictions', () => {
    const records = [entry()]
    const next = answerInterval(show(createPersonalizationState(), records), records, 1)
    expect(next.perceivedDurationAdjustment).toBeGreaterThan(0)
    for (const changed of [[], [{ ...entry(), caffeineMg: 75 }], [entry(), entry(1, 17, 'extra')]]) {
      const replayed = reconcilePersonalization(next, changed, at(2, 9), zone)
      expect(replayed.perceivedDurationAdjustment).toBe(0)
      expect(replayed.evaluation.count).toBe(0)
      expect(replayed.predictions).toEqual(next.predictions)
    }
    const unaffected = reconcilePersonalization(next, [entry(), entry(2, 8, 'newday')], at(2, 9), zone)
    expect(unaffected.perceivedDurationAdjustment).toBe(next.perceivedDurationAdjustment)
  })

  it('holds application for timezone changes, long gaps, and conflicting responses', () => {
    const records = [entry()]
    const state = answerInterval(show(createPersonalizationState(), records), records, 1)
    const travel = reconcilePersonalization(state, records, at(2, 9), 'America/New_York')
    expect(travel.holdReason).toBe('time-zone-changed')
    expect(travel.perceivedDurationAdjustment).toBe(0)
    const stale = reconcilePersonalization(state, records, at(25, 9), zone)
    expect(stale.holdReason).toBe('stale')
    expect(getLearningSummary(stale).status).toBe('held')
    let opposing = state
    for (let day = 2; day <= 4; day++) {
      records.push(entry(day))
      opposing = show(opposing, records, day)
      opposing = answerInterval(opposing, records, day, day % 2 === 0 ? 12 : 18)
    }
    expect(opposing.holdReason).toBe('contradictory')
  })

  it('does not revive stale learning after a fresh response or edited/deleted sources after feedback edits', () => {
    const records = [entry()]
    const initial = answerInterval(show(createPersonalizationState(), records), records, 1)
    const afterGap = reconcilePersonalization(initial, records, at(25, 9), zone)
    records.push(entry(25))
    const fresh = answerInterval(afterGap, records, 25)
    expect(fresh.perceivedDurationAdjustment).toBe(0.25)
    expect(getLearningSummary(fresh).effectiveCount).toBe(1)
    const changedEntries = [{ ...entry(), caffeineMg: 80 }]
    const replayed = reconcilePersonalization(initial, changedEntries, at(2, 9), zone)
    const corrected = editFeedback(replayed, changedEntries, at(2, 10), initial.feedback[0].id, {
      ...initial.feedback[0], answer: 'interval',
      observedInterval: { start: at(1, 17).toISOString(), end: at(1, 18).toISOString() },
    }, zone)
    expect(corrected.perceivedDurationAdjustment).toBe(0)
    expect(corrected.updates[0].reason).toBe('source-changed')
  })

  it('enforces per-update and total bounds across repeated longer observations', () => {
    let state = createPersonalizationState()
    const records: CaffeineEntry[] = []
    for (let day = 1; day <= 20; day++) {
      records.push(entry(day))
      const previous = state.perceivedDurationAdjustment
      state = answerInterval(state, records, day, 22)
      expect(Math.abs(state.perceivedDurationAdjustment - previous)).toBeLessThanOrEqual(0.25000001)
      expect(state.perceivedDurationAdjustment).toBeLessThanOrEqual(6)
    }
  })

  it('keeps chronological evaluation intact during more than thirty consecutive days', () => {
    let state = createPersonalizationState()
    const entries: CaffeineEntry[] = []
    for (let day = 1; day <= 40; day++) {
      entries.push(entry(day))
      state = show(state, entries, day)
      state = answerInterval(state, entries, day)
    }
    expect(state.evaluation.count).toBe(8)
    expect(getLearningSummary(state).status).toBe('active')
  })
})

describe('engineering policy sensitivity — synthetic mechanism checks only', () => {
  it('is bounded and direction-consistent across slower, default, and faster update policies', () => {
    const policies = [
      { learningRate: 0.25, priorPenalty: 0.1, maximumUpdateHours: 0.125 },
      { learningRate: 0.5, priorPenalty: 0.05, maximumUpdateHours: 0.25 },
      { learningRate: 0.75, priorPenalty: 0.025, maximumUpdateHours: 0.5 },
    ]
    const outcomes = policies.map((policy) => {
      let longer = 0
      let shorter = 0
      let alternating = 0
      for (let index = 0; index < 12; index++) {
        const nextLonger = updateSubjectiveAdjustment(longer, 6 + longer - Math.max(8, Math.min(9, 6 + longer)), 1, policy)
        expect(Math.abs(nextLonger - longer)).toBeLessThanOrEqual(policy.maximumUpdateHours + 1e-10)
        longer = nextLonger
        shorter = updateSubjectiveAdjustment(shorter, 6 + shorter - Math.max(3, Math.min(4, 6 + shorter)), 1, policy)
        const lower = index % 2 ? 3 : 8
        alternating = updateSubjectiveAdjustment(alternating, 6 + alternating - Math.max(lower, Math.min(lower + 1, 6 + alternating)), 1, policy)
      }
      expect(longer).toBeGreaterThan(0)
      expect(shorter).toBeLessThan(0)
      expect(Math.abs(alternating)).toBeLessThan(1)
      return { ...policy, longer, shorter, alternating }
    })
    console.info('Synthetic sensitivity (hours, not predictive accuracy):', JSON.stringify(outcomes))
    expect(outcomes[0].longer).toBeLessThan(outcomes[2].longer)
  })

  if (process.env.RUN_PERSONALIZATION_BENCHMARK === '1') it('replays a year of two daily intakes without changing stored predictions', () => {
    let state = createPersonalizationState()
    const entries: CaffeineEntry[] = []
    for (let day = 1; day <= 365; day++) {
      entries.push(entry(day, 9, `morning-${day}`), entry(day))
      state = show(state, entries, day)
      state = answerInterval(state, entries, day)
    }
    const before = JSON.stringify(state.predictions)
    const start = performance.now()
    const replayed = reconcilePersonalization(state, entries, at(366, 9), zone)
    const elapsedMs = performance.now() - start
    expect(JSON.stringify(replayed.predictions)).toBe(before)
    expect(replayed.evaluation.count).toBe(8)
    expect(isPersonalizationState(replayed)).toBe(true)
    console.info('Synthetic 365-day replay:', JSON.stringify({ entries: entries.length, feedback: state.feedback.length, elapsedMs, serializedBytes: new TextEncoder().encode(JSON.stringify(state)).length }))
  }, 60_000)
})

describe('prequential evaluation and user controls', () => {
  it('evaluates saved forecasts before learning and activates only after prospective improvement', () => {
    let state = createPersonalizationState()
    const records: CaffeineEntry[] = []
    for (let day = 1; day <= 4; day++) {
      records.push(entry(day))
      state = show(state, records, day)
      const priorForecast = state.predictions.at(-1)!
      state = answerInterval(state, records, day)
      expect(state.predictions.at(-1)).toEqual(priorForecast)
      if (day < 3) expect(getLearningSummary(state).status).toBe('collecting')
    }
    expect(state.evaluation.count).toBe(4)
    expect(state.evaluation.candidateErrorHours!).toBeLessThan(state.evaluation.baselineErrorHours!)
    expect(state.evaluation.simpleErrorHours).not.toBeNull()
    expect(getLearningSummary(state).status).toBe('active')
    records.push(entry(5))
    const next = createPrediction(state, records, at(5, 11), zone)!
    expect(next.appliedHours).toBeGreaterThan(next.baselineHours)
  })

  it('does not score intervals entered after revealing comparison, edited answers, or absent forecasts', () => {
    const records = [entry()]
    const initial = show(createPersonalizationState(), records)
    const observed = {
      ...input(initial, records, 1, 'interval'),
      observedInterval: { start: at(1, 18).toISOString(), end: at(1, 19).toISOString() },
    }
    const anchored = submitFeedback(initial, records, at(2, 9), observed, zone)
    expect(anchored.evaluation.count).toBe(0)
    const next = answerInterval(initial, records, 1)
    const edited = editFeedback(next, records, at(2, 10), next.feedback[0].id, { ...observed, observedWithoutComparison: true }, zone)
    expect(edited.evaluation.count).toBe(0)
    expect(edited.feedback[0].editedAt).toBe(at(2, 10).toISOString())
    expect(edited.predictions).toEqual(next.predictions)
    expect(reconcilePersonalization(edited, records, at(2, 9), zone).perceivedDurationAdjustment).toBe(0)
    const beforeForecast = submitFeedback(initial, records, at(2, 9), {
      ...observed, observedWithoutComparison: true,
      observedInterval: { start: at(1, 10).toISOString(), end: at(1, 11).toISOString() },
    }, zone)
    expect(beforeForecast.evaluation.count).toBe(0)
  })

  it('invalidates the currently shown forecast after deleting or editing its training feedback', () => {
    const records = [entry()]
    const trained = answerInterval(show(createPersonalizationState(), records), records, 1)
    records.push(entry(2))
    const shown = show(trained, records, 2)
    const saved = shown.predictions.at(-1)!
    const removed = deleteFeedback(shown, records, at(2, 12), shown.feedback[0].id, zone)
    expect(getCurrentPrediction(removed, records, at(2, 12), zone)).toBeNull()
    const replacement = createPrediction(removed, records, at(2, 12), zone)
    expect(replacement?.id).not.toBe(saved.id)
    expect(removed.predictions.at(-1)).toEqual(saved)
  })

  it('deleting feedback replays, restore disables but preserves history, and reset removes learning history', () => {
    const records = [entry()]
    const next = answerInterval(show(createPersonalizationState(), records), records, 1)
    const deleted = deleteFeedback(next, records, at(2, 10), next.feedback[0].id, zone)
    expect(deleted.perceivedDurationAdjustment).toBe(0)
    expect(deleted.feedback).toHaveLength(0)
    expect(deleted.predictions).toEqual(next.predictions)
    const restored = restoreDefault(next)
    expect(restored.enabled).toBe(false)
    expect(restored.feedback).toEqual(next.feedback)
    expect(getLearningSummary(restored).status).toBe('disabled')
    expect(setPersonalizationEnabled(restored, true).enabled).toBe(true)
    expect(resetLearning(next)).toEqual(createPersonalizationState())
  })

  it('strictly validates stored data including nested timestamps, enums, numeric bounds and duplicate ids', () => {
    const initial = createPersonalizationState()
    expect(isPersonalizationState(initial)).toBe(true)
    expect(isPersonalizationState(null)).toBe(false)
    expect(isPersonalizationState({ ...initial, version: 2 })).toBe(false)
    expect(isPersonalizationState({ ...initial, perceivedDurationAdjustment: Infinity })).toBe(false)
    const state = answerInterval(show(initial, [entry()]), [entry()], 1)
    expect(isPersonalizationState(JSON.parse(JSON.stringify(state)))).toBe(true)
    expect(isPersonalizationState({ ...state, feedback: [{ ...state.feedback[0], respondedAt: 'invalid' }] })).toBe(false)
    expect(isPersonalizationState({ ...state, predictions: [state.predictions[0], state.predictions[0]] })).toBe(false)
    expect(isPersonalizationState({ ...state, feedback: [{ ...state.feedback[0], answer: 'yes' }] })).toBe(false)
  })
})
