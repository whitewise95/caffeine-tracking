import { describe, expect, it } from 'vitest'
import { createInitialState } from './caffeine'
import type { CaffeineEntry } from './caffeine.types'
import { entryDrinkPhoto, snapshotEntryDrinkPhotos, deleteCaffeineEntry } from './drinkPhoto'
import { availableDrinks, updateDrinkInCatalog, deleteDrinkCategory } from './drinkCategories'

const photoA = 'data:image/jpeg;base64,/9j/AA=='
const photoB = 'data:image/jpeg;base64,/9j/2Q=='
const entry: CaffeineEntry = { id: 'old', drinkId: 'custom-1', drinkName: '내 커피', caffeineMg: 67, icon: 'cup', consumedAt: '2026-10-05T00:00:00.000Z' }
function photoState() {
  return { ...createInitialState(), entries: [entry], customDrinks: [{ id: 'custom-1', categoryId: 'coffee' as const, name: '내 커피', caffeineMg: 67, icon: 'cup' as const, isCustom: true, sourceType: 'custom' as const, photoDataUrl: photoA }] }
}
describe('immutable record photos', () => {
  it('captures legacy photos before a catalog edit without changing any intake fields', () => {
    const state = photoState()
    const updated = updateDrinkInCatalog(state, 'custom-1', { name: '새 이름', icon: 'tea', caffeineMg: 95 })
    expect(updated.entries).toBe(state.entries)
    expect(entryDrinkPhoto(entry, availableDrinks(updated), updated)).toBe(photoA)
    expect(state).toEqual(photoState())
  })
  it('freezes a record with no photo so later catalog photos cannot replace its icon', () => {
    const state = snapshotEntryDrinkPhotos(photoState(), [entry], undefined)
    expect(entryDrinkPhoto(entry, state.customDrinks, state)).toBeUndefined()
    expect(state.entries[0]).toEqual(entry)
  })
  it('deduplicates equal photos and preserves separate versions for the same drink', () => {
    const second = { ...entry, id: 'second' }
    const third = { ...entry, id: 'third' }
    const base = { ...photoState(), entries: [entry, second, third] }
    const first = snapshotEntryDrinkPhotos(base, [entry, second], photoA)
    const next = snapshotEntryDrinkPhotos(first, [third], photoB)
    expect(Object.values(next.drinkPhotoSnapshots!)).toEqual([photoA, photoB])
    expect(entryDrinkPhoto(entry, [], next)).toBe(photoA)
    expect(entryDrinkPhoto(second, [], next)).toBe(photoA)
    expect(entryDrinkPhoto(third, [], next)).toBe(photoB)
    expect(snapshotEntryDrinkPhotos(next, [entry], photoB)).toBe(next)
  })
  it('reclaims only unreferenced snapshot photos when records or a category are deleted', () => {
    const second = { ...entry, id: 'second' }
    const base = { ...photoState(), entries: [entry, second] }
    const state = snapshotEntryDrinkPhotos(base, [entry, second], photoA)
    const next = deleteCaffeineEntry(state, entry.id)
    expect(Object.values(next.drinkPhotoSnapshots!)).toEqual([photoA])
    expect(next.entryDrinkPhotoIds).not.toHaveProperty(entry.id)
    const empty = deleteCaffeineEntry(next, second.id)
    expect(empty).not.toHaveProperty('drinkPhotoSnapshots')
    expect(empty).not.toHaveProperty('entryDrinkPhotoIds')
    const cascade = deleteDrinkCategory(state, 'coffee', undefined, 'force')
    expect(cascade).not.toHaveProperty('drinkPhotoSnapshots')
    expect(cascade).not.toHaveProperty('entryDrinkPhotoIds')
  })
  it('keeps shared photos that a record in another category still uses after cascade deletion', () => {
    const tea = { ...entry, id: 'tea-entry', drinkId: 'green-tea' }
    const state = snapshotEntryDrinkPhotos({ ...photoState(), entries: [entry, tea] }, [entry, tea], photoA)
    const next = deleteDrinkCategory(state, 'coffee', undefined, 'force')
    expect(next.entries).toEqual([tea])
    expect(Object.values(next.drinkPhotoSnapshots!)).toEqual([photoA])
    expect(entryDrinkPhoto(tea, [], next)).toBe(photoA)
  })
})
