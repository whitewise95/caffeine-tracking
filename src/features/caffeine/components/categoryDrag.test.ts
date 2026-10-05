import { describe, expect, it } from 'vitest'
import { categoryAutoScrollSpeed, categoryDropIndex, moveCategoryToIndex } from './categoryDrag'
import type { DrinkCategoryId } from '../model/caffeine.types'

describe('category drag proposals', () => {
  const ids: DrinkCategoryId[] = ['coffee', 'tea', 'energy', 'other']

  it('moves stable IDs without changing the source array', () => {
    expect(moveCategoryToIndex(ids, 'coffee', 2)).toEqual(['tea', 'energy', 'coffee', 'other'])
    expect(ids).toEqual(['coffee', 'tea', 'energy', 'other'])
    expect(moveCategoryToIndex(ids, 'energy', 0)).toEqual(['energy', 'coffee', 'tea', 'other'])
  })

  it('clamps a drop beyond either edge and ignores missing IDs', () => {
    expect(moveCategoryToIndex(ids, 'tea', -1)).toEqual(['tea', 'coffee', 'energy', 'other'])
    expect(moveCategoryToIndex(ids, 'tea', 20)).toEqual(['coffee', 'energy', 'other', 'tea'])
    expect(moveCategoryToIndex(ids, 'custom:missing', 0)).toEqual(ids)
  })

  it('finds insertion position from other row centers, excluding the dragged row', () => {
    const centers = [40, 120, 200, 280]
    expect(categoryDropIndex(centers, 1, 120)).toBe(1)
    expect(categoryDropIndex(centers, 1, 201)).toBe(2)
    expect(categoryDropIndex(centers, 1, 39)).toBe(0)
    expect(categoryDropIndex(centers, 1, 500)).toBe(3)
  })

  it('uses scroll content coordinates for variable-height rows', () => {
    const centers = [164, 300, 492]
    expect(categoryDropIndex(centers, 0, 350)).toBe(1)
    expect(categoryDropIndex(centers, 0, 493)).toBe(2)
  })

  it('scrolls at edges only and caps speed outside the viewport', () => {
    expect(categoryAutoScrollSpeed(250, 100, 500)).toBe(0)
    expect(categoryAutoScrollSpeed(110, 100, 500)).toBeLessThan(0)
    expect(categoryAutoScrollSpeed(490, 100, 500)).toBeGreaterThan(0)
    expect(categoryAutoScrollSpeed(-500, 100, 500)).toBe(-10)
    expect(categoryAutoScrollSpeed(900, 100, 500)).toBe(10)
    expect(categoryAutoScrollSpeed(100, 100, 100)).toBe(0)
  })
})
