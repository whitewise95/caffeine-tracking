import type { DrinkCategoryId } from '../model/caffeine.types'

/** A drag only produces a proposed order. Persistence happens after drop. */
export function moveCategoryToIndex(ids: readonly DrinkCategoryId[], id: DrinkCategoryId, index: number): DrinkCategoryId[] {
  if (!ids.includes(id)) return [...ids]
  const result = ids.filter(value => value !== id)
  result.splice(Math.max(0, Math.min(result.length, index)), 0, id)
  return result
}

/** Midpoints use the scroll content coordinates captured before any transform. */
export function categoryDropIndex(midpoints: readonly number[], sourceIndex: number, center: number): number {
  return midpoints.filter((midpoint, index) => index !== sourceIndex && midpoint < center).length
}

export function categoryAutoScrollSpeed(pointerY: number, top: number, bottom: number): number {
  const edge = Math.min(64, (bottom - top) / 3)
  if (edge <= 0) return 0
  if (pointerY < top + edge) return -10 * Math.min(1, Math.max(0, (top + edge - pointerY) / edge))
  if (pointerY > bottom - edge) return 10 * Math.min(1, Math.max(0, (pointerY - bottom + edge) / edge))
  return 0
}
