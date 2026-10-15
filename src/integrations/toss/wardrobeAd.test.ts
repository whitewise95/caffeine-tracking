import { describe, expect, it, vi } from 'vitest'
import { createFullScreenAdSession } from './wardrobeAd'

function adFunction<T extends (...args: never[]) => unknown>(implementation?: T) {
  return Object.assign(vi.fn(implementation), { isSupported: vi.fn(() => true) })
}

describe('wardrobe full-screen ad session', () => {
  it('preloads and shows the same ad group once after the loaded event', () => {
    let onLoaded!: () => void
    const unregisterLoad = vi.fn()
    const unregisterShow = vi.fn()
    const load = adFunction((params: { options?: { adGroupId: string }; onEvent: (event: { type: 'loaded' }) => void }) => {
      onLoaded = () => params.onEvent({ type: 'loaded' })
      return unregisterLoad
    })
    const show = adFunction(() => unregisterShow)
    const session = createFullScreenAdSession('wardrobe-ad', { load, show })

    session.preload()
    expect(load).toHaveBeenCalledWith(expect.objectContaining({ options: { adGroupId: 'wardrobe-ad' } }))
    expect(session.showIfReady()).toBe(false)
    onLoaded()
    expect(session.showIfReady()).toBe(true)
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ options: { adGroupId: 'wardrobe-ad' } }))
    expect(session.showIfReady()).toBe(false)
    session.dispose()
    expect(unregisterLoad).toHaveBeenCalledOnce()
    expect(unregisterShow).toHaveBeenCalledOnce()
  })

  it('silently skips unsupported and failed ads so applying can continue', () => {
    const load = adFunction(() => { throw new Error('load failed') })
    const show = adFunction(() => { throw new Error('show failed') })
    load.isSupported.mockReturnValueOnce(false).mockReturnValue(true)
    const session = createFullScreenAdSession('wardrobe-ad', { load, show })

    expect(() => session.preload()).not.toThrow()
    expect(load).not.toHaveBeenCalled()
    expect(() => session.preload()).not.toThrow()
    expect(session.showIfReady()).toBe(false)
    expect(show).not.toHaveBeenCalled()
    expect(() => session.dispose()).not.toThrow()
  })
})
