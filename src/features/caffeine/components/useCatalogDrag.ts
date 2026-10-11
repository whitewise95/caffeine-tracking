import { useEffect, useRef, useState } from 'react'
import type { ButtonHTMLAttributes, HTMLAttributes, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { Drink, DrinkCategory, DrinkCategoryId } from '../model/caffeine.types'
import { categoryAutoScrollSpeed } from './categoryDrag'
import { catalogDragMoved, catalogDragPoint, catalogStableDropTarget, projectCatalogLayout, type CatalogCategoryBounds, type CatalogDropTarget, type CatalogProjection } from './catalogDrag'

type DragKind = 'category' | 'drink'

interface CatalogDragView {
  kind: DragKind
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  offsetX: number
  offsetY: number
  viewportLeft: number
  viewportRight: number
  settling: boolean
}

interface DragSession extends Omit<CatalogDragView, 'viewportLeft' | 'viewportRight'> {
  pointerId: number
  captureElement: HTMLDivElement | null
  startX: number
  startY: number
  started: boolean
  layout: string
  target: CatalogDropTarget | null
  lastTarget: CatalogDropTarget
  base: CatalogProjection
  retargetX: number
  retargetY: number
  retargetScrollTop: number
}

interface CatalogDragOptions {
  containerRef: RefObject<HTMLDivElement>
  categories: readonly DrinkCategory[]
  drinks: readonly Drink[]
  disabled: boolean
  onReorderCategories: (ids: DrinkCategoryId[]) => Promise<boolean>
  onMoveDrink: (id: string, categoryId: DrinkCategoryId, beforeDrinkId?: string) => Promise<boolean>
}

function layoutIdentity(categories: readonly DrinkCategory[], drinks: readonly Drink[]) {
  return JSON.stringify([categories.map(category => category.id), drinks.map(drink => [drink.id, drink.categoryId])])
}

function sameTarget(left: CatalogDropTarget | null, right: CatalogDropTarget | null) {
  if (!left || !right) return left === right
  if (left.kind === 'category' && right.kind === 'category') return left.beforeCategoryId === right.beforeCategoryId
  return left.kind === 'drink' && right.kind === 'drink' && left.categoryId === right.categoryId && left.beforeDrinkId === right.beforeDrinkId
}

/** Render the projected arrays, retaining only the dragged item's hidden placeholder. */
export function useCatalogDrag(options: CatalogDragOptions) {
  const [drag, setDrag] = useState<CatalogDragView | null>(null)
  const [target, setTarget] = useState<CatalogDropTarget | null>(null)
  const [projection, setProjection] = useState<CatalogProjection | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const latest = useRef(options)
  latest.current = options
  const session = useRef<DragSession | null>(null)
  const frame = useRef<number>()
  const previousFrame = useRef<number>()
  const mounted = useRef(true)
  const committing = useRef(false)
  const suppressClickUntil = useRef(0)

  function stopResources() {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current)
    frame.current = undefined
    previousFrame.current = undefined
    const current = session.current
    session.current = null
    if (current?.started) suppressClickUntil.current = performance.now() + 600
    if (current) {
      try {
        if (current.captureElement?.hasPointerCapture(current.pointerId)) current.captureElement.releasePointerCapture(current.pointerId)
      } catch {
        // A detached handle or a browser-cancelled pointer has no capture left.
      }
    }
    return current
  }

  function clearView() {
    if (!mounted.current) return
    setDrag(null)
    setTarget(null)
    setProjection(null)
  }

  function cancel() {
    const current = stopResources()
    if (!current) return
    clearView()
    if (mounted.current && current?.started) setAnnouncement(`${current.label} 이동을 취소했어요.`)
  }

  function readBounds(container: HTMLDivElement): CatalogCategoryBounds[] {
    const { categories, drinks } = latest.current
    const sections = Array.from(container.querySelectorAll<HTMLElement>('[data-layout-category]'))
    // Read DOM order after projection, not the still-saved catalog order.
    return sections.flatMap(section => {
      const category = categories.find(item => item.id === section.dataset.layoutCategory)
      if (!category) return []
      const rect = section.getBoundingClientRect()
      if (!rect.width || !rect.height) return []
      const zone = Array.from(section.querySelectorAll<HTMLElement>('[data-layout-dropzone]'))
        .find(element => element.dataset.layoutDropzone === category.id)
      const chips = zone ? Array.from(zone.querySelectorAll<HTMLElement>('[data-layout-drink]')) : []
      return [{
        id: category.id,
        rect,
        drinks: chips.flatMap(chip => {
          const id = chip.dataset.layoutDrink
          const bounds = chip.getBoundingClientRect()
          return id && bounds.width && bounds.height && drinks.some(drink => drink.id === id)
            ? [{ id, rect: bounds }] : []
        }),
      }]
    })
  }

  function targetAnnouncement(current: DragSession, next: CatalogDropTarget | null) {
    if (!next) return '목록 안에 놓으면 이동할 수 있어요.'
    const { categories, drinks } = latest.current
    if (next.kind === 'category') {
      const before = categories.find(category => category.id === next.beforeCategoryId)
      return `${current.label}, ${before ? `${before.name} 앞` : '맨 뒤'}으로 이동해요.`
    }
    const category = categories.find(item => item.id === next.categoryId)
    const before = drinks.find(drink => drink.id === next.beforeDrinkId)
    return `${current.label}, ${category?.name ?? ''} ${before ? `${before.name} 앞` : '맨 뒤'}으로 이동해요.`
  }

  function visibleDrinkCategory(container: HTMLDivElement, current: DragSession, point: { x: number; y: number }): DrinkCategoryId | undefined {
    for (const element of document.elementsFromPoint(point.x, point.y)) {
      if (!container.contains(element)) continue
      const surface = element.closest<HTMLElement>('[data-layout-heading], [data-layout-drink], [data-layout-add]')
      if (!surface || surface.dataset.layoutDrink === current.id) continue
      const id = surface.closest<HTMLElement>('[data-layout-category]')?.dataset.layoutCategory
      const category = latest.current.categories.find(item => item.id === id)
      if (category) return category.id
    }
  }

  function publishDrag(current: DragSession, settling = false) {
    const viewport = latest.current.containerRef.current?.getBoundingClientRect()
    setDrag({
      kind: current.kind, id: current.id, label: current.label, x: current.x, y: current.y,
      width: current.width, height: current.height, offsetX: current.offsetX, offsetY: current.offsetY, settling,
      viewportLeft: viewport?.left ?? 0, viewportRight: viewport?.right ?? window.innerWidth,
    })
  }

  function updateView() {
    const current = session.current
    const container = latest.current.containerRef.current
    if (!current?.started || !container || !mounted.current) return
    // A projected layout can move underneath a stationary pointer. Only an
    // intentional pointer move or actual scroll is allowed to propose again.
    const viewport = container.getBoundingClientRect()
    const point = catalogDragPoint(current, viewport)
    const outside = point.x < viewport.left || point.x > viewport.right || point.y < viewport.top || point.y > viewport.bottom
    const moved = catalogDragMoved(
      { x: current.retargetX, y: current.retargetY, scrollTop: current.retargetScrollTop },
      { x: current.x, y: current.y, scrollTop: container.scrollTop },
    )
    // Validate release bounds even for a sub-threshold movement over the edge.
    // A scroll notification after our own rAF sees the same scrollTop and skips.
    if (outside || current.target === null || moved) {
      current.retargetX = current.x
      current.retargetY = current.y
      current.retargetScrollTop = container.scrollTop
      const visibleCategory = current.kind === 'drink' && !outside ? visibleDrinkCategory(container, current, point) : undefined
      const next = outside ? null : catalogStableDropTarget(current.kind, current.id, point, viewport, readBounds(container), current.lastTarget, visibleCategory)
      if (!sameTarget(current.target, next)) {
        current.target = next
        setTarget(next)
        setAnnouncement(targetAnnouncement(current, next))
      }
      if (next && !sameTarget(current.lastTarget, next)) {
        current.lastTarget = next
        setProjection(projectCatalogLayout(current.base.categories, current.base.drinks, current.id, next))
      }
    }
    publishDrag(current)
  }

  function tick(time: number) {
    const current = session.current
    const container = latest.current.containerRef.current
    if (!current?.started || !container) return
    const bounds = container.getBoundingClientRect()
    const elapsed = previousFrame.current === undefined ? 16 : Math.min(32, time - previousFrame.current)
    previousFrame.current = time
    const point = catalogDragPoint(current, bounds)
    const speed = point.x >= bounds.left && point.x <= bounds.right
      ? categoryAutoScrollSpeed(current.y, bounds.top, bounds.bottom) : 0
    if (speed !== 0) {
      const oldScroll = container.scrollTop
      const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight)
      container.scrollTop = Math.max(0, Math.min(maxScroll, oldScroll + speed * elapsed / 16))
      if (oldScroll !== container.scrollTop) updateView()
    }
    frame.current = requestAnimationFrame(tick)
  }

  function updatePointer(event: PointerEvent, capture: boolean) {
    const current = session.current
    if (!current || current.pointerId !== event.pointerId) return
    current.x = event.clientX
    current.y = event.clientY
    if (!current.started) {
      if (Math.hypot(current.x - current.startX, current.y - current.startY) < 6) return
      current.started = true
      // Capture only once dragging starts so a simple grip tap still clicks.
      // The container survives cross-category reparenting of the source handle.
      const container = latest.current.containerRef.current
      if (capture && container) {
        current.captureElement = container
        try { container.setPointerCapture(current.pointerId) }
        catch { current.captureElement = null }
      }
      suppressClickUntil.current = Number.POSITIVE_INFINITY
      setProjection(current.base)
      setTarget(current.target)
      setAnnouncement(`${current.label} 이동을 시작했어요. 놓으면 저장돼요.`)
      frame.current = requestAnimationFrame(tick)
    }
    if (event.cancelable) event.preventDefault()
    updateView()
  }

  function onPointerMove(event: PointerEvent) {
    updatePointer(event, true)
  }

  async function drop() {
    const current = stopResources()
    if (!current?.started) { clearView(); return }
    const { categories, drinks, disabled, onReorderCategories, onMoveDrink } = latest.current
    if (disabled || layoutIdentity(categories, drinks) !== current.layout || !current.target) {
      clearView()
      if (mounted.current) setAnnouncement(`${current.label} 이동을 취소했어요.`)
      return
    }
    const destination = current.target
    let save: () => Promise<boolean>
    if (current.kind === 'category' && destination.kind === 'category') {
      const id = categories.find(category => category.id === current.id)?.id
      if (!id) { clearView(); return }
      const ids = categories.map(category => category.id).filter(value => value !== id)
      const beforeIndex = ids.findIndex(value => value === destination.beforeCategoryId)
      ids.splice(beforeIndex < 0 ? ids.length : beforeIndex, 0, id)
      if (ids.every((value, index) => value === categories[index].id)) {
        clearView()
        setAnnouncement(`${current.label} 순서를 유지했어요.`)
        return
      }
      save = () => onReorderCategories(ids)
    } else if (current.kind === 'drink' && destination.kind === 'drink') {
      const source = drinks.find(drink => drink.id === current.id)
      if (!source) { clearView(); return }
      const siblings = drinks.filter(drink => drink.categoryId === source.categoryId)
      const index = siblings.findIndex(drink => drink.id === current.id)
      if (source.categoryId === destination.categoryId && siblings[index + 1]?.id === destination.beforeDrinkId) {
        clearView()
        setAnnouncement(`${current.label} 위치를 유지했어요.`)
        return
      }
      save = () => onMoveDrink(current.id, destination.categoryId, destination.beforeDrinkId)
    } else { clearView(); return }

    committing.current = true
    publishDrag(current, true)
    try {
      const saved = await save()
      if (mounted.current) setAnnouncement(saved ? `${current.label} 위치를 저장했어요.` : '위치를 저장하지 못했어요. 다시 시도해 주세요.')
    } catch {
      if (mounted.current) setAnnouncement('위치를 저장하지 못했어요. 다시 시도해 주세요.')
    } finally {
      committing.current = false
      clearView()
    }
  }

  function onPointerDown(kind: DragKind, id: string, event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0 || !event.isPrimary || latest.current.disabled || committing.current || session.current) return
    const { categories, drinks, containerRef } = latest.current
    const item = kind === 'category' ? categories.find(category => category.id === id) : drinks.find(drink => drink.id === id)
    if (!containerRef.current || !item) return
    // A category rollback may still be animating around a newly grabbed drink.
    // Clear that ancestor motion before measuring the new gesture's geometry.
    containerRef.current.querySelectorAll<HTMLElement>('.catalog-category-surface').forEach(surface => {
      surface.getAnimations().forEach(animation => animation.cancel())
    })
    const source = event.currentTarget.closest<HTMLElement>(kind === 'category' ? '[data-layout-category]' : '[data-layout-drink]')
    const rect = source?.getBoundingClientRect()
    if (!rect) return
    const sourceDrinks = drinks.filter(drink => drink.categoryId === ('categoryId' in item ? item.categoryId : undefined))
    const sourceIndex = kind === 'category' ? categories.findIndex(category => category.id === id) : sourceDrinks.findIndex(drink => drink.id === id)
    const initialTarget: CatalogDropTarget = kind === 'category'
      ? { kind, beforeCategoryId: categories[sourceIndex + 1]?.id }
      : { kind, categoryId: (item as Drink).categoryId, beforeDrinkId: sourceDrinks[sourceIndex + 1]?.id }
    suppressClickUntil.current = 0
    event.stopPropagation()
    session.current = {
      kind, id, label: item.name, pointerId: event.pointerId, captureElement: null,
      startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY,
      width: rect.width, height: rect.height, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, settling: false,
      started: false, layout: layoutIdentity(categories, drinks), target: initialTarget, lastTarget: initialTarget,
      base: { categories: [...categories], drinks: [...drinks] }, retargetX: event.clientX, retargetY: event.clientY,
      retargetScrollTop: containerRef.current.scrollTop,
    }
  }

  useEffect(() => {
    mounted.current = true
    const container = latest.current.containerRef.current
    const onScroll = () => updateView()
    const onPointerUp = (event: PointerEvent) => {
      const current = session.current
      if (!current || current.pointerId !== event.pointerId) return
      // A fast release can carry the first substantial movement. Process its
      // final coordinates before saving, without capturing an ended pointer.
      updatePointer(event, false)
      void drop()
    }
    const onPointerCancel = (event: PointerEvent) => { if (session.current?.pointerId === event.pointerId) cancel() }
    // Reparenting a badge can retarget the release click to the sheet itself.
    // Consume that click before it reaches a backdrop or a different badge.
    // A fresh pointerdown always starts a new interaction, including outside cards.
    const onNewPointer = () => { if (!session.current) suppressClickUntil.current = 0 }
    const onReleaseClick = (event: MouseEvent) => {
      const pointerClick = event.detail !== 0 || (event instanceof PointerEvent && Boolean(event.pointerType))
      if (pointerClick && performance.now() < suppressClickUntil.current) {
        event.preventDefault()
        event.stopPropagation()
        suppressClickUntil.current = 0
      }
    }
    const onLostCapture = (event: PointerEvent) => {
      const current = session.current
      if (current?.pointerId === event.pointerId && event.target === current.captureElement) cancel()
    }
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !session.current) return
      event.preventDefault()
      event.stopPropagation()
      cancel()
    }
    const onVisibilityChange = () => { if (document.hidden) cancel() }
    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerdown', onNewPointer, true)
    window.addEventListener('click', onReleaseClick, true)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerCancel)
    window.addEventListener('lostpointercapture', onLostCapture)
    window.addEventListener('keydown', onEscape, true)
    window.addEventListener('blur', cancel)
    document.addEventListener('visibilitychange', onVisibilityChange)
    container?.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      mounted.current = false
      stopResources()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onNewPointer, true)
      window.removeEventListener('click', onReleaseClick, true)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerCancel)
      window.removeEventListener('lostpointercapture', onLostCapture)
      window.removeEventListener('keydown', onEscape, true)
      window.removeEventListener('blur', cancel)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      container?.removeEventListener('scroll', onScroll)
    }
    // The single browser subscription reads current options/session through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const layout = layoutIdentity(options.categories, options.drinks)
  useEffect(() => {
    if (session.current && (options.disabled || session.current.layout !== layout)) cancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.disabled, layout])

  function suppressDragClick(event: ReactMouseEvent<HTMLElement>) {
    if (event.detail !== 0 && performance.now() < suppressClickUntil.current) {
      event.preventDefault()
      event.stopPropagation()
      suppressClickUntil.current = 0
    }
  }

  function getHandleProps(kind: DragKind, id: string): ButtonHTMLAttributes<HTMLButtonElement> {
    return {
      style: { touchAction: 'none', userSelect: 'none', minWidth: 44, minHeight: 44 },
      onPointerDown: event => onPointerDown(kind, id, event),
      onClickCapture: suppressDragClick,
      onContextMenu: event => event.preventDefault(),
      onDragStart: event => event.preventDefault(),
    }
  }

  function getCardProps(id: string): HTMLAttributes<HTMLDivElement> {
    return {
      onPointerDown: event => {
        if (event.target instanceof Element && event.target.closest('[data-catalog-no-drag]')) {
          if (!session.current && !committing.current) suppressClickUntil.current = 0
          return
        }
        onPointerDown('drink', id, event)
      },
      onClickCapture: suppressDragClick,
      onContextMenu: event => event.preventDefault(),
      onDragStart: event => event.preventDefault(),
    }
  }

  return { drag, target, announcement, getHandleProps, getCardProps, cancel, previewCategories: projection?.categories ?? options.categories, previewDrinks: projection?.drinks ?? options.drinks }
}
