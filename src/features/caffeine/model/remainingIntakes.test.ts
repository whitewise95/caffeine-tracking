import { describe, expect, it } from 'vitest'
import { remainingIntakes } from './remainingIntakes'
import type { CaffeineEntry } from './caffeine.types'

const coffee: CaffeineEntry = { id: 'older', drinkId: 'coffee', drinkName: '아메리카노', caffeineMg: 200, consumedAt: '2026-10-03T20:00:00+09:00', icon: 'coffee' }

describe('remainingIntakes', () => {
  it('includes yesterday and separate servings, with newest first and each dose decaying independently', () => {
    const recent = { ...coffee, id: 'recent', caffeineMg: 80, consumedAt: '2026-10-04T01:00:00+09:00' }
    const entries = [coffee, recent]
    const result = remainingIntakes(entries, new Date('2026-10-04T06:00:00+09:00'), 5)
    expect(result.map(item => [item.entry.id, item.remainingMg])).toEqual([['recent', 40], ['older', 50]])
    expect(entries.map(item => item.id)).toEqual(['older', 'recent'])
  })

  it('excludes future, invalid, zero-dose and sub-1mg records without rounding the cutoff upward', () => {
    const now = new Date('2026-10-04T06:00:00+09:00')
    const entries = [
      { ...coffee, id: 'boundary', caffeineMg: 4 },
      { ...coffee, id: 'below', caffeineMg: 3.96 },
      { ...coffee, id: 'future', consumedAt: '2026-10-04T06:01:00+09:00' },
      { ...coffee, id: 'invalid-date', consumedAt: 'invalid' },
      { ...coffee, id: 'invalid-dose', caffeineMg: Number.NaN },
      { ...coffee, id: 'zero', caffeineMg: 0 },
    ]
    expect(remainingIntakes(entries, now, 5).map(item => [item.entry.id, item.remainingMg])).toEqual([['boundary', 1]])
  })

  it('drops a drink when time carries it below the display threshold, retaining the intake record', () => {
    const entries = [{ ...coffee, caffeineMg: 4 }]
    expect(remainingIntakes(entries, new Date('2026-10-04T01:00:00+09:00'), 5)[0].remainingMg).toBe(2)
    expect(remainingIntakes(entries, new Date('2026-10-04T06:00:01+09:00'), 5)).toEqual([])
    expect(entries).toHaveLength(1)
  })
})
