import { describe, expect, it } from 'vitest'
import { createInitialState } from './caffeine'
import { addCustomDrink, availableDrinks, categoryNameKey, createDrinkCategory, deleteDrinkCategory, deleteDrinkFromCatalog, drinkCategories, renameDrinkCategory, reorderDrinkCategories } from './drinkCategories'
import type { DrinkCategoryId } from './caffeine.types'

const ids = { drinkId: 'drink-1', categoryId: 'custom:category-1' as const }
const draft = { categoryName: '단백질 쉐이크', name: '초코 쉐이크', caffeineMg: 67, icon: 'cup' as const }

describe('drink categories', () => {
  it.each([' 단 백 질쉐 이크 ', '단백질\t쉐이크\n', '단백질\u00a0쉐이크', '단백질\u3000쉐이크'])('ignores whitespace when comparing %s', name => {
    expect(categoryNameKey(name)).toBe(categoryNameKey('단백질 쉐이크'))
  })

  it('keeps punctuation meaningful and canonical Korean text equivalent', () => {
    expect(categoryNameKey('차·커피')).not.toBe(categoryNameKey('차커피'))
    expect(categoryNameKey('커피'.normalize('NFD'))).toBe(categoryNameKey('커피'))
  })

  it('adds a category and its first drink together without mutating the previous state', () => {
    const previous = createInitialState()
    const result = addCustomDrink(previous, draft, ids)
    expect(result.state.customCategories).toEqual([{ id: ids.categoryId, name: draft.categoryName }])
    expect(result.drink).toMatchObject({ id: ids.drinkId, categoryId: ids.categoryId, caffeineMg: 67 })
    expect(result.state.customDrinks).toEqual([result.drink])
    expect(previous.customDrinks).toEqual([])
    expect(previous.customCategories).toEqual([])
  })

  it('reuses built-in and saved category identities regardless of whitespace', () => {
    const first = addCustomDrink(createInitialState(), draft, ids)
    const second = addCustomDrink(first.state, { ...draft, name: '커피 쉐이크', categoryName: '단 백질쉐 이크' }, { drinkId: 'drink-2', categoryId: 'custom:unused' })
    expect(second.state.customCategories).toEqual(first.state.customCategories)
    expect(second.drink.categoryId).toBe(ids.categoryId)
    const builtin = addCustomDrink(second.state, { ...draft, name: '내 커피', categoryName: ' 커 피 ' }, { drinkId: 'drink-3', categoryId: 'custom:unused' })
    expect(builtin.drink.categoryId).toBe('coffee')
    expect(builtin.state.customCategories).toHaveLength(1)
  })

  it.each(['', ' ', '\t\n', '\u00a0\u3000', '\u200b'])('rejects empty category %j', categoryName => {
    expect(() => addCustomDrink(createInitialState(), { ...draft, categoryName }, ids)).toThrow('카테고리')
  })

  it('rejects duplicate drinks after resolving category names without changing the state', () => {
    const first = addCustomDrink(createInitialState(), draft, ids)
    expect(() => addCustomDrink(first.state, { ...draft, categoryName: '단백질쉐이크' }, { drinkId: 'drink-2', categoryId: 'custom:unused' })).toThrow('이미')
    expect(first.state.customCategories).toHaveLength(1)
    expect(first.state.customDrinks).toHaveLength(1)
  })
})

it('preserves a selected local photo when creating its drink', () => {
  const photoDataUrl = 'data:image/jpeg;base64,/9j/AA=='
  const result = addCustomDrink(createInitialState(), { ...draft, photoDataUrl }, ids)
  expect(result.drink).toHaveProperty('photoDataUrl', photoDataUrl)
})

describe('drink deletion', () => {
  it('removes only the requested custom drink and retains records, categories and unrelated photos', () => {
    const first = addCustomDrink(createInitialState(), { ...draft, photoDataUrl: 'data:image/jpeg;base64,/9j/AA==' }, ids)
    const second = addCustomDrink(first.state, { ...draft, name: '다른 음료', photoDataUrl: 'data:image/jpeg;base64,/9j/2Q==' }, { ...ids, drinkId: 'drink-2' })
    second.state.entries = [{ id: 'entry-1', drinkId: ids.drinkId, drinkName: draft.name, caffeineMg: 67, icon: draft.icon, consumedAt: '2026-10-05T01:00:00.000Z' }]
    const snapshot = JSON.stringify(second.state)
    const deleted = deleteDrinkFromCatalog(second.state, ids.drinkId)
    expect(deleted.customDrinks).toEqual([second.drink])
    expect(deleted.entries).toEqual(second.state.entries)
    expect(deleted.customCategories).toEqual(second.state.customCategories)
    expect(JSON.stringify(second.state)).toBe(snapshot)
  })

  it('removes a default drink from the device catalog without changing recorded intake', () => {
    const state = createInitialState()
    state.entries = [{ id: 'tea-record', drinkId: 'earl-grey', drinkName: '얼그레이', caffeineMg: 45, icon: 'tea', consumedAt: '2026-10-05T01:00:00.000Z' }]
    const snapshot = JSON.stringify(state)
    const deleted = deleteDrinkFromCatalog(state, 'earl-grey')
    expect(deleted).toMatchObject({ deletedDefaultDrinkIds: ['earl-grey'] })
    expect(deleted.entries).toEqual(state.entries)
    expect(deleted.customDrinks).toEqual(state.customDrinks)
    expect(JSON.stringify(state)).toBe(snapshot)
  })

  it('allows a custom replacement with the name of a deleted default drink', () => {
    const state = deleteDrinkFromCatalog(createInitialState(), 'americano')
    const result = addCustomDrink(state, { ...draft, categoryName: '커피', name: '아메리카노' }, ids)
    expect(result.drink.name).toBe('아메리카노')
    expect(result.state.customDrinks).toEqual([result.drink])
  })

  it.each(['missing'])('rejects deletion of a missing drink %s', id => {
    const state = createInitialState()
    expect(() => deleteDrinkFromCatalog(state, id)).toThrow()
    expect(state).toEqual(createInitialState())
  })
})

describe('category management', () => {
  it('uses an explicit catalog for names and order and does not restore deleted categories', () => {
    const state = { ...createInitialState(), categoryCatalog: [{ id: 'tea' as const, name: '나의 차' }, { id: 'coffee' as const, name: '원두' }] }
    expect(drinkCategories(state)).toEqual([{ id: 'tea', name: '나의 차' }, { id: 'coffee', name: '원두' }])
  })

  it('creates an empty category at the end and renames built-in and custom categories without changing their identities', () => {
    const previous = createInitialState()
    const created = createDrinkCategory(previous, '  쉐이크  ', 'custom:shake')
    const renamed = renameDrinkCategory(renameDrinkCategory(created, 'coffee', '원두 음료'), 'custom:shake', '운동 음료')
    expect(drinkCategories(renamed).map(category => [category.id, category.name])).toEqual([
      ['coffee', '원두 음료'], ['tea', '차'], ['energy', '에너지음료'], ['other', '탄산'], ['custom:shake', '운동 음료'],
    ])
    expect(renamed.customCategories).toEqual([{ id: 'custom:shake', name: '운동 음료' }])
    expect(availableDrinks(renamed).find(drink => drink.id === 'americano')?.categoryId).toBe('coffee')
    expect(previous).toEqual(createInitialState())
  })

  it.each(['', ' \t\u200b ', '가'.repeat(31), ' 커 피 ', '커피'.normalize('NFD')])('rejects blank, overlong and equivalent duplicate category names: %j', name => {
    const state = createInitialState()
    expect(() => createDrinkCategory(state, name, 'custom:new')).toThrow()
    expect(() => renameDrinkCategory(state, 'tea', name)).toThrow()
    expect(state).toEqual(createInitialState())
  })

  it('rejects reused category IDs and missing rename targets while allowing a normalized self-rename', () => {
    const state = createDrinkCategory(createInitialState(), '내 차', 'custom:tea')
    expect(() => createDrinkCategory(state, '다른 이름', 'custom:tea')).toThrow()
    expect(() => renameDrinkCategory(state, 'custom:missing', '이름')).toThrow()
    expect(drinkCategories(renameDrinkCategory(state, 'coffee', ' 커 피 '))[0]).toEqual({ id: 'coffee', name: '커 피' })
  })

  it('adds new drinks to the current catalog after a built-in rename, preserving category order', () => {
    const renamed = renameDrinkCategory(createInitialState(), 'coffee', '원두')
    const first = addCustomDrink(renamed, { ...draft, categoryName: '원 두' }, ids)
    expect(first.drink.categoryId).toBe('coffee')
    expect(drinkCategories(first.state)).toHaveLength(4)
    const second = addCustomDrink(first.state, { ...draft, categoryName: '커피', name: '새 커피' }, { drinkId: 'drink-2', categoryId: 'custom:coffee' })
    expect(second.drink.categoryId).toBe('custom:coffee')
    expect(drinkCategories(second.state).at(-1)).toEqual({ id: 'custom:coffee', name: '커피' })
  })

  it('deletes an empty category without a destination', () => {
    const state = createDrinkCategory(createInitialState(), '빈 카테고리', 'custom:empty')
    const deleted = deleteDrinkCategory(state, 'custom:empty')
    expect(drinkCategories(deleted).map(category => category.id)).toEqual(['coffee', 'tea', 'energy', 'other'])
    expect(deleted.customCategories).toEqual([])
  })

  it('requires another existing destination when deleting a populated category', () => {
    const state = createInitialState()
    for (const destination of [undefined, 'coffee', 'custom:missing'] as const) {
      expect(() => deleteDrinkCategory(state, 'coffee', destination)).toThrow()
    }
    expect(() => deleteDrinkCategory(state, 'custom:missing', 'tea')).toThrow()
    expect(state).toEqual(createInitialState())
  })

  it('moves all visible drinks atomically while preserving photos, history and hidden default drinks', () => {
    const photoDataUrl = 'data:image/jpeg;base64,/9j/AA=='
    const created = addCustomDrink(createInitialState(), { ...draft, categoryName: '커피', photoDataUrl }, ids)
    const previous = deleteDrinkFromCatalog(created.state, 'americano')
    previous.entries = [{ id: 'old', drinkId: 'americano', drinkName: '아메리카노', caffeineMg: 150, icon: 'coffee', consumedAt: '2026-10-05T01:00:00.000Z' }]
    const snapshot = JSON.stringify(previous)
    const deleted = deleteDrinkCategory(previous, 'coffee', 'tea')
    expect(drinkCategories(deleted).map(category => category.id)).toEqual(['tea', 'energy', 'other'])
    expect(availableDrinks(deleted).some(drink => drink.categoryId === 'coffee' || drink.id === 'americano')).toBe(false)
    expect(availableDrinks(deleted).filter(drink => ['cold-brew', 'caffe-latte', 'drink-1'].includes(drink.id)).map(drink => drink.categoryId)).toEqual(['tea', 'tea', 'tea'])
    expect(deleted.customDrinks[0].photoDataUrl).toBe(photoDataUrl)
    expect(deleted.deletedDefaultDrinkIds).toEqual(['americano'])
    expect(deleted.entries).toBe(previous.entries)
    expect(JSON.stringify(previous)).toBe(snapshot)
  })

  it('moves defaults again when deleting their previous destination', () => {
    const moved = deleteDrinkCategory(createInitialState(), 'coffee', 'tea')
    const movedAgain = deleteDrinkCategory(moved, 'tea', 'other')
    expect(availableDrinks(movedAgain).filter(drink => drink.id !== 'energy-drink').every(drink => drink.categoryId === 'other')).toBe(true)
    expect(drinkCategories(movedAgain).map(category => category.id)).toEqual(['energy', 'other'])
  })

  it('deletes an empty built-in category after all its drinks are hidden without reviving them', () => {
    const hidden = deleteDrinkFromCatalog(createInitialState(), 'cola')
    const deleted = deleteDrinkCategory(hidden, 'other')
    expect(drinkCategories(deleted).some(category => category.id === 'other')).toBe(false)
    expect(availableDrinks(deleted).some(drink => drink.id === 'cola')).toBe(false)
  })

  it('accepts only an exact permutation when reordering categories', () => {
    const state = createDrinkCategory(createInitialState(), '쉐이크', 'custom:shake')
    const reordered = reorderDrinkCategories(state, ['custom:shake', 'other', 'energy', 'tea', 'coffee'])
    expect(drinkCategories(reordered).map(category => category.id)).toEqual(['custom:shake', 'other', 'energy', 'tea', 'coffee'])
    const invalidOrders: DrinkCategoryId[][] = [[], ['coffee', 'tea', 'energy', 'other'], ['coffee', 'coffee', 'energy', 'other', 'custom:shake'], ['coffee', 'tea', 'energy', 'other', 'custom:missing']]
    for (const order of invalidOrders) expect(() => reorderDrinkCategories(state, order)).toThrow()
    expect(drinkCategories(state).map(category => category.id)).toEqual(['coffee', 'tea', 'energy', 'other', 'custom:shake'])
  })
})
