import { useCallback, useEffect, useRef, type MouseEvent, type PointerEvent, type RefObject } from 'react'

type Sample = { y: number; time: number }
type Gesture = {
  id: number
  y: number
  top: number
  height: number
  dragged: boolean
  samples: Sample[]
}

const DRAG_THRESHOLD_PX = 10
const VELOCITY_WINDOW_MS = 100
const MIN_FLING_SPEED = .3
const FLING_PROJECTION_MS = 180
const MAX_FLING_ROWS = 8

// Own only vertical wheel gestures; native scrolling outside the wheel and
// pinch zoom remain available. Scroll positions never enter React state.
export function useTimeWheelGesture(ref: RefObject<HTMLDivElement>, count: number, disabled: boolean, onPosition: (index: number) => void) {
  const gesture = useRef<Gesture | null>(null)
  const frame = useRef<number | null>(null)
  const suppressClick = useRef(false)
  const notify = useRef(onPosition)
  notify.current = onPosition

  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
    gesture.current = null
    ref.current?.removeAttribute('data-interacting')
  }, [ref])

  useEffect(() => {
    if (disabled) stop()
    return stop
  }, [disabled, stop])

  function position(node: HTMLDivElement, top: number, height: number) {
    node.scrollTop = Math.max(0, Math.min((count - 1) * height, top))
    notify.current(Math.round(node.scrollTop / height))
  }

  function move(event: PointerEvent<HTMLDivElement>, capture = true) {
    const active = gesture.current
    if (!active || active.id !== event.pointerId) return
    const distance = active.y - event.clientY
    if (!active.dragged && Math.abs(distance) < DRAG_THRESHOLD_PX) return
    if (!active.dragged) {
      active.dragged = true
      suppressClick.current = true
      event.currentTarget.focus({ preventScroll: true })
      // Only active browser pointers can be captured.
      if (capture && event.nativeEvent.isTrusted) event.currentTarget.setPointerCapture(event.pointerId)
    }
    active.samples.push({ y: event.clientY, time: event.timeStamp })
    active.samples = active.samples.filter(sample => event.timeStamp - sample.time <= VELOCITY_WINDOW_MS)
    position(event.currentTarget, active.top + distance, active.height)
    event.preventDefault()
  }

  function finish(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const active = gesture.current
    if (!active || active.id !== event.pointerId) return
    const node = event.currentTarget
    if (!cancelled) move(event, false)
    gesture.current = null
    if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId)
    if (!active.dragged) {
      node.removeAttribute('data-interacting')
      return
    }
    const recent = active.samples.filter(sample => event.timeStamp - sample.time <= VELOCITY_WINDOW_MS)
    const first = recent[0]
    const last = recent[recent.length - 1]
    const elapsed = first && last ? last.time - first.time : 0
    const speed = !cancelled && elapsed > 0 ? (first.y - last.y) / elapsed : 0
    const extra = Math.abs(speed) >= MIN_FLING_SPEED
      ? Math.max(-MAX_FLING_ROWS * active.height, Math.min(MAX_FLING_ROWS * active.height, speed * FLING_PROJECTION_MS))
      : 0
    const from = node.scrollTop
    const height = active.height
    const target = Math.max(0, Math.min(count - 1, Math.round((from + extra) / active.height))) * active.height
    const settle = () => {
      position(node, target, active.height)
      node.removeAttribute('data-interacting')
      frame.current = null
    }
    if (cancelled || Math.abs(target - from) < 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      settle()
      return
    }
    const duration = Math.min(320, 140 + Math.abs(target - from) / active.height * 22)
    const started = performance.now()
    function animate(now: number) {
      const progress = Math.min(1, (now - started) / duration)
      position(node, from + (target - from) * (1 - Math.pow(1 - progress, 3)), height)
      if (progress < 1) frame.current = requestAnimationFrame(animate)
      else settle()
    }
    frame.current = requestAnimationFrame(animate)
  }

  return {
    stop,
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      if (disabled || !event.isPrimary || event.button !== 0 || gesture.current) return
      stop()
      suppressClick.current = false
      const node = event.currentTarget
      node.setAttribute('data-interacting', 'true')
      gesture.current = {
        id: event.pointerId, y: event.clientY, top: node.scrollTop,
        height: node.firstElementChild?.getBoundingClientRect().height || 48,
        dragged: false, samples: [{ y: event.clientY, time: event.timeStamp }],
      }
    },
    onPointerMove: move,
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => finish(event),
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => finish(event, true),
    onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => {
      // Touch begins with implicit capture on a number button. Its loss bubbles
      // when capture moves to the wheel, and must not cancel the active drag.
      if (event.target === event.currentTarget) finish(event, true)
    },
    onClickCapture(event: MouseEvent<HTMLDivElement>) {
      if (!suppressClick.current) return
      suppressClick.current = false
      event.preventDefault()
      event.stopPropagation()
    },
  }
}
