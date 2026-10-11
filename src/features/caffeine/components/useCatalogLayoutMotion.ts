import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

interface Position { left: number; top: number }

/** Animate the inner surfaces; drop-target wrappers always expose their final layout bounds. */
export function useCatalogLayoutMotion(containerRef: RefObject<HTMLDivElement>, layout: string, kind?: 'category' | 'drink', activeId?: string, settling = false) {
  const previous = useRef(new Map<string, Position>())
  const previousKind = useRef(kind)
  const animations = useRef(new Map<string, Animation>())

  useEffect(() => {
    const running = animations.current
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
    const cancel = () => { running.forEach(animation => animation.cancel()); running.clear() }
    const changed = () => { if (reducedMotion.matches) cancel() }
    reducedMotion.addEventListener('change', changed)
    return () => { reducedMotion.removeEventListener('change', changed); cancel() }
  }, [])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const running = animations.current
    const next = new Map<string, Position>()
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const motionKind = kind ?? previousKind.current
    const nodes = container.querySelectorAll<HTMLElement>('[data-layout-category], [data-layout-drink], [data-layout-heading], [data-layout-add]')
    for (const [key, animation] of running) {
      const relevant = motionKind === 'category' ? key.startsWith('category:') : !key.startsWith('category:')
      if (reduced || !relevant || key === `${kind}:${activeId}`) {
        animation.cancel()
        running.delete(key)
      }
    }

    // Measure the entire layout before starting any parent animation. When an
    // earlier category animation is still running, remove its visual translation
    // from descendant coordinates so the next drag uses neutral layout bounds.
    const measurements = []
    for (const node of nodes) {
      const type = node.dataset.layoutCategory ? 'category' : node.dataset.layoutDrink ? 'drink' : node.dataset.layoutHeading ? 'heading' : 'add'
      const id = node.dataset.layoutCategory ?? node.dataset.layoutDrink ?? node.dataset.layoutHeading ?? node.dataset.layoutAdd!
      const key = `${type}:${id}`
      const rect = node.getBoundingClientRect()
      const ancestor = node.closest<HTMLElement>('.catalog-category-surface')
      const inherited = new DOMMatrixReadOnly(ancestor ? getComputedStyle(ancestor).transform : undefined)
      const position = { left: rect.left - inherited.m41, top: rect.top + container.scrollTop - inherited.m42 }
      next.set(key, position)
      measurements.push({ node, type, id, key, position })
    }

    for (const { node, type, id, key, position } of measurements) {
      const old = previous.current.get(key)
      const surface = node.firstElementChild as HTMLElement | null
      const relevant = motionKind === 'category' ? type === 'category' : type !== 'category'
      if (!surface || !old || !relevant || reduced || (type === kind && id === activeId && !settling)) continue
      const dx = old.left - position.left
      const dy = old.top - position.top
      if (Math.abs(dx) < .5 && Math.abs(dy) < .5) continue
      // A quick reversal begins at the current visual position of an unfinished animation.
      const transform = new DOMMatrixReadOnly(getComputedStyle(surface).transform)
      running.get(key)?.cancel()
      const animation = surface.animate([
        { transform: `translate(${dx + transform.m41}px, ${dy + transform.m42}px)` },
        { transform: 'translate(0px, 0px)' },
      ], { duration: 160, easing: 'cubic-bezier(.2,.8,.2,1)' })
      running.set(key, animation)
      void animation.finished.then(() => { if (running.get(key) === animation) running.delete(key) }).catch(() => {})
    }
    previous.current = next
    previousKind.current = kind
  }, [containerRef, layout, kind, activeId, settling])
}
