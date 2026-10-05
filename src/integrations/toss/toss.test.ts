import { afterEach, describe, expect, it, vi } from 'vitest'
import { Screen, Storage } from '@apps-in-toss/web-framework'
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
