import { describe, expect, it } from 'vitest'
import { createInitialState } from '../model/caffeine'
import type { CaffeineState } from '../model/caffeine.types'
import { LocalCaffeineRepository, CAFFEINE_STORAGE_KEY } from './LocalCaffeineRepository'
import type { CaffeineStorage } from './CaffeineRepository'

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
  it('migrates v1 without losing drinks or entries and retires the manual half-life setting', async () => {
    const storage = new MemoryStorage()
    const legacy = { ...populatedState(), version: 1, settings: { halfLifeHours: 8 } }
    storage.setItem(CAFFEINE_STORAGE_KEY, JSON.stringify(legacy))
    const loaded = await new LocalCaffeineRepository(storage).load()
    expect(loaded.version).toBe(2)
    expect(loaded.entries).toEqual(legacy.entries)
    expect(loaded.customDrinks).toEqual(legacy.customDrinks)
    expect(loaded.settings.halfLifeHours).toBe(5)
    expect(loaded).toHaveProperty('legacyHalfLifeHours', 8)
    expect(loaded).toHaveProperty('personalization.version', 1)
    expect(storage.getItem(CAFFEINE_STORAGE_KEY)).toBe(JSON.stringify(legacy))
    await new LocalCaffeineRepository(storage).save(loaded)
    expect(await new LocalCaffeineRepository(storage).load()).toEqual(loaded)
  })

  it('refuses a manually changed half-life on new saves', async () => {
    const state = populatedState()
    state.settings.halfLifeHours = 8
    await expect(new LocalCaffeineRepository(new MemoryStorage()).save(state)).rejects.toThrow()
  })

  it('keeps unsupported future schema data untouched', async () => {
    const storage = new MemoryStorage()
    const raw = JSON.stringify({ ...populatedState(), version: 99 })
    storage.setItem(CAFFEINE_STORAGE_KEY, raw)
    await expect(new LocalCaffeineRepository(storage).load()).rejects.toThrow()
    expect(storage.getItem(CAFFEINE_STORAGE_KEY)).toBe(raw)
  })

  it.each([
    null,
    { version: 1 },
    { ...createInitialState().personalization, enabled: 'yes' },
    { ...createInitialState().personalization, perceivedDurationAdjustment: 999 },
    { ...createInitialState().personalization, feedback: [{ id: 'broken' }] },
    { ...createInitialState().personalization, predictions: [{ id: 'broken' }] },
  ])('refuses damaged personalization without overwriting source records', async (personalization) => {
    const storage = new MemoryStorage()
    const raw = JSON.stringify({ ...populatedState(), personalization })
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
