import { Device, Environment, NavigationBar, SafeArea, Screen, Storage, graniteEvent } from '@apps-in-toss/web-framework'
import type { AppTheme } from '../../features/caffeine/model/caffeine.types'
import type { CaffeineRepository, CaffeineStorage } from '../../features/caffeine/repository/CaffeineRepository'
import { LocalCaffeineRepository } from '../../features/caffeine/repository/LocalCaffeineRepository'
import type { AvatarRepository } from '../../features/avatar/repository/AvatarRepository'
import { LocalAvatarRepository } from '../../features/avatar/repository/LocalAvatarRepository'

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

function platformStorage(): CaffeineStorage | undefined {
  if (!isTossRuntime()) return undefined

  // A native failure must stay visible instead of silently switching data stores.
  return {
    getItem: (key) => Storage.getItem(key),
    setItem: (key, value) => Storage.setItem(key, value),
    removeItem: (key) => Storage.removeItem(key),
  }
}

export function createRepository(): CaffeineRepository {
  return new LocalCaffeineRepository(platformStorage())
}

export function createAvatarRepository(): AvatarRepository {
  return new LocalAvatarRepository(platformStorage())
}

/** Add a quiet detent without making the time picker depend on the native bridge. */
export async function triggerTimeWheelHaptic(): Promise<void> {
  if (!isTossRuntime()) return
  try {
    await Device.triggerHaptic({ type: 'tickWeak' })
  } catch {
    // Haptics are optional feedback; a bridge failure must not block the picker.
  }
}

/** Open research sources outside the mini-app; failures are handled by the link UI. */
export async function openTossExternalURL(url: string): Promise<void> {
  if (!isTossRuntime()) return
  await Device.openURL(url)
}

/** Leave the mini-app only after an explicit user confirmation. */
export async function closeTossApp(): Promise<void> {
  if (!isTossRuntime()) throw new Error('토스 앱에서만 앱을 종료할 수 있어요.')
  await Screen.close()
}

let navigationThemeUpdate: Promise<void> = Promise.resolve()

/** Serialize updates so a slower previous request cannot replace the latest theme. */
export function syncTossNavigationTheme(theme: AppTheme): Promise<void> {
  if (!isTossRuntime()) return Promise.resolve()
  navigationThemeUpdate = navigationThemeUpdate.then(async () => {
    try {
      await NavigationBar.setOptions({ theme, backgroundColor: theme === 'light' ? '#F7F8FA' : '#0A0B0E' })
    } catch (error) {
      console.warn('토스 상단 바 테마를 적용하지 못했어요.', error)
    }
  })
  return navigationThemeUpdate
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

/** The callback owns route, overlay and home exit behavior while subscribed. */
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
