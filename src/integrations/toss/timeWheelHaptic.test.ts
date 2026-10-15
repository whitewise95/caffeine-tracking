import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTimeWheelHaptic } from './timeWheelHaptic'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['performance'] })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('time-wheel native feedback', () => {
  it('returns immediately and drops burst ticks while native feedback is pending', async () => {
    let finish!: () => void
    const native = vi.fn(() => new Promise<void>(resolve => { finish = resolve }))
    const tick = createTimeWheelHaptic(native)
    let returned = false
    void tick().then(() => { returned = true })
    await Promise.resolve()
    await Promise.resolve()
    expect(returned).toBe(true)

    for (let detent = 0; detent < 10; detent += 1) {
      vi.advanceTimersByTime(30)
      void tick()
    }
    expect(native).toHaveBeenCalledTimes(1)
    finish()
    await Promise.resolve()
    expect(native).toHaveBeenCalledTimes(1)
    await tick()
    expect(native).toHaveBeenCalledTimes(2)
  })

  it('spaces feedback during fast flicks even when the native bridge resolves immediately', async () => {
    const native = vi.fn().mockResolvedValue(undefined)
    const tick = createTimeWheelHaptic(native)
    await tick()
    for (let detent = 0; detent < 9; detent += 1) {
      vi.advanceTimersByTime(5)
      await tick()
    }
    expect(native).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(5)
    await tick()
    expect(native).toHaveBeenCalledTimes(2)
  })

  it('recovers for fresh input after a rejected or synchronously throwing native call', async () => {
    const native = vi.fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('bridge rejected'))
      .mockImplementationOnce(() => { throw new Error('bridge unavailable') })
      .mockResolvedValue(undefined)
    const tick = createTimeWheelHaptic(native)
    await expect(tick()).resolves.toBeUndefined()
    vi.advanceTimersByTime(50)
    await expect(tick()).resolves.toBeUndefined()
    vi.advanceTimersByTime(50)
    await expect(tick()).resolves.toBeUndefined()
    expect(native).toHaveBeenCalledTimes(3)
  })

  it('recovers from a hung request only on fresh input without playing old queued ticks', async () => {
    let finishOld!: () => void
    let finishNew!: () => void
    const native = vi.fn<() => Promise<void>>()
      .mockImplementationOnce(() => new Promise<void>(resolve => { finishOld = resolve }))
      .mockImplementationOnce(() => new Promise<void>(resolve => { finishNew = resolve }))
      .mockResolvedValue(undefined)
    const tick = createTimeWheelHaptic(native)
    void tick()
    vi.advanceTimersByTime(500)
    void tick()
    expect(native).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(500)
    expect(native).toHaveBeenCalledTimes(1)
    void tick()
    expect(native).toHaveBeenCalledTimes(2)

    // A late acknowledgement from the expired request cannot unlock the new one.
    finishOld()
    await Promise.resolve()
    vi.advanceTimersByTime(50)
    void tick()
    expect(native).toHaveBeenCalledTimes(2)
    finishNew()
    await Promise.resolve()
    await tick()
    expect(native).toHaveBeenCalledTimes(3)
  })
})
