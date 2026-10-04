import { afterEach, describe, expect, it, vi } from 'vitest'
import { Screen } from '@apps-in-toss/web-framework'
import { createInitialState } from '../../features/caffeine/model/caffeine'
import { createRepository, initializeTossSafeArea, isTossRuntime, setOverlaySwipeBack, subscribeTossBack } from './toss'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

function tossWindow() {
  return {
    ReactNativeWebView: { postMessage: vi.fn() },
    __appsInTossConstants: { operationalEnvironment: 'toss', tossAppVersion: '5.261.0', platformOS: 'ios' },
  }
}

describe('Toss runtime boundary', () => {
  it('does not treat a regular browser or an unrelated WebView as Toss', () => {
    expect(isTossRuntime()).toBe(false)
    vi.stubGlobal('window', {})
    expect(isTossRuntime()).toBe(false)
    vi.stubGlobal('window', { ReactNativeWebView: { postMessage: vi.fn() } })
    expect(isTossRuntime()).toBe(false)
  })

  it('requires a native bridge as well as Toss host constants', () => {
    const runtime = tossWindow()
    vi.stubGlobal('window', runtime)
    expect(isTossRuntime()).toBe(true)
    vi.stubGlobal('window', { __appsInTossConstants: runtime.__appsInTossConstants })
    expect(isTossRuntime()).toBe(false)
  })

  it('allows the SDK mock facade only in the explicit Toss development mode', () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('MODE', 'toss')
    vi.stubGlobal('window', { __appsInTossConstants: tossWindow().__appsInTossConstants })
    expect(isTossRuntime()).toBe(true)
  })

  it('still requires a real native bridge in a production build using Toss mode', () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('MODE', 'toss')
    vi.stubGlobal('window', { __appsInTossConstants: tossWindow().__appsInTossConstants })
    expect(isTossRuntime()).toBe(false)
  })

  it('persists browser records without initiating native promises', async () => {
    const values = new Map<string, string>()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => { values.set(key, value) },
        removeItem: (key: string) => { values.delete(key) },
      },
    })
    const repository = createRepository()
    const state = createInitialState()
    await repository.save(state)
    expect(await createRepository().load()).toEqual(state)
    await repository.reset()
    expect(await repository.load()).toEqual(createInitialState())
  })

  it('leaves native interactions inactive in browser preview', () => {
    vi.stubGlobal('window', {})
    const back = vi.fn()
    expect(() => initializeTossSafeArea()()).not.toThrow()
    expect(() => subscribeTossBack(back)()).not.toThrow()
    expect(() => setOverlaySwipeBack(true)()).not.toThrow()
    expect(back).not.toHaveBeenCalled()
  })

  it('restores iOS swipe only after the last active overlay closes', () => {
    vi.stubGlobal('window', tossWindow())
    const swipe = vi.spyOn(Screen, 'setIosSwipeBack').mockResolvedValue(undefined)
    const closeFirst = setOverlaySwipeBack(true)
    const closeSecond = setOverlaySwipeBack(true)
    expect(swipe).toHaveBeenCalledWith({ isEnabled: false })
    closeFirst()
    expect(swipe).not.toHaveBeenCalledWith({ isEnabled: true })
    closeSecond()
    expect(swipe).toHaveBeenLastCalledWith({ isEnabled: true })
  })
})
