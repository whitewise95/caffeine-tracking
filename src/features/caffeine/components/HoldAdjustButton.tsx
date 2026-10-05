import { useCallback, useEffect, useRef } from 'react'
import type { PointerEvent } from 'react'
import { Minus, Plus } from 'lucide-react'

interface HoldAdjustButtonProps {
  direction: -1 | 1
  disabled: boolean
  onAdjust: (delta: number) => void
}

export function HoldAdjustButton({ direction, disabled, onAdjust }: HoldAdjustButtonProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pointer = useRef<number | null>(null)
  const ignoreClick = useRef(false)
  const stop = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = undefined
    pointer.current = null
  }, [])
  const cancel = useCallback(() => { ignoreClick.current = true; stop() }, [stop])

  useEffect(() => {
    if (disabled) cancel()
    window.addEventListener('blur', cancel)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', cancel)
    const onVisibility = () => { if (document.hidden) cancel() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      window.removeEventListener('blur', cancel)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', cancel)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [disabled, stop, cancel])

  function start(event: PointerEvent<HTMLButtonElement>) {
    if (disabled || event.button !== 0 || event.isPrimary === false || pointer.current !== null) return
    ignoreClick.current = false
    pointer.current = event.pointerId
    if (event.nativeEvent.isTrusted) event.currentTarget.setPointerCapture(event.pointerId)
    const startedAt = performance.now()
    const repeat = () => {
      if (pointer.current === null) return
      ignoreClick.current = true
      const elapsed = performance.now() - startedAt
      // Keep each change at 1mg and smoothly shorten the repeat interval.
      const delay = Math.max(25, 180 - Math.max(0, elapsed - 600) * 0.07)
      onAdjust(direction)
      timer.current = setTimeout(repeat, delay)
    }
    timer.current = setTimeout(repeat, 400)
  }

  const Icon = direction === 1 ? Plus : Minus
  return <button type="button" className="sheet-dose-step" disabled={disabled}
    aria-label={`카페인량 1mg ${direction === 1 ? '늘리기' : '줄이기'}`}
    onPointerDown={start} onPointerUp={stop} onPointerCancel={cancel} onLostPointerCapture={stop}
    onPointerMove={event => {
      if (pointer.current !== event.pointerId) return
      const box = event.currentTarget.getBoundingClientRect()
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) cancel()
    }}
    onContextMenu={event => event.preventDefault()}
    onClick={event => {
      // Keyboard and assistive clicks have no preceding pointer press.
      if (event.detail !== 0 && ignoreClick.current) { ignoreClick.current = false; return }
      if (!disabled) onAdjust(direction)
    }}><Icon size={22} aria-hidden="true" /></button>
}
