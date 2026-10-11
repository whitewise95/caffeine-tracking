import { describe, expect, it } from 'vitest'
import { catalogDragMoved, catalogDropTarget, catalogStableDropTarget, projectCatalogLayout, type CatalogCategoryBounds } from './catalogDrag'
import type { Drink, DrinkCategory } from '../model/caffeine.types'

const viewport = { left: 0, right: 390, top: 80, bottom: 600 }
const categories: CatalogCategoryBounds[] = [
  {
    id: 'coffee',
    rect: { left: 20, right: 370, top: 100, bottom: 290 },
    drinks: [
      { id: 'a', rect: { left: 20, right: 140, top: 140, bottom: 190 } },
      { id: 'b', rect: { left: 150, right: 340, top: 140, bottom: 190 } },
      { id: 'c', rect: { left: 20, right: 180, top: 200, bottom: 250 } },
      { id: 'd', rect: { left: 190, right: 370, top: 200, bottom: 250 } },
    ],
  },
  {
    id: 'tea',
    rect: { left: 20, right: 370, top: 310, bottom: 430 },
    drinks: [{ id: 'e', rect: { left: 20, right: 150, top: 350, bottom: 400 } }],
  },
  { id: 'energy', rect: { left: 20, right: 370, top: 450, bottom: 560 }, drinks: [] },
  { id: 'other', rect: { left: 20, right: 370, top: 650, bottom: 740 }, drinks: [] },
]

describe('catalog drag targets', () => {
  it('inserts before or after the pointer-facing half of a variable-width chip', () => {
    expect(catalogDropTarget('drink', 'e', { x: 170, y: 160 }, viewport, categories))
      .toEqual({ kind: 'drink', categoryId: 'coffee', beforeDrinkId: 'b' })
    expect(catalogDropTarget('drink', 'e', { x: 300, y: 160 }, viewport, categories))
      .toEqual({ kind: 'drink', categoryId: 'coffee', beforeDrinkId: 'c' })
  })

  it('keeps wrap rows separate when a pointer is near the left of the second row', () => {
    expect(catalogDropTarget('drink', 'e', { x: 30, y: 220 }, viewport, categories))
      .toEqual({ kind: 'drink', categoryId: 'coffee', beforeDrinkId: 'c' })
    expect(catalogDropTarget('drink', 'e', { x: 365, y: 220 }, viewport, categories))
      .toEqual({ kind: 'drink', categoryId: 'coffee' })
  })

  it('uses vertical gaps to choose the closest wrap row and appends below all rows', () => {
    expect(catalogDropTarget('drink', 'e', { x: 30, y: 197 }, viewport, categories))
      .toEqual({ kind: 'drink', categoryId: 'coffee', beforeDrinkId: 'c' })
    expect(catalogDropTarget('drink', 'e', { x: 30, y: 275 }, viewport, categories))
      .toEqual({ kind: 'drink', categoryId: 'coffee' })
  })

  it('excludes the dragged chip from insertion targets', () => {
    expect(catalogDropTarget('drink', 'b', { x: 160, y: 160 }, viewport, categories))
      .toEqual({ kind: 'drink', categoryId: 'coffee', beforeDrinkId: 'c' })
  })

  it('accepts an empty category and resolves the gap between category sections', () => {
    expect(catalogDropTarget('drink', 'a', { x: 100, y: 500 }, viewport, categories))
      .toEqual({ kind: 'drink', categoryId: 'energy' })
    expect(catalogDropTarget('drink', 'a', { x: 100, y: 305 }, viewport, categories))
      .toEqual({ kind: 'drink', categoryId: 'tea', beforeDrinkId: 'e' })
  })

  it('reorders categories across section midpoints and preserves offscreen siblings', () => {
    expect(catalogDropTarget('category', 'coffee', { x: 120, y: 390 }, viewport, categories))
      .toEqual({ kind: 'category', beforeCategoryId: 'energy' })
    expect(catalogDropTarget('category', 'energy', { x: 120, y: 110 }, viewport, categories))
      .toEqual({ kind: 'category', beforeCategoryId: 'coffee' })
    expect(catalogDropTarget('category', 'coffee', { x: 120, y: 570 }, viewport, categories))
      .toEqual({ kind: 'category', beforeCategoryId: 'other' })
  })

  it('does not target content when the pointer leaves the sheet viewport', () => {
    expect(catalogDropTarget('drink', 'a', { x: 400, y: 160 }, viewport, categories)).toBeNull()
    expect(catalogDropTarget('drink', 'a', { x: 100, y: 605 }, viewport, categories)).toBeNull()
    expect(catalogDropTarget('category', 'coffee', { x: 100, y: 65 }, viewport, categories)).toBeNull()
  })

  it('does not target a fully scrolled out category', () => {
    const scrolled = categories.map(category => ({
      ...category,
      rect: { ...category.rect, top: category.rect.top - 400, bottom: category.rect.bottom - 400 },
      drinks: category.drinks.map(drink => ({ ...drink, rect: { ...drink.rect, top: drink.rect.top - 400, bottom: drink.rect.bottom - 400 } })),
    }))
    expect(catalogDropTarget('drink', 'a', { x: 100, y: 100 }, viewport, scrolled))
      .toEqual({ kind: 'drink', categoryId: 'energy' })
  })
})

describe('live catalog projection', () => {
  const originalCategories: DrinkCategory[] = [
    { id: 'coffee', name: '커피' }, { id: 'tea', name: '차' }, { id: 'energy', name: '에너지' },
  ]
  const originalDrinks: Drink[] = [
    { id: 'a', categoryId: 'coffee', name: 'A', caffeineMg: 10, icon: 'coffee', isCustom: false, sourceType: 'sample' },
    { id: 'b', categoryId: 'coffee', name: 'B', caffeineMg: 20, icon: 'cup', isCustom: false, sourceType: 'sample' },
    { id: 'c', categoryId: 'tea', name: 'C', caffeineMg: 30, icon: 'tea', isCustom: false, sourceType: 'sample' },
  ]

  it('projects a complete category reorder without changing source arrays or drink membership', () => {
    const projection = projectCatalogLayout(originalCategories, originalDrinks, 'tea', { kind: 'category', beforeCategoryId: 'coffee' })
    expect(projection.categories.map(item => item.id)).toEqual(['tea', 'coffee', 'energy'])
    expect(projection.drinks).toEqual(originalDrinks)
    expect(originalCategories.map(item => item.id)).toEqual(['coffee', 'tea', 'energy'])
  })

  it('projects drink reordering and cross-category moves without mutating the saved drink', () => {
    const reordered = projectCatalogLayout(originalCategories, originalDrinks, 'b', { kind: 'drink', categoryId: 'coffee', beforeDrinkId: 'a' })
    expect(reordered.drinks.filter(item => item.categoryId === 'coffee').map(item => item.id)).toEqual(['b', 'a'])
    const moved = projectCatalogLayout(originalCategories, originalDrinks, 'a', { kind: 'drink', categoryId: 'tea', beforeDrinkId: 'c' })
    expect(moved.drinks.filter(item => item.categoryId === 'coffee').map(item => item.id)).toEqual(['b'])
    expect(moved.drinks.filter(item => item.categoryId === 'tea').map(item => item.id)).toEqual(['a', 'c'])
    expect(originalDrinks[0].categoryId).toBe('coffee')
    expect(originalDrinks.map(item => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('projects into empty categories and can revert fully to the original saved snapshot', () => {
    const moved = projectCatalogLayout(originalCategories, originalDrinks, 'a', { kind: 'drink', categoryId: 'energy' })
    expect(moved.drinks.filter(item => item.categoryId === 'energy').map(item => item.id)).toEqual(['a'])
    const reverted = projectCatalogLayout(originalCategories, originalDrinks, 'a', { kind: 'drink', categoryId: 'coffee', beforeDrinkId: 'b' })
    expect(reverted.drinks).toEqual(originalDrinks)
  })

  it('ignores stale drop destinations instead of losing drinks from the rendered catalog', () => {
    expect(projectCatalogLayout(originalCategories, originalDrinks, 'a', { kind: 'drink', categoryId: 'custom:missing' }).drinks).toEqual(originalDrinks)
    expect(projectCatalogLayout(originalCategories, originalDrinks, 'a', { kind: 'drink', categoryId: 'tea', beforeDrinkId: 'missing' }).drinks).toEqual(originalDrinks)
  })

  it('holds the accepted target while the pointer is within the reflowed source placeholder', () => {
    const previous = { kind: 'drink' as const, categoryId: 'coffee' as const, beforeDrinkId: 'b' }
    expect(catalogStableDropTarget('drink', 'a', { x: 138, y: 160 }, viewport, categories, previous)).toEqual(previous)
    expect(catalogStableDropTarget('drink', 'a', { x: 300, y: 160 }, viewport, categories, previous))
      .toEqual({ kind: 'drink', categoryId: 'coffee', beforeDrinkId: 'c' })
  })

  it('prioritizes a visually hit category over a source placeholder beneath its animated heading', () => {
    const previous = { kind: 'drink' as const, categoryId: 'coffee' as const, beforeDrinkId: 'b' }
    expect(catalogStableDropTarget('drink', 'a', { x: 25, y: 160 }, viewport, categories, previous, 'tea'))
      .toEqual({ kind: 'drink', categoryId: 'tea', beforeDrinkId: 'e' })
    expect(catalogStableDropTarget('drink', 'a', { x: -1, y: 160 }, viewport, categories, previous, 'tea')).toBeNull()
  })

  it('allows target changes after leaving a category placeholder but cancels outside the viewport', () => {
    const previous = { kind: 'category' as const, beforeCategoryId: 'tea' as const }
    expect(catalogStableDropTarget('category', 'coffee', { x: 100, y: 285 }, viewport, categories, previous)).toEqual(previous)
    expect(catalogStableDropTarget('category', 'coffee', { x: 100, y: 400 }, viewport, categories, previous))
      .toEqual({ kind: 'category', beforeCategoryId: 'energy' })
    expect(catalogStableDropTarget('category', 'coffee', { x: -10, y: 150 }, viewport, categories, previous)).toBeNull()
  })

  it('retargets a stationary pointer when actual scrolling moves content beneath it', () => {
    expect(catalogDragMoved({ x: 100, y: 200, scrollTop: 0 }, { x: 100, y: 200, scrollTop: 80 })).toBe(true)
    expect(catalogDragMoved({ x: 100, y: 200, scrollTop: 80 }, { x: 100, y: 200, scrollTop: 0 })).toBe(true)
  })

  it('ignores duplicate scroll notifications and stationary releases while honoring deliberate pointer movement', () => {
    const sample = { x: 100, y: 200, scrollTop: 80 }
    expect(catalogDragMoved(sample, { x: 100, y: 200, scrollTop: 80 })).toBe(false)
    expect(catalogDragMoved(sample, { x: 100.5, y: 200.5, scrollTop: 80 })).toBe(false)
    expect(catalogDragMoved(sample, { x: 102, y: 200, scrollTop: 80 })).toBe(true)
  })
})
