import { describe, expect, it } from 'vitest'
import { createInitialState } from '../model/caffeine'
import type { CaffeineState } from '../model/caffeine.types'
import { LocalCaffeineRepository, CAFFEINE_STORAGE_KEY } from './LocalCaffeineRepository'
import type { CaffeineStorage } from './CaffeineRepository'
import { addCustomDrink, availableDrinks, createDrinkCategory, deleteDrinkCategory, deleteDrinkFromCatalog, drinkCategories, renameDrinkCategory, reorderDrinkCategories } from '../model/drinkCategories'

class MemoryStorage implements CaffeineStorage {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

function populatedState(): CaffeineState {
  return {
    ...createInitialState(),
    entries: [{ id: 'entry-1', drinkId: 'custom-1', drinkName: '내 라떼', caffeineMg: 95, consumedAt: '2026-10-02T05:00:00.000Z', icon: 'cup' }],
    customDrinks: [{ id: 'custom-1', categoryId: 'coffee', name: '내 라떼', caffeineMg: 90, icon: 'cup', servingMl: 350, sourceType: 'custom', isCustom: true }],
  }
}

describe('LocalCaffeineRepository', () => {
  it('keeps default drink deletions across save and reload and resets them with app data', async () => {
    const storage = new MemoryStorage()
    const repository = new LocalCaffeineRepository(storage)
    const state = { ...populatedState(), deletedDefaultDrinkIds: ['earl-grey'] }
    await repository.save(state)
    expect(await repository.load()).toEqual(state)
    await repository.reset()
    expect(await repository.load()).toEqual(createInitialState())
  })

  it.each(['bad', [12], ['tea', 'tea']])('rejects malformed default deletions without overwriting storage: %j', async deletedDefaultDrinkIds => {
    const storage = new MemoryStorage()
    const raw = JSON.stringify({ ...populatedState(), deletedDefaultDrinkIds })
    storage.setItem(CAFFEINE_STORAGE_KEY, raw)
    await expect(new LocalCaffeineRepository(storage).load()).rejects.toThrow()
    expect(storage.getItem(CAFFEINE_STORAGE_KEY)).toBe(raw)
  })

  it.each([2, 3, 4])('loads existing five-hour v%s data using four and a half hours without losing records', async version => {
    const original = populatedState()
    original.entries[0].startedAt = '2026-10-02T04:00:00.000Z'
    original.customDrinks[0].photoDataUrl = 'data:image/jpeg;base64,/9j/2Q=='
    if (version === 4) {
      original.customCategories = [{ id: 'custom:my-tea', name: '내 차' }]
      original.customDrinks[0].categoryId = 'custom:my-tea'
    }
    original.legacyPersonalization = { feedback: [{ answer: 'later' }] }
    const raw = JSON.stringify({ ...original, version, settings: { halfLifeHours: 5 } })
    const storage = new MemoryStorage()
    storage.setItem(CAFFEINE_STORAGE_KEY, raw)
    const repository = new LocalCaffeineRepository(storage)
    const loaded = await repository.load()
    expect(loaded).toEqual({ ...original, settings: { halfLifeHours: 4.5 } })
    expect(storage.getItem(CAFFEINE_STORAGE_KEY)).toBe(raw)
    await repository.save(loaded)
    expect(await repository.load()).toEqual(loaded)
  })

  it('loads original v3 records into v4 with no custom categories without rewriting them', async () => {
    const storage = new MemoryStorage()
    const raw = JSON.stringify({ ...populatedState(), version: 3, customCategories: undefined })
    storage.setItem(CAFFEINE_STORAGE_KEY, raw)
    const loaded = await new LocalCaffeineRepository(storage).load()
    expect(loaded).toEqual(populatedState())
    expect(loaded.customCategories).toEqual([])
    expect(storage.getItem(CAFFEINE_STORAGE_KEY)).toBe(raw)
  })

  it('round-trips custom categories and the drinks belonging to them', async () => {
    const state = populatedState()
    state.customCategories = [{ id: 'custom:category-1', name: '단백질 쉐이크' }]
    state.customDrinks[0].categoryId = 'custom:category-1'
    const storage = new MemoryStorage()
    await new LocalCaffeineRepository(storage).save(state)
    expect(await new LocalCaffeineRepository(storage).load()).toEqual(state)
  })

  it.each([
    (state: CaffeineState) => { state.customCategories = [{ id: 'custom:c1', name: ' 커 피 ' }] },
    (state: CaffeineState) => { state.customCategories = [{ id: 'custom:c1', name: '내 차' }, { id: 'custom:c2', name: '내차' }] },
    (state: CaffeineState) => { state.customCategories = [{ id: 'custom:c1', name: ' \t ' }] },
    (state: CaffeineState) => { state.customCategories = [{ id: 'coffee', name: '새 분류' }] },
    (state: CaffeineState) => { state.customDrinks[0].categoryId = 'custom:missing' },
  ])('rejects duplicate, blank or dangling categories without replacing stored records', async invalidate => {
    const storage = new MemoryStorage()
    const repository = new LocalCaffeineRepository(storage)
    await repository.save(populatedState())
    const invalid = populatedState()
    invalidate(invalid)
    await expect(repository.save(invalid)).rejects.toThrow()
    expect(await repository.load()).toEqual(populatedState())
    const raw = JSON.stringify(invalid)
    storage.setItem(CAFFEINE_STORAGE_KEY, raw)
    await expect(repository.load()).rejects.toThrow()
    expect(storage.getItem(CAFFEINE_STORAGE_KEY)).toBe(raw)
  })

  it('retires v2 feedback without losing drinks, intervals or the original source', async () => {
    const storage = new MemoryStorage()
    const retired = { enabled: true, perceivedDurationAdjustment: 2, feedback: [{ answer: 'later' }] }
    const legacy = { ...populatedState(), version: 2, personalization: retired }
    legacy.entries[0].startedAt = '2026-10-02T04:00:00.000Z'
    const raw = JSON.stringify(legacy)
    storage.setItem(CAFFEINE_STORAGE_KEY, raw)
    const repository = new LocalCaffeineRepository(storage)
    const loaded = await repository.load()
    expect(loaded.version).toBe(4)
    expect(loaded).not.toHaveProperty('personalization')
    expect(loaded).toHaveProperty('legacyPersonalization', retired)
    expect(loaded.entries).toEqual(legacy.entries)
    expect(loaded.customDrinks).toEqual(legacy.customDrinks)
    expect(loaded.settings.halfLifeHours).toBe(4.5)
    expect(storage.getItem(CAFFEINE_STORAGE_KEY)).toBe(raw)
    await repository.save(loaded)
    expect(await repository.load()).toEqual(loaded)
  })

  it('round-trips a cross-midnight intake interval alongside existing single-time records', async () => {
    const storage = new MemoryStorage()
    const state = populatedState()
    state.entries.push({ ...state.entries[0], id: 'slow', startedAt: '2026-10-01T23:30:00+09:00', consumedAt: '2026-10-02T01:00:00+09:00' })
    await new LocalCaffeineRepository(storage).save(state)
    expect(await new LocalCaffeineRepository(storage).load()).toEqual(state)
    expect((await new LocalCaffeineRepository(storage).load()).entries[0]).not.toHaveProperty('startedAt')
  })

  it.each(['bad', '2026-02-30T05:00:00.000Z', '2026-10-02T05:00:00.000Z', '2026-10-02T06:00:00.000Z'])('rejects invalid intake start %s without changing storage', async (startedAt) => {
    const storage = new MemoryStorage()
    const repository = new LocalCaffeineRepository(storage)
    const invalid = populatedState()
    invalid.entries[0] = { ...invalid.entries[0], startedAt }
    await repository.save(populatedState())
    await expect(repository.save(invalid)).rejects.toThrow()
    expect(await repository.load()).toEqual(populatedState())
    const raw = JSON.stringify(invalid)
    storage.setItem(CAFFEINE_STORAGE_KEY, raw)
    await expect(repository.load()).rejects.toThrow()
    expect(storage.getItem(CAFFEINE_STORAGE_KEY)).toBe(raw)
  })

  it('migrates v1 without losing drinks or entries and retires the manual half-life setting', async () => {
    const storage = new MemoryStorage()
    const legacy = { ...populatedState(), version: 1, settings: { halfLifeHours: 8 } }
    storage.setItem(CAFFEINE_STORAGE_KEY, JSON.stringify(legacy))
    const loaded = await new LocalCaffeineRepository(storage).load()
    expect(loaded.version).toBe(4)
    expect(loaded.entries).toEqual(legacy.entries)
    expect(loaded.customDrinks).toEqual(legacy.customDrinks)
    expect(loaded.settings.halfLifeHours).toBe(4.5)
    expect(loaded).toHaveProperty('legacyHalfLifeHours', 8)
    expect(loaded).not.toHaveProperty('personalization')
    expect(storage.getItem(CAFFEINE_STORAGE_KEY)).toBe(JSON.stringify(legacy))
    await new LocalCaffeineRepository(storage).save(loaded)
    expect(await new LocalCaffeineRepository(storage).load()).toEqual(loaded)
  })

  it.each([5, 8])('refuses a noncurrent half-life %s on new saves', async halfLife => {
    const state = populatedState()
    state.settings.halfLifeHours = halfLife
    await expect(new LocalCaffeineRepository(new MemoryStorage()).save(state)).rejects.toThrow()
  })

  it('keeps unsupported future schema data untouched', async () => {
    const storage = new MemoryStorage()
    const raw = JSON.stringify({ ...populatedState(), version: 99 })
    storage.setItem(CAFFEINE_STORAGE_KEY, raw)
    await expect(new LocalCaffeineRepository(storage).load()).rejects.toThrow()
    expect(storage.getItem(CAFFEINE_STORAGE_KEY)).toBe(raw)
  })

  it('keeps migrated records available after an atomic upgrade save failure', async () => {
    const raw = JSON.stringify({ ...populatedState(), version: 1, settings: { halfLifeHours: 7 } })
    const storage: CaffeineStorage = { getItem: () => raw, setItem: () => { throw new Error('full') }, removeItem: () => {} }
    const repository = new LocalCaffeineRepository(storage)
    const migrated = await repository.load()
    await expect(repository.save(migrated)).rejects.toThrow()
    expect(await storage.getItem(CAFFEINE_STORAGE_KEY)).toBe(raw)
    expect((await repository.load()).entries).toEqual(migrated.entries)
  })

  it('returns empty state when storage has never been written', async () => {
    const repository = new LocalCaffeineRepository(new MemoryStorage())

    expect(await repository.load()).toEqual(createInitialState())
  })

  it('persists intake, custom drinks, and settings across repository instances', async () => {
    const storage = new MemoryStorage()
    await new LocalCaffeineRepository(storage).save(populatedState())

    expect(await new LocalCaffeineRepository(storage).load()).toEqual(populatedState())
  })

  it('accepts asynchronous storage adapters', async () => {
    const memory = new MemoryStorage()
    const storage: CaffeineStorage = {
      getItem: async (key) => memory.getItem(key),
      setItem: async (key, value) => memory.setItem(key, value),
      removeItem: async (key) => memory.removeItem(key),
    }
    const repository = new LocalCaffeineRepository(storage)
    await repository.save(populatedState())

    expect((await repository.load()).entries[0].caffeineMg).toBe(95)
    await repository.reset()
    expect((await repository.load()).entries).toEqual([])
  })

  it.each(['not-json', 'null', '{"version":2}', '{"version":1,"entries":[],"customDrinks":[],"settings":{"halfLifeHours":0}}'])('rejects corrupt storage and keeps the original value: %s', async (raw) => {
    const storage = new MemoryStorage()
    storage.setItem(CAFFEINE_STORAGE_KEY, raw)

    await expect(new LocalCaffeineRepository(storage).load()).rejects.toThrow()
    expect(storage.getItem(CAFFEINE_STORAGE_KEY)).toBe(raw)
  })

  it.each([
    (state: CaffeineState) => { state.entries[0].caffeineMg = -5 },
    (state: CaffeineState) => { state.entries[0].caffeineMg = 1001 },
    (state: CaffeineState) => { state.entries[0].consumedAt = 'not-a-date' },
    (state: CaffeineState) => { state.entries[0].consumedAt = '2026-02-30T05:00:00.000Z' },
    (state: CaffeineState) => { state.entries[0].consumedAt = '2026-10-02T24:00:00.000Z' },
    (state: CaffeineState) => { state.entries[0].drinkName = ' ' },
    (state: CaffeineState) => { state.entries.push({ ...state.entries[0] }) },
    (state: CaffeineState) => { state.customDrinks[0].isCustom = false },
    (state: CaffeineState) => { state.customDrinks[0].sourceType = 'official' },
    (state: CaffeineState) => { state.settings.halfLifeHours = Number.NaN },
  ])('refuses invalid state before replacing a valid saved record', async (invalidate) => {
    const storage = new MemoryStorage()
    const repository = new LocalCaffeineRepository(storage)
    await repository.save(populatedState())
    const invalid = populatedState()
    invalidate(invalid)

    await expect(repository.save(invalid)).rejects.toThrow()
    expect(await repository.load()).toEqual(populatedState())
  })

  it('surfaces write failures so the UI cannot report an unsaved record as saved', async () => {
    const storage: CaffeineStorage = {
      getItem: () => null,
      setItem: () => { throw new Error('storage full') },
      removeItem: () => {},
    }

    await expect(new LocalCaffeineRepository(storage).save(populatedState())).rejects.toThrow()
  })

  it('surfaces read failures instead of treating inaccessible storage as empty', async () => {
    const storage: CaffeineStorage = {
      getItem: () => { throw new Error('access denied') },
      setItem: () => {},
      removeItem: () => {},
    }

    await expect(new LocalCaffeineRepository(storage).load()).rejects.toThrow()
  })

  it('surfaces reset failures so the UI can retain existing records', async () => {
    const storage: CaffeineStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: async () => { throw new Error('access denied') },
    }

    await expect(new LocalCaffeineRepository(storage).reset()).rejects.toThrow()
  })

  it('resets only this app state and keeps unrelated storage', async () => {
    const storage = new MemoryStorage()
    storage.setItem('unrelated', 'keep')
    const repository = new LocalCaffeineRepository(storage)
    await repository.save(populatedState())
    await repository.reset()

    expect(await repository.load()).toEqual(createInitialState())
    expect(storage.getItem('unrelated')).toBe('keep')
  })
})

describe('updated categories and drink photos', () => {
  it('retains custom drinks and photos saved in the retired misc category across load and save', async () => {
    const storage = new MemoryStorage()
    const state = populatedState()
    state.customDrinks[0].categoryId = 'misc'
    state.customDrinks[0].photoDataUrl = 'data:image/jpeg;base64,/9j/2Q=='
    const raw = JSON.stringify(state)
    storage.setItem(CAFFEINE_STORAGE_KEY, raw)
    const repository = new LocalCaffeineRepository(storage)
    expect(await repository.load()).toEqual(state)
    expect(storage.getItem(CAFFEINE_STORAGE_KEY)).toBe(raw)
    await repository.save(await repository.load())
    expect(await repository.load()).toEqual(state)
  })

  it('merges old custom names that are now built-in without losing drinks or rewriting storage on read', async () => {
    const storage = new MemoryStorage()
    const state = populatedState()
    state.customCategories = [{ id: 'custom:energy', name: '에너지 음료' }, { id: 'custom:misc', name: '기 타' }, { id: 'custom:soda', name: '탄 산' }]
    state.customDrinks[0].categoryId = 'custom:energy'
    state.customDrinks.push({ ...state.customDrinks[0], id: 'my-soda', categoryId: 'custom:soda' }, { ...state.customDrinks[0], id: 'my-misc', categoryId: 'custom:misc' })
    const raw = JSON.stringify(state)
    storage.setItem(CAFFEINE_STORAGE_KEY, raw)
    const loaded = await new LocalCaffeineRepository(storage).load()
    expect(loaded.customCategories).toEqual([{ id: 'custom:misc', name: '기 타' }])
    expect(loaded.customDrinks.map(drink => drink.categoryId)).toEqual(['energy', 'other', 'custom:misc'])
    expect(loaded.entries).toEqual(state.entries)
    expect(storage.getItem(CAFFEINE_STORAGE_KEY)).toBe(raw)
    await new LocalCaffeineRepository(storage).save(loaded)
    expect(await new LocalCaffeineRepository(storage).load()).toEqual(loaded)
  })

  it('rejects external, non-photo and oversized images without overwriting saved drinks', async () => {
    const storage = new MemoryStorage()
    const repository = new LocalCaffeineRepository(storage)
    await repository.save(populatedState())
    for (const photoDataUrl of ['https://example.com/photo.jpg', 'data:image/svg+xml;base64,PHN2Zz4=', 'data:image/jpeg;base64,' + 'A'.repeat(100_000)]) {
      const invalid = { ...populatedState(), customDrinks: [{ ...populatedState().customDrinks[0], photoDataUrl }] }
      await expect(repository.save(invalid)).rejects.toThrow()
      expect(await repository.load()).toEqual(populatedState())
    }
  })
})

describe('persisted category catalog', () => {
  it.each([1, 2, 3, 4])('loads a legacy v%s catalog without adding config or rewriting the source', async version => {
    const storage = new MemoryStorage()
    const original = populatedState()
    const raw = JSON.stringify({ ...original, version })
    storage.setItem(CAFFEINE_STORAGE_KEY, raw)
    const loaded = await new LocalCaffeineRepository(storage).load()
    expect(loaded.entries).toEqual(original.entries)
    expect(loaded.customDrinks).toEqual(original.customDrinks)
    expect(loaded).not.toHaveProperty('categoryCatalog')
    expect(loaded).not.toHaveProperty('defaultDrinkCategoryOverrides')
    expect(storage.getItem(CAFFEINE_STORAGE_KEY)).toBe(raw)
  })

  it('round-trips renamed built-ins and a custom category using the original name without alias migration', async () => {
    const renamed = renameDrinkCategory(populatedState(), 'coffee', '원두')
    const added = addCustomDrink(renamed, { name: '내 새 커피', categoryName: '커피', caffeineMg: 75, icon: 'coffee' }, { drinkId: 'my-new-coffee', categoryId: 'custom:coffee' }).state
    const state = reorderDrinkCategories(added, ['custom:coffee', 'tea', 'coffee', 'other', 'energy'])
    const storage = new MemoryStorage()
    const repository = new LocalCaffeineRepository(storage)
    await repository.save(state)
    const raw = storage.getItem(CAFFEINE_STORAGE_KEY)
    const loaded = await repository.load()
    expect(loaded).toEqual(state)
    expect(drinkCategories(loaded).map(category => [category.id, category.name])).toEqual([['custom:coffee', '커피'], ['tea', '차'], ['coffee', '원두'], ['other', '탄산'], ['energy', '에너지음료']])
    expect(loaded.customDrinks.find(drink => drink.id === 'my-new-coffee')?.categoryId).toBe('custom:coffee')
    expect(storage.getItem(CAFFEINE_STORAGE_KEY)).toBe(raw)
  })

  it('round-trips category removal with migrated default/custom drinks, photos and history and resets every preference', async () => {
    const original = populatedState()
    original.customDrinks[0].photoDataUrl = 'data:image/jpeg;base64,/9j/2Q=='
    const state = deleteDrinkCategory(deleteDrinkFromCatalog(original, 'americano'), 'coffee', 'tea')
    const storage = new MemoryStorage()
    const repository = new LocalCaffeineRepository(storage)
    await repository.save(state)
    const loaded = await repository.load()
    expect(loaded).toEqual(state)
    expect(drinkCategories(loaded).map(category => category.id)).toEqual(['tea', 'energy', 'other'])
    expect(availableDrinks(loaded).some(drink => drink.id === 'americano' || drink.categoryId === 'coffee')).toBe(false)
    expect(loaded.customDrinks[0]).toMatchObject({ categoryId: 'tea', photoDataUrl: 'data:image/jpeg;base64,/9j/2Q==' })
    expect(loaded.entries).toEqual(original.entries)
    await repository.reset()
    const reset = await repository.load()
    expect(reset).toEqual(createInitialState())
    expect(availableDrinks(reset).find(drink => drink.id === 'americano')?.categoryId).toBe('coffee')
  })

  it('keeps the original category and all drinks when saving a move fails', async () => {
    const memory = new MemoryStorage()
    await new LocalCaffeineRepository(memory).save(populatedState())
    const raw = memory.getItem(CAFFEINE_STORAGE_KEY)
    const repository = new LocalCaffeineRepository({ getItem: key => memory.getItem(key), setItem: () => { throw new Error('full') }, removeItem: key => memory.removeItem(key) })
    const previous = await repository.load()
    await expect(repository.save(deleteDrinkCategory(previous, 'coffee', 'tea'))).rejects.toThrow()
    expect(await repository.load()).toEqual(previous)
    expect(memory.getItem(CAFFEINE_STORAGE_KEY)).toBe(raw)
  })

  it('allows removing the final empty category without restoring built-ins on reload', async () => {
    let state = createInitialState()
    for (const drink of availableDrinks(state)) state = deleteDrinkFromCatalog(state, drink.id)
    for (const category of drinkCategories(state)) state = deleteDrinkCategory(state, category.id)
    const repository = new LocalCaffeineRepository(new MemoryStorage())
    await repository.save(state)
    expect(drinkCategories(await repository.load())).toEqual([])
    expect(availableDrinks(await repository.load())).toEqual([])
    const withNewCategory = createDrinkCategory(await repository.load(), '새 시작', 'custom:new')
    await repository.save(withNewCategory)
    expect(drinkCategories(await repository.load())).toEqual([{ id: 'custom:new', name: '새 시작' }])
  })

  it.each([
    { categoryCatalog: null },
    { categoryCatalog: {} },
    { categoryCatalog: [{ id: 'unknown', name: '잘못된 ID' }] },
    { categoryCatalog: [{ id: 'custom:', name: '빈 ID' }] },
    { categoryCatalog: [{ id: 'coffee', name: ' \u200b ' }] },
    { categoryCatalog: [{ id: 'coffee', name: '커피' }, { id: 'coffee', name: '다른 커피' }] },
    { categoryCatalog: [{ id: 'coffee', name: '커피' }, { id: 'tea', name: '커 피' }] },
    { categoryCatalog: [] },
    { categoryCatalog: [{ id: 'coffee', name: '커피' }, { id: 'tea', name: '차' }, { id: 'energy', name: '에너지음료' }, { id: 'other', name: '탄산' }, { id: 'custom:unlisted', name: '새 분류' }] },
    { defaultDrinkCategoryOverrides: { americano: 'tea' } },
    { categoryCatalog: [{ id: 'coffee', name: '커피' }], defaultDrinkCategoryOverrides: null },
    { categoryCatalog: [{ id: 'coffee', name: '커피' }], defaultDrinkCategoryOverrides: [] },
    { categoryCatalog: [{ id: 'coffee', name: '커피' }], defaultDrinkCategoryOverrides: { americano: 'custom:missing' } },
    { categoryCatalog: [{ id: 'coffee', name: '커피' }], defaultDrinkCategoryOverrides: { missing: 'coffee' } },
    { categoryCatalog: [{ id: 'coffee', name: '커피' }], defaultDrinkCategoryOverrides: { americano: 12 } },
  ])('rejects malformed or dangling configuration without replacing saved data: %j', async config => {
    const storage = new MemoryStorage()
    const repository = new LocalCaffeineRepository(storage)
    await repository.save(populatedState())
    const invalid = { ...populatedState(), ...config } as unknown as CaffeineState
    await expect(repository.save(invalid)).rejects.toThrow()
    expect(await repository.load()).toEqual(populatedState())
    const raw = JSON.stringify(invalid)
    storage.setItem(CAFFEINE_STORAGE_KEY, raw)
    await expect(repository.load()).rejects.toThrow()
    expect(storage.getItem(CAFFEINE_STORAGE_KEY)).toBe(raw)
  })

  it('rejects a dangling custom drink and a stale custom category mirror in an otherwise valid catalog', async () => {
    const repository = new LocalCaffeineRepository(new MemoryStorage())
    const valid = createDrinkCategory(populatedState(), '별도 음료', 'custom:extra')
    await repository.save(valid)
    const dangling = { ...valid, customDrinks: [{ ...valid.customDrinks[0], categoryId: 'custom:missing' as const }] }
    await expect(repository.save(dangling)).rejects.toThrow()
    await expect(repository.save({ ...valid, customCategories: [{ id: 'custom:extra', name: '이전 이름' }] })).rejects.toThrow()
    expect(await repository.load()).toEqual(valid)
  })
})
