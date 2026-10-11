import type { Drink, DrinkCategory, DrinkCategoryId } from '../model/caffeine.types'

export interface CatalogRect {
  left: number
  right: number
  top: number
  bottom: number
}

export interface CatalogCategoryBounds {
  id: DrinkCategoryId
  rect: CatalogRect
  drinks: { id: string; rect: CatalogRect }[]
}

export type CatalogDropTarget =
  | { kind: 'category'; beforeCategoryId?: DrinkCategoryId }
  | { kind: 'drink'; categoryId: DrinkCategoryId; beforeDrinkId?: string }

export interface CatalogProjection {
  categories: DrinkCategory[]
  drinks: Drink[]
}

interface CatalogPointerSample { x: number; y: number; scrollTop: number }

/** The preview stays inside the list horizontally, so its drop point must too. */
export function catalogDragPoint(point: { x: number; y: number }, viewport: Pick<CatalogRect, 'left' | 'right'>) {
  return { x: Math.max(viewport.left, Math.min(viewport.right, point.x)), y: point.y }
}

/** Reflow and duplicate scroll events alone must never move the proposal. */
export function catalogDragMoved(previous: CatalogPointerSample, current: CatalogPointerSample): boolean {
  return previous.scrollTop !== current.scrollTop || Math.hypot(current.x - previous.x, current.y - previous.y) >= 2
}

/** Build a reversible display proposal; the saved catalog is never mutated. */
export function projectCatalogLayout(
  categories: readonly DrinkCategory[], drinks: readonly Drink[], id: string, target: CatalogDropTarget,
): CatalogProjection {
  const unchanged = { categories: [...categories], drinks: [...drinks] }
  if (target.kind === 'category') {
    const source = categories.find(category => category.id === id)
    if (!source || target.beforeCategoryId === id) return unchanged
    const result = categories.filter(category => category.id !== id)
    const index = target.beforeCategoryId === undefined ? result.length : result.findIndex(category => category.id === target.beforeCategoryId)
    if (index < 0) return unchanged
    result.splice(index, 0, source)
    return { categories: result, drinks: [...drinks] }
  }
  const source = drinks.find(drink => drink.id === id)
  if (!source || target.beforeDrinkId === id || !categories.some(category => category.id === target.categoryId)) return unchanged
  const result = drinks.filter(drink => drink.id !== id)
  let index: number
  if (target.beforeDrinkId !== undefined) {
    index = result.findIndex(drink => drink.id === target.beforeDrinkId && drink.categoryId === target.categoryId)
    if (index < 0) return unchanged
  } else {
    let last = -1
    result.forEach((drink, position) => { if (drink.categoryId === target.categoryId) last = position })
    index = last < 0 ? result.length : last + 1
  }
  result.splice(index, 0, source.categoryId === target.categoryId ? source : { ...source, categoryId: target.categoryId })
  return { categories: [...categories], drinks: result }
}

/** A moved placeholder owns its area until the pointer clearly leaves it. */
export function catalogStableDropTarget(
  kind: 'category' | 'drink', id: string, point: { x: number; y: number }, viewport: CatalogRect,
  categories: readonly CatalogCategoryBounds[], previous: CatalogDropTarget,
  visibleCategoryId?: DrinkCategoryId,
): CatalogDropTarget | null {
  if (point.x < viewport.left || point.x > viewport.right || point.y < viewport.top || point.y > viewport.bottom) return null
  const sourceCategory = categories.find(category => category.drinks.some(drink => drink.id === id))
  // An animated heading can overlap the hidden source's neutral layout box.
  // The category actually visible under the pointer wins that cross-category hit.
  if (kind === 'drink' && visibleCategoryId && visibleCategoryId !== sourceCategory?.id && categories.some(category => category.id === visibleCategoryId)) {
    return catalogDropTarget(kind, id, point, viewport, categories, visibleCategoryId)
  }
  const source = kind === 'category'
    ? categories.find(category => category.id === id)?.rect
    : categories.flatMap(category => category.drinks).find(drink => drink.id === id)?.rect
  const margin = 5
  if (source && point.x >= source.left - margin && point.x <= source.right + margin && point.y >= source.top - margin && point.y <= source.bottom + margin) return previous
  return catalogDropTarget(kind, id, point, viewport, categories, visibleCategoryId)
}

export function catalogDropTarget(
  kind: 'category' | 'drink',
  id: string,
  point: { x: number; y: number },
  viewport: CatalogRect,
  categories: readonly CatalogCategoryBounds[],
  visibleCategoryId?: DrinkCategoryId,
): CatalogDropTarget | null {
  if (point.x < viewport.left || point.x > viewport.right || point.y < viewport.top || point.y > viewport.bottom) return null
  const visible = categories.filter(category => category.rect.bottom > viewport.top && category.rect.top < viewport.bottom)
  if (!visible.length) return null

  if (kind === 'category') {
    // Keep offscreen siblings in this search so the last visible position does
    // not accidentally append the category after content below the viewport.
    const before = categories.find(category => category.id !== id && point.y < (category.rect.top + category.rect.bottom) / 2)
    return before ? { kind, beforeCategoryId: before.id } : { kind }
  }

  const distance = (rect: CatalogRect) => Math.max(rect.top - point.y, point.y - rect.bottom, 0)
  const category = categories.find(item => item.id === visibleCategoryId)
    ?? visible.reduce((closest, item) => distance(item.rect) < distance(closest.rect) ? item : closest)
  const drinks = category.drinks.filter(drink => drink.id !== id)
  const target: CatalogDropTarget = { kind, categoryId: category.id }
  if (!drinks.length) return target

  // Group the live flex layout into rows. Horizontal distance must never choose
  // an item on a different wrap row.
  const rows: { top: number; bottom: number; drinks: typeof drinks }[] = []
  for (const drink of drinks) {
    const last = rows[rows.length - 1]
    if (!last || drink.rect.top >= last.bottom - 1) {
      rows.push({ top: drink.rect.top, bottom: drink.rect.bottom, drinks: [drink] })
    } else {
      last.top = Math.min(last.top, drink.rect.top)
      last.bottom = Math.max(last.bottom, drink.rect.bottom)
      last.drinks.push(drink)
    }
  }
  if (point.y < rows[0].top) return { ...target, beforeDrinkId: drinks[0].id }
  if (point.y > rows[rows.length - 1].bottom) return target
  const rowIndex = rows.findIndex((row, index) => !rows[index + 1] || point.y < (row.bottom + rows[index + 1].top) / 2)
  const row = rows[rowIndex]
  const before = row.drinks.find(drink => point.x < (drink.rect.left + drink.rect.right) / 2) ?? rows[rowIndex + 1]?.drinks[0]
  return before ? { ...target, beforeDrinkId: before.id } : target
}
