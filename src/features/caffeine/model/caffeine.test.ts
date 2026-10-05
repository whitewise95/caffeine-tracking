import { describe, expect, it } from 'vitest'
import {
  caffeineEstimate,
  createInitialState,
  formatTime,
  getVisualLevel,
  localDateKey,
  nextEvening,
  remainingCaffeine,
  todayIntake,
} from './caffeine'
import type { CaffeineEntry } from './caffeine.types'
import { isValidIntakeTiming } from './intakeTiming'

function entry(caffeineMg: number, consumedAt: Date, id = 'entry-1'): CaffeineEntry {
  return { id, drinkId: 'americano', drinkName: '아메리카노', caffeineMg, consumedAt: consumedAt.toISOString(), icon: 'coffee' }
}

describe('remainingCaffeine', () => {
  it('distributes a slow drink across its start and finish instead of putting the whole dose at the finish', () => {
    const slow = { ...entry(150, new Date('2026-10-02T02:00:00Z')), startedAt: '2026-10-02T01:00:00Z' }
    const atFinish = caffeineEstimate([slow], new Date('2026-10-02T02:00:00Z'))
    // Independent RK4 compartment integration: 150 mg/h for one hour.
    expect(atFinish.remainingMg).toBeCloseTo(110.065845654, 7)
    expect(atFinish.absorbingMg).toBeCloseTo(32.687001986, 7)
    const oneHourLater = caffeineEstimate([slow], new Date('2026-10-02T03:00:00Z'))
    expect(oneHourLater.remainingMg).toBeGreaterThan(atFinish.remainingMg)
    expect(oneHourLater.absorbingMg).toBeLessThan(atFinish.absorbingMg)
  })

  it('calculates partial intake before the finish and excludes drinks that have not started', () => {
    const slow = { ...entry(150, new Date('2026-10-02T02:00:00Z')), startedAt: '2026-10-02T01:00:00Z' }
    expect(caffeineEstimate([slow], new Date('2026-10-02T00:59:59Z'))).toEqual({ remainingMg: 0, absorbingMg: 0 })
    const midway = caffeineEstimate([slow], new Date('2026-10-02T01:30:00Z'))
    expect(midway.remainingMg).toBeGreaterThan(0)
    expect(midway.absorbingMg).toBeGreaterThan(0)
    expect(midway.remainingMg + midway.absorbingMg).toBeLessThan(75)
  })

  it('adds simultaneous slow and instant drinks independently without mutating the entries', () => {
    const slow = { ...entry(150, new Date('2026-10-02T02:00:00Z')), startedAt: '2026-10-02T01:00:00Z' }
    const instant = entry(80, new Date('2026-10-02T02:00:00Z'), 'instant')
    const at = new Date('2026-10-02T03:00:00Z')
    const snapshot = JSON.stringify([slow, instant])
    const together = caffeineEstimate([slow, instant], at)
    const singleSlow = caffeineEstimate([slow], at)
    const singleInstant = caffeineEstimate([instant], at)
    expect(together.remainingMg).toBe(singleSlow.remainingMg + singleInstant.remainingMg)
    expect(together.absorbingMg).toBe(singleSlow.absorbingMg + singleInstant.absorbingMg)
    expect(JSON.stringify([slow, instant])).toBe(snapshot)
  })

  it('uses the start time even when two drinks have the same finish time', () => {
    const end = new Date('2026-10-02T02:00:00Z')
    const short = { ...entry(150, end), startedAt: '2026-10-02T01:50:00Z' }
    const long = { ...entry(150, end), startedAt: '2026-10-02T01:00:00Z' }
    expect(caffeineEstimate([long], end).remainingMg).toBeGreaterThan(caffeineEstimate([short], end).remainingMg)
    expect(caffeineEstimate([long], end).absorbingMg).toBeLessThan(caffeineEstimate([short], end).absorbingMg)
  })

  it('ignores malformed, reversed, and zero-duration intervals instead of treating them as instant drinks', () => {
    const end = new Date('2026-10-02T02:00:00Z')
    const invalid = ['invalid', '2026-10-02T02:00:00Z', '2026-10-02T02:00:01Z'].map(startedAt => ({ ...entry(150, end), startedAt }))
    expect(caffeineEstimate(invalid, new Date('2026-10-02T03:00:00Z'))).toEqual({ remainingMg: 0, absorbingMg: 0 })
    expect(todayIntake(invalid, new Date('2026-10-02T03:00:00Z'))).toBe(0)
  })

  it('sums absorbed amounts from independent consumption times', () => {
    const entries = [
      entry(200, new Date('2026-10-02T00:00:00.000Z')),
      entry(80, new Date('2026-10-02T05:00:00.000Z'), 'entry-2'),
    ]

    expect(remainingCaffeine(entries, new Date('2026-10-02T10:00:00.000Z'), 5)).toBeCloseTo(92.8347190991, 8)
  })

  it('keeps a newly consumed dose in the absorption compartment and excludes future records', () => {
    const now = new Date('2026-10-02T05:00:00.000Z')
    const entries = [entry(150, now), entry(100, new Date('2026-10-02T05:00:01.000Z'), 'future')]

    expect(remainingCaffeine(entries, now, 5)).toBe(0)
    expect(caffeineEstimate(entries, now, 5)).toEqual({ remainingMg: 0, absorbingMg: 150 })
  })

  it('ignores malformed dates and invalid doses instead of poisoning the total', () => {
    const now = new Date('2026-10-02T05:00:00.000Z')
    const entries = [entry(150, now), entry(-20, now), entry(Number.NaN, now), entry(Infinity, now), entry(1001, now), { ...entry(50, now), consumedAt: 'not-a-date' }]

    expect(remainingCaffeine(entries, now, 5)).toBe(0)
    expect(caffeineEstimate(entries, now, 5)).toEqual({ remainingMg: 0, absorbingMg: 150 })
  })

  it.each([0, -1, Infinity, Number.NaN])('uses the default model for invalid half-life %s', (halfLife) => {
    expect(remainingCaffeine([entry(150, new Date('2026-10-02T00:00:00.000Z'))], new Date('2026-10-02T05:00:00.000Z'), halfLife)).toBeCloseTo(71.8793183724, 8)
  })

  it('starts rising after a drink, peaks, then follows elimination without resetting earlier doses', () => {
    const start = new Date('2026-10-02T01:00:00.000Z')
    const entries = [entry(100, start)]
    const halfHour = caffeineEstimate(entries, new Date('2026-10-02T01:30:00.000Z'))
    const oneHour = caffeineEstimate(entries, new Date('2026-10-02T02:00:00.000Z'))
    const fiveHours = caffeineEstimate(entries, new Date('2026-10-02T06:00:00.000Z'))

    expect(halfHour.remainingMg).toBeCloseTo(85.1450466124, 8)
    expect(halfHour.absorbingMg).toBeCloseTo(10.3312180083, 8)
    expect(oneHour.remainingMg).toBeGreaterThan(halfHour.remainingMg)
    expect(fiveHours.remainingMg).toBeLessThan(oneHour.remainingMg)
    expect(oneHour.absorbingMg).toBeLessThan(halfHour.absorbingMg)
  })

  it('uses each dose time in the 01:00 300 mg plus 02:00 200 mg example', () => {
    const entries = [
      entry(300, new Date('2026-10-02T01:00:00.000Z')),
      entry(200, new Date('2026-10-02T02:00:00.000Z'), 'second'),
    ]
    expect(remainingCaffeine(entries, new Date('2026-10-02T06:00:00.000Z'))).toBeCloseTo(255.5577170599, 8)
    expect(remainingCaffeine(entries, new Date('2026-10-02T07:00:00.000Z'))).toBeCloseTo(219.0753175323, 8)
  })

  it('returns zero for empty history', () => {
    expect(remainingCaffeine([], new Date(), 5)).toBe(0)
  })

  it('remains continuous across midnight and decreases without new intake', () => {
    const entries = [entry(100, new Date('2026-10-02T13:00:00Z'))]
    const before = remainingCaffeine(entries, new Date('2026-10-02T14:59:59Z'))
    const after = remainingCaffeine(entries, new Date('2026-10-02T15:00:00Z'))
    expect(after).toBeGreaterThan(70)
    expect(after).toBeLessThan(before)
    expect(before - after).toBeLessThan(0.01)
    expect(remainingCaffeine(entries, new Date('2026-10-03T15:00:00Z'))).toBeLessThan(after)
  })

  it('rejects an invalid calculation date', () => {
    expect(() => remainingCaffeine([], new Date('invalid'), 5)).toThrow(RangeError)
  })
})

describe('local day and future time helpers', () => {
  it('attributes a cross-midnight slow drink to its finish day while continuously computing both compartments', () => {
    const end = new Date(2026, 9, 3, 0, 30)
    const slow = { ...entry(150, end), startedAt: new Date(2026, 9, 2, 23, 30).toISOString() }
    const justBeforeMidnight = new Date(2026, 9, 2, 23, 59, 59)
    const justAfterMidnight = new Date(2026, 9, 3, 0, 0, 0)
    expect(todayIntake([slow], justBeforeMidnight)).toBe(0)
    expect(todayIntake([slow], justAfterMidnight)).toBe(0)
    expect(todayIntake([slow], end)).toBe(150)
    const before = caffeineEstimate([slow], justBeforeMidnight)
    const after = caffeineEstimate([slow], justAfterMidnight)
    expect(after.remainingMg).toBeGreaterThan(0)
    expect(Math.abs(after.remainingMg - before.remainingMg)).toBeLessThan(0.1)
  })

  it('counts only past and present records on the local calendar day', () => {
    const now = new Date(2026, 9, 2, 0, 30)
    const entries = [
      entry(150, new Date(2026, 9, 1, 23, 59)),
      entry(80, new Date(2026, 9, 2, 0, 0), 'today'),
      entry(30, now, 'now'),
      entry(100, new Date(2026, 9, 2, 1, 0), 'future'),
    ]

    expect(todayIntake(entries, now)).toBe(110)
    expect(localDateKey(now)).toBe('2026-10-02')
    expect(formatTime(now)).toBe('00:30')
  })

  it('predicts at 22:00 today before 22:00, without mutating now', () => {
    const now = new Date(2026, 9, 2, 14, 35, 42)

    expect(nextEvening(now)).toEqual(new Date(2026, 9, 2, 22, 0, 0))
    expect(now).toEqual(new Date(2026, 9, 2, 14, 35, 42))
  })

  it('moves the prediction into tomorrow once 22:00 has arrived', () => {
    expect(nextEvening(new Date(2026, 11, 31, 22, 0))).toEqual(new Date(2027, 0, 1, 22, 0))
  })
})

describe('intake timing validation', () => {
  const consumedAt = '2026-10-02T02:00:00.000Z'
  it('accepts existing instant records and completed ordered intervals', () => {
    expect(isValidIntakeTiming({ consumedAt })).toBe(true)
    expect(isValidIntakeTiming({ consumedAt, startedAt: '2026-10-02T01:00:00.000Z' })).toBe(true)
    expect(isValidIntakeTiming({ consumedAt }, new Date(consumedAt))).toBe(true)
  })

  it('rejects invalid dates, nonpositive intervals, and an optional future finish constraint', () => {
    expect(isValidIntakeTiming({ consumedAt: 'invalid' })).toBe(false)
    expect(isValidIntakeTiming({ consumedAt, startedAt: 'invalid' })).toBe(false)
    expect(isValidIntakeTiming({ consumedAt, startedAt: consumedAt })).toBe(false)
    expect(isValidIntakeTiming({ consumedAt, startedAt: '2026-10-02T03:00:00Z' })).toBe(false)
    expect(isValidIntakeTiming({ consumedAt }, new Date('2026-10-02T01:00:00Z'))).toBe(false)
    expect(isValidIntakeTiming({ consumedAt }, new Date('invalid'))).toBe(false)
  })
})

describe('visual levels', () => {
  it.each([
    [0, 'LOW'], [40, 'LOW'], [40.1, 'LIGHT'], [100, 'LIGHT'],
    [100.1, 'FILLED'], [200, 'FILLED'], [200.1, 'HIGH_VISUAL'],
    [-5, 'LOW'], [Number.NaN, 'LOW'],
  ])('maps %s mg to the %s visual state', (mg, expected) => {
    expect(getVisualLevel(mg as number)).toBe(expected)
  })
})

describe('initial state', () => {
  it('starts with no invented intake records and returns independent mutable state', () => {
    const first = createInitialState()
    first.entries.push(entry(100, new Date()))
    first.settings.halfLifeHours = 8

    const next = createInitialState()
    expect(next).toMatchObject({ version: 4, entries: [], customDrinks: [], customCategories: [], settings: { halfLifeHours: 4.5 } })
  })
})
