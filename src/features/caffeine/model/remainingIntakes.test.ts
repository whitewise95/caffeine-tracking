import { describe, expect, it } from 'vitest'
import { absorptionMinutesRemaining, remainingIntakes } from './remainingIntakes'
import type { CaffeineEntry } from './caffeine.types'

const coffee: CaffeineEntry = { id: 'older', drinkId: 'coffee', drinkName: '아메리카노', caffeineMg: 200, consumedAt: '2026-10-03T20:00:00+09:00', icon: 'coffee' }

describe('remainingIntakes', () => {
  it('includes yesterday and separate servings, with newest first and each dose decaying independently', () => {
    const recent = { ...coffee, id: 'recent', caffeineMg: 80, consumedAt: '2026-10-04T01:00:00+09:00' }
    const entries = [coffee, recent]
    const result = remainingIntakes(entries, new Date('2026-10-04T06:00:00+09:00'), 5)
    expect(result.map(item => item.entry.id)).toEqual(['recent', 'older'])
    expect(result[0].remainingMg).toBeCloseTo(41.2598751488, 8)
    expect(result[1].remainingMg).toBeCloseTo(51.5748439503, 8)
    expect(entries.map(item => item.id)).toEqual(['older', 'recent'])
  })

  it('excludes future, invalid, zero-dose and sub-1mg records without rounding the cutoff upward', () => {
    const now = new Date('2026-10-04T06:00:00+09:00')
    const entries = [
      { ...coffee, id: 'above', caffeineMg: 3.89 },
      { ...coffee, id: 'below', caffeineMg: 3.84 },
      { ...coffee, id: 'future', consumedAt: '2026-10-04T06:01:00+09:00' },
      { ...coffee, id: 'invalid-date', consumedAt: 'invalid' },
      { ...coffee, id: 'invalid-dose', caffeineMg: Number.NaN },
      { ...coffee, id: 'zero', caffeineMg: 0 },
    ]
    const result = remainingIntakes(entries, now, 5)
    expect(result.map(item => item.entry.id)).toEqual(['above'])
    expect(result[0].remainingMg).toBeCloseTo(1.0031307148, 8)
  })

  it('keeps a just-recorded drink visible while its caffeine is still being absorbed', () => {
    const now = new Date('2026-10-04T06:00:00+09:00')
    const current = { ...coffee, consumedAt: now.toISOString() }
    const result = remainingIntakes([current], now, 5)
    expect(result).toEqual([{ entry: current, remainingMg: 0, absorbingMg: 200 }])
  })

  it('drops a drink when time carries it below the display threshold, retaining the intake record', () => {
    const entries = [{ ...coffee, caffeineMg: 4 }]
    expect(remainingIntakes(entries, new Date('2026-10-04T01:00:00+09:00'), 5)[0].remainingMg).toBeCloseTo(2.0629937574, 8)
    expect(remainingIntakes(entries, new Date('2026-10-04T07:00:00+09:00'), 5)).toEqual([])
    expect(entries).toHaveLength(1)
  })
})

describe('absorptionMinutesRemaining', () => {
  const instant = { ...coffee, caffeineMg: 150, consumedAt: '2026-10-04T10:00:00+09:00' }

  it('counts down to the existing 1mg absorption display cutoff, rounding partial minutes up', () => {
    expect(absorptionMinutesRemaining(instant, new Date('2026-10-04T10:00:00+09:00'), 4.5)).toBe(67)
    expect(absorptionMinutesRemaining(instant, new Date('2026-10-04T10:01:00+09:00'), 4.5)).toBe(66)
    expect(absorptionMinutesRemaining(instant, new Date('2026-10-04T11:06:00+09:00'), 4.5)).toBe(1)
    expect(absorptionMinutesRemaining(instant, new Date('2026-10-04T11:07:00+09:00'), 4.5)).toBeNull()
  })

  it('uses the unabsorbed part of a slow drink rather than restarting the full dose at its finish', () => {
    const slow = { ...instant, startedAt: '2026-10-04T09:00:00+09:00' }
    expect(absorptionMinutesRemaining(slow, new Date('2026-10-04T10:00:00+09:00'), 4.5)).toBe(47)
    expect(absorptionMinutesRemaining(slow, new Date('2026-10-04T10:30:00+09:00'), 4.5)).toBe(17)
    expect(absorptionMinutesRemaining(slow, new Date('2026-10-04T10:47:00+09:00'), 4.5)).toBeNull()
  })

  it('includes the rest of a valid ongoing drinking period before the absorption tail', () => {
    const ongoing = { ...instant, startedAt: '2026-10-04T09:00:00+09:00' }
    expect(absorptionMinutesRemaining(ongoing, new Date('2026-10-04T09:30:00+09:00'), 4.5)).toBe(77)
  })

  it('does not depend on the elimination half-life', () => {
    const now = new Date(instant.consumedAt)
    expect(absorptionMinutesRemaining(instant, now, 3)).toBe(absorptionMinutesRemaining(instant, now, 7))
  })

  it('does not show zero minutes while exactly at the cutoff', () => {
    const boundary = { ...instant, caffeineMg: 1 }
    expect(absorptionMinutesRemaining(boundary, new Date(boundary.consumedAt), 4.5)).toBe(1)
    expect(absorptionMinutesRemaining(boundary, new Date(Date.parse(boundary.consumedAt) + 1), 4.5)).toBeNull()
  })

  it('omits invalid, future and sub-cutoff intake', () => {
    const now = new Date('2026-10-04T09:00:00+09:00')
    expect(absorptionMinutesRemaining(instant, now, 4.5)).toBeNull()
    expect(absorptionMinutesRemaining({ ...instant, caffeineMg: 0 }, new Date(instant.consumedAt), 4.5)).toBeNull()
    expect(absorptionMinutesRemaining({ ...instant, caffeineMg: 0.5 }, new Date(instant.consumedAt), 4.5)).toBeNull()
    expect(absorptionMinutesRemaining({ ...instant, consumedAt: 'invalid' }, now, 4.5)).toBeNull()
  })
})
