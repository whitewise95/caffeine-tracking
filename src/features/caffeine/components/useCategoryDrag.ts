import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { DrinkCategory, DrinkCategoryId } from '../model/caffeine.types'
import { categoryAutoScrollSpeed, categoryDropIndex, moveCategoryToIndex } from './categoryDrag'

interface DragView {
  id: DrinkCategoryId
  sourceIndex: number
  targetIndex: number
  offset: number
}

interface DragSession extends DragView {
  kind: 'pointer' | 'keyboard'
  ids: DrinkCategoryId[]
  name: string
  handle: HTMLElement
  pointerId?: number
  touchId?: number
  startX: number
  startY: number
  currentY: number
  scrollTop: number
  maxScrollTop: number
  minOffset: number
  maxOffset: number
  midpoints: number[]
  started: boolean
}

interface CategoryDragOptions {
  categories: readonly DrinkCategory[]
  disabled: boolean
  scrollRef: RefObject<HTMLDivElement>
  onCommit: (ids: DrinkCategoryId[]) => Promise<boolean>
}

export function useCategoryDrag({ categories, disabled, scrollRef, onCommit }: CategoryDragOptions) {
  const [drag, setDrag] = useState<DragView | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const session = useRef<DragSession | null>(null)
  const settling = useRef<DragSession | null>(null)
  const pressTimer = useRef<ReturnType<typeof setTimeout>>()
  const frame = useRef<number>()
  const mounted = useRef(true)
  const suppressClick = useRef(false)
  const committing = useRef(false)
  const latest = useRef({ categories, disabled, onCommit })
  latest.current = { categories, disabled, onCommit }

  function stopResources() {
    if (pressTimer.current !== undefined) clearTimeout(pressTimer.current)
    if (frame.current !== undefined) cancelAnimationFrame(frame.current)
    pressTimer.current = undefined
    frame.current = undefined
    const current = session.current
    session.current = null
    if (current?.pointerId !== undefined && current.handle.hasPointerCapture(current.pointerId)) {
      current.handle.releasePointerCapture(current.pointerId)
    }
    return current
  }

  function cancel() {
    const current = stopResources()
    if (!mounted.current) return
    setDrag(null)
    if (current?.started) setAnnouncement(`${current.name} 순서 이동을 취소했어요.`)
  }

  // Resources belong to this sheet instance; browser back/unmount never drops.
  useEffect(() => {
    mounted.current = true
    const blur = () => cancel()
    const visibility = () => { if (document.hidden) cancel() }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !session.current) return
      event.preventDefault()
      event.stopPropagation()
      cancel()
    }
    window.addEventListener('blur', blur)
    window.addEventListener('keydown', escape, true)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      mounted.current = false
      stopResources()
      window.removeEventListener('blur', blur)
      window.removeEventListener('keydown', escape, true)
      document.removeEventListener('visibilitychange', visibility)
    }
    // Session operations read refs and are independent of render closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (disabled && session.current) cancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled])

  useEffect(() => {
    const current = session.current
    if (current && (current.ids.length !== categories.length || current.ids.some((id, index) => id !== categories[index]?.id))) cancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories])

  function createSession(id: DrinkCategoryId, handle: HTMLElement, kind: DragSession['kind'], x = 0, y = 0): DragSession | null {
    const list = scrollRef.current
    const category = latest.current.categories.find(item => item.id === id)
    if (!list || !category || latest.current.categories.length < 2 || latest.current.disabled || committing.current || session.current) return null
    const ids = latest.current.categories.map(item => item.id)
    const sourceIndex = ids.indexOf(id)
    const rows = Array.from(list.querySelectorAll<HTMLElement>('[data-category-row]'))
    const bounds = ids.map(value => {
      const row = rows.find(element => element.dataset.categoryRow === value)
      const rect = row?.querySelector<HTMLElement>('.category-manager-row')?.getBoundingClientRect()
      return { top: (rect?.top ?? 0) + list.scrollTop, bottom: (rect?.bottom ?? 0) + list.scrollTop }
    })
    const midpoints = bounds.map(rect => (rect.top + rect.bottom) / 2)
    return { id, ids, name: category.name, sourceIndex, targetIndex: sourceIndex, offset: 0, kind, handle, startX: x, startY: y, currentY: y, scrollTop: list.scrollTop, maxScrollTop: Math.max(0, list.scrollHeight - list.clientHeight), minOffset: bounds[0].top - bounds[sourceIndex].top, maxOffset: bounds[bounds.length - 1].bottom - bounds[sourceIndex].bottom, midpoints, started: false }
  }

  function renderSession(current: DragSession) {
    if (mounted.current) setDrag({ id: current.id, sourceIndex: current.sourceIndex, targetIndex: current.targetIndex, offset: current.offset })
  }

  function updatePointer() {
    const current = session.current
    const list = scrollRef.current
    if (!current?.started || current.kind !== 'pointer' || !list) return
    const pointerOffset = current.currentY - current.startY + list.scrollTop - current.scrollTop
    // Transforms can enlarge scrollable overflow. Keep the visual within the
    // original list and compute targeting from the unconstrained pointer.
    current.offset = Math.max(current.minOffset, Math.min(current.maxOffset, pointerOffset))
    const target = categoryDropIndex(current.midpoints, current.sourceIndex, current.midpoints[current.sourceIndex] + pointerOffset)
    if (target !== current.targetIndex) setAnnouncement(`${current.name}, ${target + 1}번째 위치. 놓으면 순서가 저장돼요.`)
    current.targetIndex = target
    renderSession(current)
  }

  function tick() {
    const current = session.current
    const list = scrollRef.current
    if (!current?.started || current.kind !== 'pointer' || !list) return
    const bounds = list.getBoundingClientRect()
    const speed = Math.abs(current.currentY - current.startY) > 8 ? categoryAutoScrollSpeed(current.currentY, bounds.top, bounds.bottom) : 0
    if (speed !== 0) {
      list.scrollTop = Math.max(0, Math.min(current.maxScrollTop, list.scrollTop + speed))
      updatePointer()
    }
    frame.current = requestAnimationFrame(tick)
  }

  async function drop() {
    const current = stopResources()
    if (!current?.started) return
    if (latest.current.disabled || current.ids.length !== latest.current.categories.length || current.ids.some((id, index) => id !== latest.current.categories[index]?.id)) { if (mounted.current) setDrag(null); return }
    if (current.sourceIndex === current.targetIndex) {
      if (mounted.current) setDrag(null)
      if (mounted.current) setAnnouncement(`${current.name} 순서를 유지했어요.`)
      return
    }
    committing.current = true
    // Keep the dropped position visible while native storage confirms the order.
    settling.current = current
    try {
      const saved = await latest.current.onCommit(moveCategoryToIndex(current.ids, current.id, current.targetIndex))
      if (!mounted.current) return
      setAnnouncement(saved ? `${current.name}을 ${current.targetIndex + 1}번째로 이동했어요.` : '순서를 저장하지 못했어요. 다시 이동해 주세요.')
      const focusTarget = current.handle.matches('button') ? current.handle : current.handle.querySelector<HTMLButtonElement>('.category-manager-reorder')
      focusTarget?.focus({ preventScroll: true })
      current.handle.scrollIntoView({ block: 'nearest' })
    } catch {
      if (mounted.current) setAnnouncement('순서를 저장하지 못했어요. 다시 이동해 주세요.')
    } finally {
      committing.current = false
      settling.current = null
      if (mounted.current) setDrag(null)
    }
  }

  function onPointerDown(id: DrinkCategoryId, event: ReactPointerEvent<HTMLDivElement>) {
    suppressClick.current = false
    if (event.pointerType === 'touch' || event.button !== 0 || !event.isPrimary || (event.target as Element).closest('[data-category-manage]')) return
    const current = createSession(id, event.currentTarget, 'pointer', event.clientX, event.clientY)
    if (!current) return
    current.pointerId = event.pointerId
    session.current = current
    event.currentTarget.setPointerCapture(event.pointerId)
    armPress(current)
  }

  function armPress(current: DragSession) {
    suppressClick.current = false
    pressTimer.current = setTimeout(() => {
      if (session.current !== current || latest.current.disabled) return
      current.started = true
      suppressClick.current = true
      renderSession(current)
      setAnnouncement(`${current.name} 순서 이동 시작. 위아래로 끌어서 놓아 주세요.`)
      frame.current = requestAnimationFrame(tick)
    }, 350)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = session.current
    if (!current || current.pointerId !== event.pointerId) return
    if (!current.started) {
      if (Math.hypot(event.clientX - current.startX, event.clientY - current.startY) > 8) cancel()
      return
    }
    event.preventDefault()
    current.currentY = event.clientY
    updatePointer()
  }

  function onKeyDown(id: DrinkCategoryId, event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      if (session.current?.kind === 'keyboard' && session.current.id === id) { void drop(); return }
      if (event.key !== ' ') return
      const current = createSession(id, event.currentTarget, 'keyboard')
      if (!current) return
      current.started = true
      session.current = current
      renderSession(current)
      setAnnouncement(`${current.name} 순서 이동 시작. 위아래 방향키로 이동하고 스페이스 또는 엔터로 저장해요. Esc는 취소예요.`)
      return
    }
    const current = session.current
    if (current?.kind !== 'keyboard' || current.id !== id) return
    if (event.key === 'Tab') { cancel(); return }
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()
    current.targetIndex = Math.max(0, Math.min(current.ids.length - 1, current.targetIndex + (event.key === 'ArrowUp' ? -1 : 1)))
    current.offset = Math.max(current.minOffset, Math.min(current.maxOffset, current.midpoints[current.targetIndex] - current.midpoints[current.sourceIndex]))
    renderSession(current)
    setAnnouncement(`${current.name}, ${current.targetIndex + 1}번째 위치.`)
    current.handle.scrollIntoView({ block: 'nearest' })
  }

  // A passive React touch listener cannot take over a held gesture. Register a
  // native listener before contact; leave ordinary swipes entirely to the browser.
  useEffect(() => {
    const list = scrollRef.current
    if (!list) return
    const start = (event: TouchEvent) => {
      if (event.touches.length !== 1) { cancel(); return }
      const target = event.target instanceof Element ? event.target : null
      if (!target || target.closest('[data-category-manage]')) return
      const row = target.closest<HTMLElement>('[data-category-row]')
      const handle = row?.querySelector<HTMLElement>('.category-manager-row')
      const id = row?.dataset.categoryRow as DrinkCategoryId | undefined
      if (!id || !handle) return
      const touch = event.touches[0]
      const current = createSession(id, handle, 'pointer', touch.clientX, touch.clientY)
      if (!current) return
      current.touchId = touch.identifier
      session.current = current
      armPress(current)
    }
    const move = (event: TouchEvent) => {
      const current = session.current
      if (!current || current.touchId === undefined) return
      if (event.touches.length !== 1) { cancel(); return }
      const touch = Array.from(event.touches).find(item => item.identifier === current.touchId)
      if (!touch) return
      if (!current.started) {
        if (Math.hypot(touch.clientX - current.startX, touch.clientY - current.startY) > 8) cancel()
        return
      }
      if (!event.cancelable) { cancel(); return }
      event.preventDefault()
      current.currentY = touch.clientY
      updatePointer()
    }
    const end = (event: TouchEvent) => {
      const current = session.current
      if (!current || current.touchId === undefined || !Array.from(event.changedTouches).some(item => item.identifier === current.touchId)) return
      if (current.started && event.cancelable) event.preventDefault()
      void drop()
    }
    list.addEventListener('touchstart', start, { passive: true })
    list.addEventListener('touchmove', move, { passive: false })
    list.addEventListener('touchend', end, { passive: false })
    list.addEventListener('touchcancel', cancel)
    return () => {
      list.removeEventListener('touchstart', start)
      list.removeEventListener('touchmove', move)
      list.removeEventListener('touchend', end)
      list.removeEventListener('touchcancel', cancel)
    }
    // Session operations use latest refs; listeners must stay registered while held.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollRef])

  return {
    drag,
    announcement,
    cancel,
    rowStyle: (index: number) => {
      const current = session.current ?? settling.current
      if (!drag || !current) return undefined
      let offset = 0
      if (index === drag.sourceIndex) offset = drag.offset
      else if (drag.targetIndex > drag.sourceIndex && index > drag.sourceIndex && index <= drag.targetIndex) offset = current.midpoints[index - 1] - current.midpoints[index]
      else if (drag.targetIndex < drag.sourceIndex && index >= drag.targetIndex && index < drag.sourceIndex) offset = current.midpoints[index + 1] - current.midpoints[index]
      return { transform: `translateY(${offset}px)` }
    },
    rowProps: (id: DrinkCategoryId) => ({
      onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => onPointerDown(id, event),
      onPointerMove,
      onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => {
        if (session.current?.pointerId === event.pointerId) void drop()
      },
      onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => { if (session.current?.pointerId === event.pointerId) cancel() },
      onLostPointerCapture: () => { if (session.current?.pointerId !== undefined) cancel() },
      onClickCapture: (event: ReactMouseEvent<HTMLDivElement>) => {
        if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false }
      },
      onContextMenu: (event: ReactMouseEvent<HTMLDivElement>) => event.preventDefault(),
    }),
    handleProps: (id: DrinkCategoryId) => ({
      onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => onKeyDown(id, event),
      onBlur: () => { if (session.current?.kind === 'keyboard') cancel() },
    }),
  }
}
