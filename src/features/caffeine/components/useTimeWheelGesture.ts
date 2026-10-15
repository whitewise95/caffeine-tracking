import { useCallback, useEffect, useLayoutEffect, useRef, type PointerEvent, type RefObject } from 'react'

type Sample = { y: number; time: number }
type Gesture = { id: number; y: number; top: number; dragged: boolean; samples: Sample[] }
const DRAG_THRESHOLD_PX = 6
const VELOCITY_WINDOW_MS = 100
const MIN_FLING_SPEED = .3
const FLING_PROJECTION_MS = 180
const MAX_FLING_ROWS = 8

/** One owner for position: a composited track, never native scrolling + JS snapping. */
export function useTimeWheelGesture(ref: RefObject<HTMLDivElement>, count: number, selected: number, disabled: boolean, onPosition: (index: number, userGesture: boolean) => void) {
  const gesture = useRef<Gesture | null>(null)
  const frame = useRef<number | null>(null)
  const track = useRef<HTMLElement | null>(null)
  const height = useRef(48)
  const offset = useRef(selected * 48)
  const index = useRef(selected)
  const notify = useRef(onPosition)
  notify.current = onPosition

  const paint = useCallback((userGesture: boolean) => {
    if (track.current) track.current.style.transform = `translate3d(0, ${-offset.current}px, 0)`
    const next = Math.round(offset.current / height.current)
    if (next !== index.current) {
      index.current = next
      notify.current(next, userGesture)
    }
  }, [])

  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
    const active = gesture.current
    gesture.current = null
    const node = ref.current
    if (active && node?.hasPointerCapture(active.id)) node.releasePointerCapture(active.id)
    node?.removeAttribute('data-interacting')
  }, [ref])

  const interrupt = useCallback(() => {
    stop()
    offset.current = Math.round(offset.current / height.current) * height.current
    paint(false)
  }, [paint, stop])

  useLayoutEffect(() => {
    const node = ref.current
    track.current = node?.querySelector<HTMLElement>('.time-wheel-track') ?? null
    const row = track.current?.firstElementChild
    if (!row) return
    const resize = (size: number) => {
      if (!size || size === height.current) return
      stop()
      height.current = size
      offset.current = index.current * size
      paint(false)
    }
    resize(row.getBoundingClientRect().height)
    paint(false)
    const observer = new ResizeObserver(entries => {
      const entry = entries[0]
      resize(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height)
    })
    observer.observe(row)
    return () => { observer.disconnect(); stop(); track.current = null }
  }, [paint, ref, stop])

  useLayoutEffect(() => {
    if (selected === index.current) return
    stop()
    index.current = selected
    offset.current = selected * height.current
    paint(false)
  }, [paint, selected, stop])

  useEffect(() => {
    if (disabled) interrupt()
    const visibility = () => { if (document.hidden) interrupt() }
    window.addEventListener('blur', interrupt)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      stop()
      window.removeEventListener('blur', interrupt)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [disabled, interrupt, stop])

  function move(event: PointerEvent<HTMLDivElement>, schedule = true) {
    const active = gesture.current
    if (!active || active.id !== event.pointerId) return
    const distance = active.y - event.clientY
    if (!active.dragged && Math.abs(distance) < DRAG_THRESHOLD_PX) return
    active.dragged = true
    active.samples.push({ y: event.clientY, time: event.timeStamp })
    active.samples = active.samples.filter(sample => event.timeStamp - sample.time <= VELOCITY_WINDOW_MS)
    offset.current = Math.max(0, Math.min((count - 1) * height.current, active.top + distance))
    // Coalesce high-rate touch events; no geometry reads or React work between frames.
    if (schedule && frame.current === null) frame.current = requestAnimationFrame(() => {
      frame.current = null
      paint(true)
    })
    event.preventDefault()
  }

  function finish(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const active = gesture.current
    if (!active || active.id !== event.pointerId) return
    if (!cancelled) move(event, false)
    stop()
    if (!active.dragged) { interrupt(); return }
    paint(!cancelled)
    const recent = active.samples.filter(sample => event.timeStamp - sample.time <= VELOCITY_WINDOW_MS)
    const first = recent[0]
    const last = recent[recent.length - 1]
    const elapsed = first && last ? last.time - first.time : 0
    const speed = !cancelled && elapsed > 0 ? (first.y - last.y) / elapsed : 0
    const row = height.current
    const extra = Math.abs(speed) >= MIN_FLING_SPEED
      ? Math.max(-MAX_FLING_ROWS * row, Math.min(MAX_FLING_ROWS * row, speed * FLING_PROJECTION_MS)) : 0
    const from = offset.current
    const target = Math.max(0, Math.min(count - 1, Math.round((from + extra) / row))) * row
    const settle = () => {
      offset.current = target
      paint(!cancelled)
      ref.current?.removeAttribute('data-interacting')
      frame.current = null
    }
    if (cancelled || Math.abs(target - from) < 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      settle()
      return
    }
    ref.current?.setAttribute('data-interacting', 'true')
    const duration = Math.min(320, 140 + Math.abs(target - from) / row * 22)
    const started = performance.now()
    function animate(now: number) {
      const progress = Math.min(1, (now - started) / duration)
      offset.current = from + (target - from) * (1 - Math.pow(1 - progress, 3))
      paint(true)
      if (progress < 1) frame.current = requestAnimationFrame(animate)
      else settle()
    }
    frame.current = requestAnimationFrame(animate)
  }

  return {
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      if (disabled || !event.isPrimary || event.button !== 0) return
      // A new primary touch also recovers a missing end event after native interruption.
      interrupt()
      const node = event.currentTarget
      node.setAttribute('data-interacting', 'true')
      gesture.current = {
        id: event.pointerId, y: event.clientY, top: offset.current,
        dragged: false, samples: [{ y: event.clientY, time: event.timeStamp }],
      }
      // Capture from the start: crossing a row/column must not lose the gesture.
      if (event.nativeEvent.isTrusted) {
        try { node.setPointerCapture(event.pointerId) } catch { interrupt() }
      }
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => move(event),
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => finish(event),
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => finish(event, true),
    onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) finish(event, true)
    },
  }
}
