import { describe, expect, it } from 'vitest'
import { createInitialState } from './caffeine'
import { addCustomDrink, availableDrinks, categoryNameKey, createDrinkCategory, deleteDrinkCategory, deleteDrinkFromCatalog, drinkCategories, moveDrinkInCatalog, renameDrinkCategory, reorderDrinkCategories, updateDrinkInCatalog } from './drinkCategories'
import type { DrinkCategoryId } from './caffeine.types'

const ids = { drinkId: 'drink-1', categoryId: 'custom:category-1' as const }
const draft = { categoryName: '단백질 쉐이크', name: '초코 쉐이크', caffeineMg: 67, icon: 'cup' as const }

describe('stored drink order', () => {
  it('keeps category order authoritative and applies drink order within each section', () => {
    const state = reorderDrinkCategories(createInitialState(), ['tea', 'coffee', 'energy', 'other'])
    const ordered = { ...state, drinkOrder: ['cola', 'cold-brew', 'oolong-tea', 'americano', 'earl-grey', 'caffe-latte', 'green-tea', 'energy-drink'] }
    expect(availableDrinks(ordered).map(drink => drink.id)).toEqual([
      'oolong-tea', 'earl-grey', 'green-tea', 'cold-brew', 'americano', 'caffe-latte', 'energy-drink', 'cola',
    ])
  })

  it('ignores stale IDs and puts newly added drinks after the saved drinks in their category', () => {
    const ordered = { ...createInitialState(), drinkOrder: ['gone', 'cold-brew', 'americano'] }
    const state = addCustomDrink(ordered, { ...draft, categoryName: '커피' }, ids).state
    expect(availableDrinks(state).filter(drink => drink.categoryId === 'coffee').map(drink => drink.id)).toEqual([
      'cold-brew', 'americano', 'caffe-latte', 'drink-1',
    ])
    expect(availableDrinks(state)).toHaveLength(9)
  })

  it('preserves the legacy global order when no arrangement was saved', () => {
    const state = addCustomDrink(createInitialState(), { ...draft, categoryName: '커피' }, ids).state
    expect(availableDrinks(state).map(drink => drink.id)).toEqual([
      'americano', 'cold-brew', 'caffe-latte', 'green-tea', 'earl-grey', 'oolong-tea', 'energy-drink', 'cola', 'drink-1',
    ])
  })
})

describe('moving individual drinks', () => {
  it('reorders a drink before another and appends when no destination drink is given', () => {
    const state = createInitialState()
    const moved = moveDrinkInCatalog(state, 'caffe-latte', 'coffee', 'americano')
    expect(availableDrinks(moved).filter(drink => drink.categoryId === 'coffee').map(drink => drink.id)).toEqual(['caffe-latte', 'americano', 'cold-brew'])
    const appended = moveDrinkInCatalog(moved, 'caffe-latte', 'coffee')
    expect(availableDrinks(appended).filter(drink => drink.categoryId === 'coffee').map(drink => drink.id)).toEqual(['americano', 'cold-brew', 'caffe-latte'])
    expect(state).toEqual(createInitialState())
  })

  it('moves a default directly into a custom category without changing intake snapshots', () => {
    const state = addCustomDrink(createInitialState(), draft, ids).state
    state.entries = [{ id: 'old-coffee', drinkId: 'americano', drinkName: '아메리카노', caffeineMg: 135, icon: 'coffee', consumedAt: '2026-10-05T01:00:00.000Z', note: '이전 기록' }]
    const snapshot = JSON.stringify(state)
    const moved = moveDrinkInCatalog(state, 'americano', ids.categoryId, ids.drinkId)
    expect(availableDrinks(moved).filter(drink => drink.categoryId === ids.categoryId).map(drink => drink.id)).toEqual(['americano', 'drink-1'])
    expect(availableDrinks(moved).filter(drink => drink.categoryId === 'coffee').map(drink => drink.id)).toEqual(['cold-brew', 'caffe-latte'])
    expect(moved.defaultDrinkCategoryOverrides).toEqual({ americano: ids.categoryId })
    expect(moved.entries).toBe(state.entries)
    expect(JSON.stringify(state)).toBe(snapshot)
  })

  it('moves a custom drink and its photo to an empty category without changing history', () => {
    const photoDataUrl = 'data:image/jpeg;base64,/9j/AA=='
    const created = addCustomDrink(createInitialState(), { ...draft, categoryName: '커피', photoDataUrl }, ids)
    const state = createDrinkCategory(created.state, '빈 분류', 'custom:empty')
    state.entries = [{ id: 'old', drinkId: 'drink-1', drinkName: draft.name, caffeineMg: 60, icon: 'cup', consumedAt: '2026-10-05T01:00:00.000Z' }]
    const moved = moveDrinkInCatalog(state, 'drink-1', 'custom:empty')
    expect(moved.customDrinks).toEqual([{ ...created.drink, categoryId: 'custom:empty' }])
    expect(availableDrinks(moved).filter(drink => drink.categoryId === 'custom:empty').map(drink => drink.id)).toEqual(['drink-1'])
    expect(moved.entries).toBe(state.entries)
    expect(created.drink.categoryId).toBe('coffee')
  })

  it('keeps a moved order when categories are reordered and a new drink is appended', () => {
    const moved = moveDrinkInCatalog(createInitialState(), 'caffe-latte', 'tea', 'earl-grey')
    const reordered = reorderDrinkCategories(moved, ['tea', 'other', 'coffee', 'energy'])
    const state = addCustomDrink(reordered, { ...draft, categoryName: '차' }, ids).state
    expect(availableDrinks(state).map(drink => drink.id)).toEqual([
      'green-tea', 'caffe-latte', 'earl-grey', 'oolong-tea', 'drink-1', 'cola', 'americano', 'cold-brew', 'energy-drink',
    ])
  })

  it('accepts dropping a drink onto itself without changing the state', () => {
    const state = createInitialState()
    expect(moveDrinkInCatalog(state, 'americano', 'coffee', 'americano')).toBe(state)
  })

  it('rejects missing, deleted and mismatched targets without modifying the source', () => {
    const state = deleteDrinkFromCatalog(createInitialState(), 'americano')
    const snapshot = JSON.stringify(state)
    const attempts: [string, DrinkCategoryId, string?][] = [
      ['missing', 'tea'], ['americano', 'tea'], ['cold-brew', 'custom:missing'],
      ['cold-brew', 'tea', 'missing'], ['cold-brew', 'tea', 'americano'],
      ['cold-brew', 'tea', 'caffe-latte'], ['cold-brew', 'tea', 'cold-brew'],
    ]
    for (const [id, categoryId, beforeId] of attempts) expect(() => moveDrinkInCatalog(state, id, categoryId, beforeId)).toThrow()
    expect(JSON.stringify(state)).toBe(snapshot)
  })

  it('removes deleted default and custom drinks from saved order while retaining their records', () => {
    const created = addCustomDrink(createInitialState(), { ...draft, categoryName: '커피' }, ids).state
    created.entries = [{ id: 'old', drinkId: 'drink-1', drinkName: draft.name, caffeineMg: 60, icon: 'cup', consumedAt: '2026-10-05T01:00:00.000Z' }]
    const ordered = { ...created, drinkOrder: ['drink-1', 'americano', 'cold-brew'] }
    const deleted = deleteDrinkFromCatalog(deleteDrinkFromCatalog(ordered, 'drink-1'), 'americano')
    expect(deleted.drinkOrder).toEqual(['cold-brew'])
    expect(deleted.entries).toBe(created.entries)
    expect(deleted.retainedDrinkCategories).toEqual({ 'drink-1': 'coffee' })
  })

  it('cleans up moved drinks and their history when their current category is force deleted', () => {
    const created = addCustomDrink(createInitialState(), { ...draft, categoryName: '커피' }, ids).state
    created.entries = [{ id: 'old', drinkId: 'drink-1', drinkName: draft.name, caffeineMg: 60, icon: 'cup', consumedAt: '2026-10-05T01:00:00.000Z' }]
    const moved = moveDrinkInCatalog(moveDrinkInCatalog(created, 'drink-1', 'tea'), 'americano', 'tea')
    const deleted = deleteDrinkCategory(moved, 'tea', undefined, 'force')
    expect(deleted.drinkOrder).toEqual(['cold-brew', 'caffe-latte', 'energy-drink', 'cola'])
    expect(deleted.entries).toEqual([])
    expect(availableDrinks(deleted).map(drink => drink.id)).toEqual(['cold-brew', 'caffe-latte', 'energy-drink', 'cola'])
  })
})

describe('drink categories', () => {
  it('uses the chosen category ID even when its name has changed', () => {
    const state = renameDrinkCategory(createInitialState(), 'coffee', '원두')
    const result = addCustomDrink(state, { ...draft, categoryId: 'coffee', categoryName: '커피' }, ids)
    expect(result.drink.categoryId).toBe('coffee')
    expect(result.state.customCategories).toHaveLength(0)
    expect(drinkCategories(result.state).find(category => category.id === 'coffee')?.name).toBe('원두')
  })

  it('does not recreate a deleted category when a draft refers to its ID', () => {
    const state = deleteDrinkCategory(createInitialState(), 'coffee', 'tea')
    const before = JSON.stringify(state)
    expect(() => addCustomDrink(state, { ...draft, categoryId: 'coffee', categoryName: '커피' }, ids)).toThrow('카테고리')
    expect(JSON.stringify(state)).toBe(before)
  })

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


describe('forced category deletion', () => {
  it('removes owned drinks, photos and linked records without affecting another category', () => {
    const state = createInitialState()
    state.customDrinks = [
      { id: 'photo-coffee', categoryId: 'coffee', name: '내 커피', caffeineMg: 90, icon: 'cup', sourceType: 'custom', isCustom: true, photoDataUrl: 'data:image/jpeg;base64,/9j/AA==' },
      { id: 'photo-tea', categoryId: 'tea', name: '내 차', caffeineMg: 30, icon: 'tea', sourceType: 'custom', isCustom: true, photoDataUrl: 'data:image/jpeg;base64,/9j/2Q==' },
    ]
    state.deletedDefaultDrinkIds = ['americano']
    state.retainedDrinkPhotos = { 'americano': 'data:image/jpeg;base64,/9j/AA==', 'photo-coffee': 'data:image/jpeg;base64,/9j/AA==', 'photo-tea': 'data:image/jpeg;base64,/9j/2Q==' }
    state.entries = [
      { id: 'hidden-coffee', drinkId: 'americano', drinkName: '아메리카노', caffeineMg: 150, icon: 'coffee', consumedAt: '2026-10-05T01:00:00.000Z' },
      { id: 'custom-coffee', drinkId: 'photo-coffee', drinkName: '내 커피', caffeineMg: 90, icon: 'cup', consumedAt: '2026-10-05T02:00:00.000Z' },
      { id: 'tea', drinkId: 'photo-tea', drinkName: '내 차', caffeineMg: 30, icon: 'tea', consumedAt: '2026-10-05T03:00:00.000Z' },
    ]
    const before = JSON.stringify(state)
    const deleted = deleteDrinkCategory(state, 'coffee', undefined, 'force')
    expect(drinkCategories(deleted).map(category => category.id)).toEqual(['tea', 'energy', 'other'])
    expect(availableDrinks(deleted).some(drink => ['americano', 'cold-brew', 'caffe-latte', 'photo-coffee'].includes(drink.id))).toBe(false)
    expect(deleted.customDrinks.map(drink => drink.id)).toEqual(['photo-tea'])
    expect(deleted.entries.map(entry => entry.id)).toEqual(['tea'])
    expect(deleted.retainedDrinkPhotos).toEqual({ 'photo-tea': 'data:image/jpeg;base64,/9j/2Q==' })
    expect(new Set(deleted.deletedDefaultDrinkIds).size).toBe(deleted.deletedDefaultDrinkIds?.length)
    expect(JSON.stringify(state)).toBe(before)
  })

  it('follows current category assignments after a move rather than original default groups', () => {
    const moved = deleteDrinkCategory(createInitialState(), 'coffee', 'tea')
    moved.entries = [
      { id: 'moved', drinkId: 'americano', drinkName: '아메리카노', caffeineMg: 150, icon: 'coffee', consumedAt: '2026-10-05T01:00:00.000Z' },
      { id: 'energy', drinkId: 'energy-drink', drinkName: '에너지드링크', caffeineMg: 100, icon: 'bolt', consumedAt: '2026-10-05T02:00:00.000Z' },
    ]
    const deleted = deleteDrinkCategory(moved, 'tea', undefined, 'force')
    expect(drinkCategories(deleted).map(category => category.id)).toEqual(['energy', 'other'])
    expect(deleted.defaultDrinkCategoryOverrides).toEqual({})
    expect(deleted.entries.map(entry => entry.id)).toEqual(['energy'])
    expect(availableDrinks(deleted).map(drink => drink.id)).toEqual(['energy-drink', 'cola'])
    expect(() => deleteDrinkCategory(deleted, 'tea', undefined, 'force')).toThrow()
  })

  it('also deletes history and retained photos of a custom drink previously removed from the catalog', () => {
    const created = addCustomDrink(createInitialState(), { ...draft, categoryName: '커피', photoDataUrl: 'data:image/jpeg;base64,/9j/AA==' }, ids)
    created.state.entries = [{ id: 'old', drinkId: 'drink-1', drinkName: '초코 쉐이크', caffeineMg: 67, icon: 'cup', consumedAt: '2026-10-05T01:00:00.000Z' }]
    const hidden = deleteDrinkFromCatalog(created.state, 'drink-1')
    const deleted = deleteDrinkCategory(hidden, 'coffee', undefined, 'force')
    expect(deleted.entries).toEqual([])
    expect(deleted.retainedDrinkPhotos).toEqual({})
  })

  it('can remove the last populated category with no destination or dangling drinks', () => {
    let state = deleteDrinkCategory(createInitialState(), 'coffee', 'tea')
    state = deleteDrinkCategory(state, 'tea', 'energy')
    state = deleteDrinkCategory(state, 'energy', 'other')
    const deleted = deleteDrinkCategory(state, 'other', undefined, 'force')
    expect(drinkCategories(deleted)).toEqual([])
    expect(availableDrinks(deleted)).toEqual([])
  })
})


it('moves archived custom drink ownership so force deleting the destination includes its records', () => {
  const created = addCustomDrink(createInitialState(), { ...draft, categoryName: '커피' }, ids)
  created.state.entries = [{ id: 'old', drinkId: 'drink-1', drinkName: '초코 쉐이크', caffeineMg: 67, icon: 'cup', consumedAt: '2026-10-05T01:00:00.000Z' }]
  const hidden = deleteDrinkFromCatalog(created.state, 'drink-1')
  const moved = deleteDrinkCategory(hidden, 'coffee', 'tea')
  expect(moved.entries).toEqual(created.state.entries)
  expect(moved.retainedDrinkCategories).toEqual({ 'drink-1': 'tea' })
  expect(deleteDrinkCategory(moved, 'tea', undefined, 'force').entries).toEqual([])
})

 it('accepts 500mg and rejects new drinks above the input maximum', () => {
  expect(addCustomDrink(createInitialState(), { ...draft, caffeineMg: 500 }, ids).drink.caffeineMg).toBe(500)
  expect(() => addCustomDrink(createInitialState(), { ...draft, caffeineMg: 501 }, ids)).toThrow('0~500mg')
})


describe('editing catalog drink details', () => {
  it('edits a moved default while preserving its identity, order and intake snapshots', () => {
    const state = moveDrinkInCatalog(createInitialState(), 'americano', 'tea', 'earl-grey')
    state.entries = [{ id: 'old', drinkId: 'americano', drinkName: '아메리카노', caffeineMg: 150, icon: 'coffee', consumedAt: '2026-10-05T01:00:00.000Z' }]
    const snapshot = JSON.stringify(state)
    const updated = updateDrinkInCatalog(state, 'americano', { name: ' 내 커피 ', icon: 'cup', caffeineMg: 95 })
    expect(availableDrinks(updated).find(drink => drink.id === 'americano')).toMatchObject({ id: 'americano', categoryId: 'tea', name: '내 커피', icon: 'cup', caffeineMg: 95, sourceType: 'custom', isCustom: false })
    expect(updated.entries).toBe(state.entries)
    expect(updated.drinkOrder).toEqual(state.drinkOrder)
    expect(JSON.stringify(state)).toBe(snapshot)
  })

  it('updates a custom drink and can replace its photo with an icon', () => {
    const state = addCustomDrink(createInitialState(), { ...draft, photoDataUrl: 'data:image/jpeg;base64,/9j/AA==' }, ids).state
    const updated = updateDrinkInCatalog(state, ids.drinkId, { name: '새 이름', caffeineMg: 0, icon: 'tea' })
    expect(updated.customDrinks[0]).toMatchObject({ id: ids.drinkId, categoryId: ids.categoryId, name: '새 이름', caffeineMg: 0, icon: 'tea', isCustom: true })
    expect(updated.customDrinks[0].photoDataUrl).toBeUndefined()
    expect(state.customDrinks[0].photoDataUrl).toBeDefined()
  })

  it.each([
    { name: ' ', icon: 'cup', caffeineMg: 50 },
    { name: '가'.repeat(31), icon: 'cup', caffeineMg: 50 },
    { name: '콜드브루', icon: 'cup', caffeineMg: 50 },
    { name: '내 커피', icon: 'unknown', caffeineMg: 50 },
    { name: '내 커피', icon: 'cup', caffeineMg: -1 },
    { name: '내 커피', icon: 'cup', caffeineMg: 501 },
    { name: '내 커피', icon: 'cup', caffeineMg: 1.5 },
    { name: '내 커피', icon: 'cup', caffeineMg: NaN },
    { name: '내 커피', icon: 'cup', caffeineMg: 50, photoDataUrl: 'https://example.com/photo.png' },
  ])('rejects invalid or duplicate edits atomically: %j', input => {
    const state = createInitialState()
    expect(() => updateDrinkInCatalog(state, 'americano', input as Parameters<typeof updateDrinkInCatalog>[2])).toThrow()
    expect(state).toEqual(createInitialState())
  })

  it('rejects editing a removed or missing drink', () => {
    const state = deleteDrinkFromCatalog(createInitialState(), 'americano')
    expect(() => updateDrinkInCatalog(state, 'americano', { name: '커피', icon: 'cup', caffeineMg: 50 })).toThrow()
    expect(() => updateDrinkInCatalog(state, 'missing', { name: '커피', icon: 'cup', caffeineMg: 50 })).toThrow()
  })
})
