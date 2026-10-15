// App-specific pacing, not an SDK limit. Faster detents are deliberately skipped.
const MIN_TICK_INTERVAL_MS = 50
const NATIVE_REQUEST_TIMEOUT_MS = 1_000

/** Drop stale ticks instead of building a native bridge queue behind a fast drag. */
export function createTimeWheelHaptic(trigger: () => Promise<void>): () => Promise<void> {
  let lastStartedAt = Number.NEGATIVE_INFINITY
  let pendingRequest: symbol | undefined

  return async () => {
    const now = performance.now()
    const elapsed = now - lastStartedAt
    if (elapsed < MIN_TICK_INTERVAL_MS) return
    if (pendingRequest && elapsed < NATIVE_REQUEST_TIMEOUT_MS) return

    // Check the watchdog on new input only: never play delayed catch-up feedback.
    // The SDK cannot cancel a native request, so an expired call may still finish.
    const request = Symbol()
    pendingRequest = request
    lastStartedAt = now
    const release = () => {
      if (pendingRequest === request) pendingRequest = undefined
    }

    try {
      // Do not make the gesture wait for a native acknowledgement.
      void trigger().then(release, release)
    } catch {
      release()
    }
  }
}
