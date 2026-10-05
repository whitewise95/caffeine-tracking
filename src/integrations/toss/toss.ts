import { Device, Environment, SafeArea, Screen, Storage, graniteEvent } from '@apps-in-toss/web-framework'
import type { CaffeineRepository } from '../../features/caffeine/repository/CaffeineRepository'
import { LocalCaffeineRepository } from '../../features/caffeine/repository/LocalCaffeineRepository'

const noop = () => {}

/** SDK 3.7 host constants are synchronous; never probe the bridge with an async call. */
export function isTossRuntime(): boolean {
  if (typeof window === 'undefined') return false
  const bridge = (window as Window & { ReactNativeWebView?: { postMessage?: unknown } }).ReactNativeWebView
  // In dev:toss, the official Vite plugin replaces the SDK with its mock facade.
  // It intentionally does not create a ReactNativeWebView bridge. This branch is
  // removed from production builds, where a native bridge is still required.
  const usesDevtools = import.meta.env.DEV && import.meta.env.MODE === 'toss'
  if (!usesDevtools && typeof bridge?.postMessage !== 'function') return false

  try {
    const environment = Environment.environment
    return (environment === 'toss' || environment === 'sandbox')
      && typeof Environment.tossAppVersion === 'string'
      && Environment.tossAppVersion.length > 0
  } catch {
    return false
  }
}

export function createRepository(): CaffeineRepository {
  if (!isTossRuntime()) return new LocalCaffeineRepository()

  // A native failure must stay visible instead of silently switching data stores.
  return new LocalCaffeineRepository({
    getItem: (key) => Storage.getItem(key),
    setItem: (key, value) => Storage.setItem(key, value),
    removeItem: (key) => Storage.removeItem(key),
  })
}

export function initializeTossSafeArea(): () => void {
  if (!isTossRuntime() || typeof document === 'undefined') return noop

  const style = document.documentElement.style
  const sides = ['top', 'right', 'bottom', 'left'] as const
  const previousValues = sides.map((side) => style.getPropertyValue(`--safe-${side}`))
  // This app uses an opaque native navigation bar (transparentBackground: false).
  // Its WebView starts below that bar; adding the device's top inset again
  // creates an empty strip above every page. Bottom/side insets remain needed.
  style.setProperty('--safe-top', '0px')
  const applyInsets = (insets: ReturnType<typeof SafeArea.get>) => {
    for (const side of sides) {
      if (side !== 'top' && Number.isFinite(insets[side])) {
        style.setProperty(`--safe-${side}`, `${Math.max(0, insets[side])}px`)
      }
    }
  }

  let unsubscribe = noop
  try {
    applyInsets(SafeArea.get())
    unsubscribe = SafeArea.subscribe({ onEvent: applyInsets })
  } catch (error) {
    console.warn('토스 화면 여백을 가져오지 못했어요.', error)
  }

  return () => {
    unsubscribe()
    sides.forEach((side, index) => {
      const previous = previousValues[index]
      if (previous) style.setProperty(`--safe-${side}`, previous)
      else style.removeProperty(`--safe-${side}`)
    })
  }
}

/** Subscribe only while there is an overlay or an internal route to go back from. */
export function subscribeTossBack(callback: () => void): () => void {
  if (!isTossRuntime()) return noop

  try {
    return graniteEvent.addEventListener('backEvent', {
      onEvent: callback,
      onError: (error) => console.warn('토스 뒤로가기 이벤트를 연결하지 못했어요.', error),
    })
  } catch (error) {
    console.warn('토스 뒤로가기 이벤트를 연결하지 못했어요.', error)
    return noop
  }
}

let activeIosOverlays = 0

function updateIosSwipe(isEnabled: boolean): void {
  try {
    void Screen.setIosSwipeBack({ isEnabled }).catch((error: unknown) => {
      console.warn('토스 스와이프 뒤로가기를 설정하지 못했어요.', error)
    })
  } catch (error) {
    console.warn('토스 스와이프 뒤로가기를 설정하지 못했어요.', error)
  }
}

/** The config allows swipe by default. Keep it disabled until every overlay closes. */
export function setOverlaySwipeBack(open: boolean): () => void {
  if (!open || !isTossRuntime() || Device.os !== 'ios') return noop

  activeIosOverlays += 1
  if (activeIosOverlays === 1) updateIosSwipe(false)

  let cleanedUp = false
  return () => {
    if (cleanedUp) return
    cleanedUp = true
    activeIosOverlays -= 1
    if (activeIosOverlays === 0) updateIosSwipe(true)
  }
}
