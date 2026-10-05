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
  handle: HTMLButtonElement
  pointerId?: number
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
  const pressTimer = useRef<ReturnType<typeof setTimeout>>()
  const frame = useRef<number>()
  const mounted = useRef(true)
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

  function createSession(id: DrinkCategoryId, handle: HTMLButtonElement, kind: DragSession['kind'], x = 0, y = 0): DragSession | null {
    const list = scrollRef.current
    const category = latest.current.categories.find(item => item.id === id)
    if (!list || !category || latest.current.disabled || committing.current || session.current) return null
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
    const speed = categoryAutoScrollSpeed(current.currentY, bounds.top, bounds.bottom)
    if (speed !== 0) {
      list.scrollTop = Math.max(0, Math.min(current.maxScrollTop, list.scrollTop + speed))
      updatePointer()
    }
    frame.current = requestAnimationFrame(tick)
  }

  async function drop() {
    const current = stopResources()
    if (!current?.started) return
    if (mounted.current) setDrag(null)
    if (latest.current.disabled || current.ids.length !== latest.current.categories.length || current.ids.some((id, index) => id !== latest.current.categories[index]?.id)) return
    if (current.sourceIndex === current.targetIndex) {
      if (mounted.current) setAnnouncement(`${current.name} 순서를 유지했어요.`)
      return
    }
    committing.current = true
    try {
      const saved = await latest.current.onCommit(moveCategoryToIndex(current.ids, current.id, current.targetIndex))
      if (!mounted.current) return
      setAnnouncement(saved ? `${current.name}을 ${current.targetIndex + 1}번째로 이동했어요.` : '순서를 저장하지 못했어요. 다시 이동해 주세요.')
      current.handle.focus({ preventScroll: true })
      current.handle.scrollIntoView({ block: 'nearest' })
    } catch {
      if (mounted.current) setAnnouncement('순서를 저장하지 못했어요. 다시 이동해 주세요.')
    } finally {
      committing.current = false
    }
  }

  function onPointerDown(id: DrinkCategoryId, event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || !event.isPrimary) return
    const current = createSession(id, event.currentTarget, 'pointer', event.clientX, event.clientY)
    if (!current) return
    current.pointerId = event.pointerId
    session.current = current
    event.currentTarget.setPointerCapture(event.pointerId)
    pressTimer.current = setTimeout(() => {
      if (session.current !== current || latest.current.disabled) return
      current.started = true
      renderSession(current)
      setAnnouncement(`${current.name} 순서 이동 시작. 위아래로 끌어서 놓아 주세요.`)
      frame.current = requestAnimationFrame(tick)
    }, 350)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
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

  return {
    drag,
    announcement,
    cancel,
    handleProps: (id: DrinkCategoryId) => ({
      onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => onPointerDown(id, event),
      onPointerMove,
      onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => {
        if (session.current?.pointerId === event.pointerId) void drop()
      },
      onPointerCancel: cancel,
      onLostPointerCapture: () => { if (session.current?.kind === 'pointer') cancel() },
      onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => onKeyDown(id, event),
      onBlur: () => { if (session.current?.kind === 'keyboard') cancel() },
      onContextMenu: (event: ReactMouseEvent<HTMLButtonElement>) => event.preventDefault(),
    }),
  }
}
