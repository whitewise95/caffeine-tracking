import { describe, expect, it } from 'vitest'
import { createInitialState } from './caffeine'
import { CatalogDraft } from './catalogDraft'
import { addCustomDrink, availableDrinks, createDrinkCategory, deleteDrinkFromCatalog, moveDrinkInCatalog, renameDrinkCategory } from './drinkCategories'

describe('catalog editing session', () => {
  it('previews changes without mutating the original and can reset them', () => {
    const original = createInitialState()
    const draft = new CatalogDraft(original)
    draft.stage(state => moveDrinkInCatalog(state, 'americano', 'tea'))
    draft.stage(state => renameDrinkCategory(state, 'tea', '내 차'))
    expect(availableDrinks(original).find(item => item.id === 'americano')?.categoryId).toBe('coffee')
    expect(availableDrinks(draft.state).find(item => item.id === 'americano')?.categoryId).toBe('tea')
    expect(draft.changed).toBe(true)
    draft.reset()
    expect(draft.state).toBe(original)
    expect(draft.changed).toBe(false)
    expect(draft.snapshot()(original)).toBe(original)
  })

  it('applies category and drink creation/deletion together while keeping newer records and settings', () => {
    const original = createInitialState()
    const draft = new CatalogDraft(original)
    draft.stage(state => createDrinkCategory(state, '내 음료', 'custom:new'))
    draft.stage(state => addCustomDrink(state, { name: '새 커피', categoryId: 'custom:new', categoryName: '내 음료', icon: 'cup', caffeineMg: 80 }, { drinkId: 'new-drink', categoryId: 'custom:unused' }).state)
    draft.stage(state => deleteDrinkFromCatalog(state, 'americano'))
    const entry = { id: 'new-record', drinkId: 'americano', drinkName: '기록 당시 이름', caffeineMg: 150, consumedAt: '2026-10-12T01:00:00Z', icon: 'coffee' as const }
    const latest = { ...original, entries: [entry], settings: { ...original.settings, bedtime: '23:15' } }
    const saved = draft.snapshot()(latest)
    expect(saved.entries).toEqual([entry])
    expect(saved.settings.bedtime).toBe('23:15')
    expect(saved.customDrinks[0].name).toBe('새 커피')
    expect(saved.deletedDefaultDrinkIds).toContain('americano')
    expect(latest.customDrinks).toHaveLength(0)
  })

  it('captures a stable commit before reset and leaves the session unchanged on validation failure', () => {
    const original = createInitialState()
    const draft = new CatalogDraft(original)
    draft.stage(state => renameDrinkCategory(state, 'coffee', '내 커피'))
    const before = draft.state
    expect(() => draft.stage(state => moveDrinkInCatalog(state, 'missing', 'tea'))).toThrow()
    expect(draft.state).toBe(before)
    const commit = draft.snapshot()
    draft.reset()
    expect(commit(original).categoryCatalog?.[0].name).toBe('내 커피')
  })
})
