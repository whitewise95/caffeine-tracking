import { describe, expect, it } from 'vitest'
import { inferIntakeEndDay } from './intakeTiming'

describe('inferring the local end day from clock times', () => {
  it.each([
    [new Date(2026, 9, 6, 23), new Date(2026, 9, 6, 1), new Date(2026, 9, 7, 1)],
    [new Date(2026, 9, 31, 23), new Date(2026, 9, 31, 0), new Date(2026, 10, 1, 0)],
    [new Date(2026, 11, 31, 23), new Date(2026, 11, 31, 1), new Date(2027, 0, 1, 1)],
    [new Date(2026, 9, 6, 9), new Date(2026, 9, 7, 10), new Date(2026, 9, 6, 10)],
    [new Date(2026, 9, 6, 9), new Date(2026, 9, 7, 9), new Date(2026, 9, 6, 9)],
  ])('uses the start day and rolls over only for an earlier time (%s → %s)', (start, end, expected) => {
    const originalStart = start.getTime()
    const originalEnd = end.getTime()
    expect(inferIntakeEndDay(start, end)).toEqual(expected)
    expect(start.getTime()).toBe(originalStart)
    expect(end.getTime()).toBe(originalEnd)
  })
})
