import { describe, expect, it } from 'vitest'
import {
  createInitialState,
  formatTime,
  getVisualLevel,
  localDateKey,
  nextEvening,
  remainingCaffeine,
  todayIntake,
} from './caffeine'
import type { CaffeineEntry } from './caffeine.types'

function entry(caffeineMg: number, consumedAt: Date, id = 'entry-1'): CaffeineEntry {
  return { id, drinkId: 'americano', drinkName: '아메리카노', caffeineMg, consumedAt: consumedAt.toISOString(), icon: 'coffee' }
}

describe('remainingCaffeine', () => {
  it('halves each dose independently and sums doses from different times', () => {
    const entries = [
      entry(200, new Date('2026-10-02T00:00:00.000Z')),
      entry(80, new Date('2026-10-02T05:00:00.000Z'), 'entry-2'),
    ]

    expect(remainingCaffeine(entries, new Date('2026-10-02T10:00:00.000Z'), 5)).toBeCloseTo(90)
  })

  it('keeps the full dose at consumption time and excludes future records', () => {
    const now = new Date('2026-10-02T05:00:00.000Z')
    const entries = [entry(150, now), entry(100, new Date('2026-10-02T05:00:01.000Z'), 'future')]

    expect(remainingCaffeine(entries, now, 5)).toBe(150)
  })

  it('ignores malformed dates and invalid doses instead of poisoning the total', () => {
    const now = new Date('2026-10-02T05:00:00.000Z')
    const entries = [entry(150, now), entry(-20, now), entry(Number.NaN, now), entry(Infinity, now), { ...entry(50, now), consumedAt: 'not-a-date' }]

    expect(remainingCaffeine(entries, now, 5)).toBe(150)
  })

  it.each([0, -1, Infinity, Number.NaN])('uses the default model for invalid half-life %s', (halfLife) => {
    expect(remainingCaffeine([entry(150, new Date('2026-10-02T00:00:00.000Z'))], new Date('2026-10-02T05:00:00.000Z'), halfLife)).toBeCloseTo(75)
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
    expect(next).toMatchObject({ version: 2, entries: [], customDrinks: [], settings: { halfLifeHours: 5 }, personalization: { version: 1, feedback: [], predictions: [] } })
  })
})
