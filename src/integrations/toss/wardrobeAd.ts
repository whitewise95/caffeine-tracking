import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework'

const LIVE_WARDROBE_AD_GROUP_ID = 'ait.v2.live.cf69107c15014790'
const TEST_WARDROBE_AD_GROUP_ID = 'ait-ad-test-interstitial-id'
const noop = () => {}

export const WARDROBE_APPLY_AD_GROUP_ID = import.meta.env.PROD
  ? LIVE_WARDROBE_AD_GROUP_ID
  : TEST_WARDROBE_AD_GROUP_ID

type FullScreenAdApi = {
  load: typeof loadFullScreenAd
  show: typeof showFullScreenAd
}

export type FullScreenAdSession = {
  preload: () => void
  showIfReady: () => boolean
  dispose: () => void
}

export function createFullScreenAdSession(
  adGroupId: string,
  api: FullScreenAdApi = { load: loadFullScreenAd, show: showFullScreenAd },
): FullScreenAdSession {
  let loaded = false
  let disposed = false
  let unregisterLoad = noop
  let unregisterShow = noop

  function preload() {
    if (disposed || loaded) return
    try {
      if (!api.load.isSupported()) return
      unregisterLoad()
      unregisterLoad = api.load({
        options: { adGroupId },
        onEvent: event => { if (event.type === 'loaded') loaded = true },
        onError: () => { loaded = false },
      })
    } catch {
      loaded = false
    }
  }

  function showIfReady(): boolean {
    if (disposed || !loaded) return false
    try {
      if (!api.show.isSupported()) return false
      loaded = false
      unregisterLoad()
      unregisterLoad = noop

      let endedSynchronously = false
      let release = noop
      const finish = () => {
        endedSynchronously = true
        release()
        unregisterShow = noop
      }
      release = api.show({
        options: { adGroupId },
        onEvent: event => {
          if (event.type === 'dismissed' || event.type === 'failedToShow') finish()
        },
        onError: finish,
      })
      if (endedSynchronously) release()
      else unregisterShow = release
      return true
    } catch {
      unregisterShow = noop
      return false
    }
  }

  function dispose() {
    disposed = true
    loaded = false
    unregisterLoad()
    unregisterShow()
    unregisterLoad = noop
    unregisterShow = noop
  }

  return { preload, showIfReady, dispose }
}

export function createWardrobeApplyAdSession(): FullScreenAdSession {
  return createFullScreenAdSession(WARDROBE_APPLY_AD_GROUP_ID)
}
