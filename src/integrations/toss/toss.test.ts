import { afterEach, describe, expect, it, vi } from 'vitest'
import { Device, NavigationBar, SafeArea, Screen, Storage } from '@apps-in-toss/web-framework'
import { createInitialState } from '../../features/caffeine/model/caffeine'
import { emptyOutfit } from '../../features/avatar/model/avatar'
import { AVATAR_STORAGE_KEY } from '../../features/avatar/repository/LocalAvatarRepository'
import { createAvatarRepository, createRepository, initializeTossSafeArea, isTossRuntime, openTossExternalURL, setOverlaySwipeBack, subscribeTossBack, syncTossNavigationTheme } from './toss'

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
  it('persists avatars in the same browser storage using an independent key', async () => {
    const values = new Map<string, string>()
    vi.stubGlobal('window', { localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value) },
      removeItem: (key: string) => { values.delete(key) },
    } })
    const nativeSet = vi.spyOn(Storage, 'setItem')
    await createRepository().save(createInitialState())
    const caffeineBytes = values.get('caffeine-tracker:state:v1')
    const outfit = { ...emptyOutfit(), hat: 'hat-crown' }
    await createAvatarRepository().save(outfit)
    expect(await createAvatarRepository().load()).toEqual(outfit)
    await createAvatarRepository().reset()
    expect(values.has(AVATAR_STORAGE_KEY)).toBe(false)
    expect(values.get('caffeine-tracker:state:v1')).toBe(caffeineBytes)
    expect(nativeSet).not.toHaveBeenCalled()
  })

  it('keeps avatars in native Storage and never falls back after native failures', async () => {
    const values = new Map<string, string>([['caffeine-tracker:state:v1', 'existing caffeine']])
    const browserGet = vi.fn()
    const browserSet = vi.fn()
    const browserRemove = vi.fn()
    vi.stubGlobal('window', { ...tossWindow(), localStorage: { getItem: browserGet, setItem: browserSet, removeItem: browserRemove } })
    const get = vi.spyOn(Storage, 'getItem').mockImplementation(async key => values.get(key) ?? null)
    const set = vi.spyOn(Storage, 'setItem').mockImplementation(async (key, value) => { values.set(key, value) })
    const remove = vi.spyOn(Storage, 'removeItem').mockImplementation(async key => { values.delete(key) })
    const outfit = { ...emptyOutfit(), top: 'top-tee' }
    const avatar = createAvatarRepository()
    await avatar.save(outfit)
    expect(await avatar.load()).toEqual(outfit)
    expect(set).toHaveBeenCalledExactlyOnceWith(AVATAR_STORAGE_KEY, JSON.stringify({ version: 1, outfit }))
    await avatar.reset()
    expect(remove).toHaveBeenCalledExactlyOnceWith(AVATAR_STORAGE_KEY)
    expect(values.get('caffeine-tracker:state:v1')).toBe('existing caffeine')
    get.mockRejectedValue(new Error('native read'))
    set.mockRejectedValue(new Error('native write'))
    await expect(avatar.load()).rejects.toThrow('꾸미기 정보를 불러오지 못했어요')
    await expect(avatar.save(outfit)).rejects.toThrow('꾸미기를 저장하지 못했어요')
    expect(browserGet).not.toHaveBeenCalled()
    expect(browserSet).not.toHaveBeenCalled()
    expect(browserRemove).not.toHaveBeenCalled()
  })

  it('opens external research with the native URL API only in Toss', async () => {
    const open = vi.spyOn(Device, 'openURL').mockResolvedValue(undefined)
    const url = 'https://pubmed.ncbi.nlm.nih.gov/19125908/'
    vi.stubGlobal('window', {})
    await openTossExternalURL(url)
    expect(open).not.toHaveBeenCalled()
    vi.stubGlobal('window', tossWindow())
    await openTossExternalURL(url)
    expect(open).toHaveBeenCalledExactlyOnceWith(url)
  })

  it('propagates native URL failures to the link UI instead of navigating the WebView', async () => {
    vi.stubGlobal('window', tossWindow())
    vi.spyOn(Device, 'openURL').mockRejectedValue(new Error('cannot open browser'))
    await expect(openTossExternalURL('https://pubmed.ncbi.nlm.nih.gov/19125908/')).rejects.toThrow('cannot open browser')
  })

  it('does not call native navigation from a mobile browser', async () => {
    vi.stubGlobal('window', {})
    const options = vi.spyOn(NavigationBar, 'setOptions').mockResolvedValue(undefined)
    await syncTossNavigationTheme('dark')
    expect(options).not.toHaveBeenCalled()
  })

  it('updates native navigation colors without changing the existing buttons', async () => {
    vi.stubGlobal('window', tossWindow())
    const options = vi.spyOn(NavigationBar, 'setOptions').mockResolvedValue(undefined)
    await syncTossNavigationTheme('dark')
    expect(options).toHaveBeenLastCalledWith({ theme: 'dark', backgroundColor: '#0A0B0E' })
    await syncTossNavigationTheme('light')
    expect(options).toHaveBeenLastCalledWith({ theme: 'light', backgroundColor: '#F7F8FA' })
  })

  it('keeps native theme requests in order and recovers after a bridge failure', async () => {
    vi.stubGlobal('window', tossWindow())
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    let finishFirst!: () => void
    const options = vi.spyOn(NavigationBar, 'setOptions')
      .mockImplementationOnce(() => new Promise<void>(resolve => { finishFirst = resolve }))
      .mockRejectedValueOnce(new Error('native theme failed'))
      .mockResolvedValue(undefined)
    const first = syncTossNavigationTheme('dark')
    const second = syncTossNavigationTheme('light')
    await Promise.resolve()
    expect(options).toHaveBeenCalledTimes(1)
    finishFirst()
    await Promise.all([first, second])
    expect(options.mock.calls.map(([value]) => value.theme)).toEqual(['dark', 'light'])
    expect(warning).toHaveBeenCalledOnce()
    await syncTossNavigationTheme('dark')
    expect(options).toHaveBeenLastCalledWith({ theme: 'dark', backgroundColor: '#0A0B0E' })
  })

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

  it('keeps all user data in native device storage and deletes only this app key', async () => {
    const values = new Map<string, string>([['unrelated-data', 'keep']]);
    const browserGet = vi.fn();
    const browserSet = vi.fn();
    const browserRemove = vi.fn();
    vi.stubGlobal('window', { ...tossWindow(), localStorage: { getItem: browserGet, setItem: browserSet, removeItem: browserRemove } });
    const get = vi.spyOn(Storage, 'getItem').mockImplementation(async key => values.get(key) ?? null);
    const set = vi.spyOn(Storage, 'setItem').mockImplementation(async (key, value) => { values.set(key, value) });
    const remove = vi.spyOn(Storage, 'removeItem').mockImplementation(async key => { values.delete(key) });
    const state = createInitialState();
    state.customCategories = [{ id: 'custom:device', name: '내 카테고리' }];
    state.customDrinks = [{ id: 'my-drink', categoryId: 'custom:device', name: '내 음료', caffeineMg: 67, icon: 'coffee', isCustom: true, sourceType: 'custom' }];
    state.entries = [{ id: 'my-entry', drinkId: 'my-drink', drinkName: '내 음료', caffeineMg: 67, icon: 'coffee', consumedAt: '2026-10-04T01:00:00.000Z', startedAt: '2026-10-04T00:30:00.000Z' }];
    state.legacyPersonalization = { archived: true };
    state.settings.theme = 'dark';
    await createRepository().save(state);
    expect(set).toHaveBeenCalledWith('caffeine-tracker:state:v1', JSON.stringify(state));
    expect(await createRepository().load()).toEqual(state);
    expect(get).toHaveBeenCalledWith('caffeine-tracker:state:v1');
    await createRepository().reset();
    expect(remove).toHaveBeenCalledWith('caffeine-tracker:state:v1');
    expect(await createRepository().load()).toEqual(createInitialState());
    expect(values.get('unrelated-data')).toBe('keep');
    expect(browserGet).not.toHaveBeenCalled();
    expect(browserSet).not.toHaveBeenCalled();
    expect(browserRemove).not.toHaveBeenCalled();
  });

  it('reports native storage errors without falling back to another device store', async () => {
    const browserGet = vi.fn();
    const browserSet = vi.fn();
    const browserRemove = vi.fn();
    vi.stubGlobal('window', { ...tossWindow(), localStorage: { getItem: browserGet, setItem: browserSet, removeItem: browserRemove } });
    vi.spyOn(Storage, 'getItem').mockRejectedValue(new Error('native read failed'));
    vi.spyOn(Storage, 'setItem').mockRejectedValue(new Error('native write failed'));
    vi.spyOn(Storage, 'removeItem').mockRejectedValue(new Error('native remove failed'));
    const repository = createRepository();
    await expect(repository.load()).rejects.toThrow('기록을 불러오지 못했어요.');
    await expect(repository.save(createInitialState())).rejects.toThrow('기록을 저장하지 못했어요.');
    await expect(repository.reset()).rejects.toThrow('데이터를 초기화하지 못했어요.');
    expect(browserGet).not.toHaveBeenCalled();
    expect(browserSet).not.toHaveBeenCalled();
    expect(browserRemove).not.toHaveBeenCalled();
  });

  it('leaves native interactions inactive in browser preview', () => {
    vi.stubGlobal('window', {})
    const back = vi.fn()
    expect(() => initializeTossSafeArea()()).not.toThrow()
    expect(() => subscribeTossBack(back)()).not.toThrow()
    expect(() => setOverlaySwipeBack(true)()).not.toThrow()
    expect(back).not.toHaveBeenCalled()
  })

  it('does not double the opaque native navigation top inset and restores CSS on cleanup', () => {
    vi.stubGlobal('window', tossWindow())
    const values = new Map([['--safe-top', '7px'], ['--safe-bottom', '9px']])
    vi.stubGlobal('document', { documentElement: { style: {
      getPropertyValue: (name: string) => values.get(name) ?? '',
      setProperty: (name: string, value: string) => values.set(name, value),
      removeProperty: (name: string) => values.delete(name),
    } } })
    vi.spyOn(SafeArea, 'get').mockReturnValue({ top: 47, bottom: 34, left: 0, right: 0 })
    const unsubscribe = vi.fn()
    const subscribe = vi.spyOn(SafeArea, 'subscribe').mockReturnValue(unsubscribe)
    const cleanup = initializeTossSafeArea()
    expect(values.get('--safe-top')).toBe('0px')
    expect(values.get('--safe-bottom')).toBe('34px')
    subscribe.mock.calls[0][0].onEvent({ top: 59, bottom: 21, left: 44, right: 44 })
    expect(values.get('--safe-top')).toBe('0px')
    expect(values.get('--safe-bottom')).toBe('21px')
    expect(values.get('--safe-left')).toBe('44px')
    cleanup()
    expect(unsubscribe).toHaveBeenCalledOnce()
    expect(values.get('--safe-top')).toBe('7px')
    expect(values.get('--safe-bottom')).toBe('9px')
    expect(values.has('--safe-left')).toBe(false)
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
