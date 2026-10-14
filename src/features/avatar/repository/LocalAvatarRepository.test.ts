import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../caffeine/model/caffeine'
import type { CaffeineStorage } from '../../caffeine/repository/CaffeineRepository'
import { CAFFEINE_STORAGE_KEY, LocalCaffeineRepository } from '../../caffeine/repository/LocalCaffeineRepository'
import { emptyOutfit } from '../model/avatar'
import { AVATAR_STORAGE_KEY, LocalAvatarRepository } from './LocalAvatarRepository'

class MemoryStorage implements CaffeineStorage {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

describe('avatar repository', () => {
  it('starts bare without writing a key and restores only item identifiers', async () => {
    const storage = new MemoryStorage()
    const repository = new LocalAvatarRepository(storage)
    expect(await repository.load()).toEqual(emptyOutfit())
    expect(storage.values.size).toBe(0)
    const outfit = { ...emptyOutfit(), hat: 'hat-crown', accessory: 'accessory-backpack' }
    await repository.save(outfit)
    expect(JSON.parse(storage.values.get(AVATAR_STORAGE_KEY)!)).toEqual({ version: 1, outfit })
    expect(await new LocalAvatarRepository(storage).load()).toEqual(outfit)
  })

  it.each(['broken JSON', 'null', '[]', '{"version":2,"outfit":{"hat":"hat-crown"}}'])('tolerates malformed storage %s without rewriting it', async raw => {
    const storage = new MemoryStorage()
    storage.values.set(AVATAR_STORAGE_KEY, raw)
    expect(await new LocalAvatarRepository(storage).load()).toEqual(emptyOutfit())
    expect(storage.values.get(AVATAR_STORAGE_KEY)).toBe(raw)
  })

  it('clears only invalid slots when reading an older or damaged outfit', async () => {
    const storage = new MemoryStorage()
    storage.values.set(AVATAR_STORAGE_KEY, JSON.stringify({ version: 1, outfit: { hat: 'hat-removed', glasses: 'glasses-heart', top: 'hat-crown', shoes: 'shoes-rain' } }))
    expect(await new LocalAvatarRepository(storage).load()).toEqual({ ...emptyOutfit(), glasses: 'glasses-heart', shoes: 'shoes-rain' })
  })

  it('reports read and write failures while preserving saved avatar and caffeine bytes', async () => {
    const storage = new MemoryStorage()
    const outfit = { ...emptyOutfit(), hat: 'hat-cap' }
    await new LocalAvatarRepository(storage).save(outfit)
    storage.values.set(CAFFEINE_STORAGE_KEY, 'untouched caffeine')
    const before = new Map(storage.values)
    const repository = new LocalAvatarRepository({
      getItem: async key => { if (key === AVATAR_STORAGE_KEY) throw new Error('read unavailable'); return storage.getItem(key) },
      setItem: async (key, value) => { if (key === AVATAR_STORAGE_KEY) throw new Error('quota'); storage.setItem(key, value) },
      removeItem: async key => { if (key === AVATAR_STORAGE_KEY) throw new Error('remove unavailable'); storage.removeItem(key) },
    })
    await expect(repository.load()).rejects.toThrow('꾸미기 정보를 불러오지 못했어요')
    await expect(repository.save(emptyOutfit())).rejects.toThrow('꾸미기를 저장하지 못했어요')
    await expect(repository.reset()).rejects.toThrow('꾸미기 정보를 초기화하지 못했어요')
    expect(storage.values).toEqual(before)
  })

  it('cannot roll back concurrent caffeine updates and only resets its own key', async () => {
    const storage = new MemoryStorage()
    const caffeine = new LocalCaffeineRepository(storage)
    const avatar = new LocalAvatarRepository(storage)
    await caffeine.save(createInitialState())
    await avatar.load()
    const latest = createInitialState()
    latest.settings.theme = 'light'
    latest.entries = [{ id: 'new-entry', drinkId: 'coffee', drinkName: '커피', caffeineMg: 100, consumedAt: '2026-10-14T01:00:00.000Z', icon: 'coffee' }]
    await caffeine.save(latest)
    const caffeineBytes = storage.values.get(CAFFEINE_STORAGE_KEY)
    await avatar.save({ ...emptyOutfit(), shoes: 'shoes-low' })
    expect(storage.values.get(CAFFEINE_STORAGE_KEY)).toBe(caffeineBytes)
    await avatar.reset()
    expect(storage.values.has(AVATAR_STORAGE_KEY)).toBe(false)
    expect(await caffeine.load()).toEqual(latest)
  })
})
