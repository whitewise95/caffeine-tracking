import { describe, expect, it } from 'vitest'
import { caffeineEstimate } from './caffeine'
import type { CaffeineEntry } from './caffeine.types'
import { consumedEntriesAt } from './forecast'

const at = (hour: number) => new Date(Date.UTC(2026, 9, 4, hour))
const entry: CaffeineEntry = { id: 'slow', drinkId: 'coffee', drinkName: '커피', caffeineMg: 150, icon: 'coffee', startedAt: at(8).toISOString(), consumedAt: at(10).toISOString() }

describe('forecast without further intake', () => {
  it('includes only the already sipped portion if the device clock moves inside a recorded interval', () => {
    const original = structuredClone(entry)
    const consumed = consumedEntriesAt([entry], at(9))
    expect(consumed).toEqual([{ ...entry, caffeineMg: 75, consumedAt: at(9).toISOString() }])
    expect(caffeineEstimate(consumed, at(9))).toEqual(caffeineEstimate([entry], at(9)))
    expect(caffeineEstimate(consumed, at(11)).remainingMg).toBeLessThan(caffeineEstimate([entry], at(11)).remainingMg)
    expect(entry).toEqual(original)
  })

  it('preserves completed records and excludes future input at the start boundary', () => {
    const instant = { ...entry, id: 'instant', startedAt: undefined, consumedAt: at(7).toISOString() }
    expect(consumedEntriesAt([instant, entry], at(8))).toEqual([instant])
    expect(consumedEntriesAt([instant, entry], at(10))).toEqual([instant, entry])
  })

  it('ignores invalid timestamps and reversed intervals', () => {
    expect(consumedEntriesAt([{ ...entry, startedAt: 'bad' }, { ...entry, startedAt: at(11).toISOString() }], at(12))).toEqual([])
    expect(consumedEntriesAt([entry], new Date(NaN))).toEqual([])
  })
})
