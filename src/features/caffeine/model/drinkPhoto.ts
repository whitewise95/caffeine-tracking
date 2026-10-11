import type { CaffeineEntry, CaffeineState, Drink, DrinkPhotoHistory } from './caffeine.types'

export const DRINK_PHOTO_SIZE = 160
export const MAX_DRINK_PHOTO_DATA_URL_LENGTH = 48_000

/** Stored photos are bounded JPEG thumbnails, never remote URLs or SVG markup. */
export function isDrinkPhotoDataUrl(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_DRINK_PHOTO_DATA_URL_LENGTH
    && /^data:image\/jpeg;base64,\/9j\/(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)
}

/** Legacy records follow the catalog only until their original photo is captured. */
export function entryDrinkPhoto(entry: CaffeineEntry, drinks: readonly Drink[], history?: DrinkPhotoHistory): string | undefined {
  if (history?.entryDrinkPhotoIds && Object.hasOwn(history.entryDrinkPhotoIds, entry.id)) {
    const photoId = history.entryDrinkPhotoIds[entry.id]
    return photoId === null ? undefined : history.drinkPhotoSnapshots?.[photoId]
  }
  return drinks.find(drink => drink.id === entry.drinkId)?.photoDataUrl ?? history?.retainedDrinkPhotos?.[entry.drinkId]
}

/** Snapshot references are separate from immutable intake fields and reuse equal thumbnails. */
export function snapshotEntryDrinkPhotos(state: CaffeineState, entries: readonly CaffeineEntry[], photoDataUrl: string | undefined): CaffeineState {
  const uncaptured = entries.filter(entry => !Object.hasOwn(state.entryDrinkPhotoIds ?? {}, entry.id))
  if (!uncaptured.length) return state
  const photos = { ...state.drinkPhotoSnapshots }
  let photoId: string | null = null
  if (photoDataUrl !== undefined) {
    if (!isDrinkPhotoDataUrl(photoDataUrl)) throw new Error('기록할 사진의 형식이나 용량을 확인해 주세요.')
    photoId = Object.keys(photos).find(id => photos[id] === photoDataUrl) ?? null
    if (photoId === null) {
      let index = Object.keys(photos).length
      while (Object.hasOwn(photos, `photo:${index}`)) index++
      photoId = `photo:${index}`
      photos[photoId] = photoDataUrl
    }
  }
  return {
    ...state,
    entryDrinkPhotoIds: { ...state.entryDrinkPhotoIds, ...Object.fromEntries(uncaptured.map(entry => [entry.id, photoId])) },
    ...(photoDataUrl !== undefined ? { drinkPhotoSnapshots: photos } : {}),
  }
}

export function pruneDrinkPhotoSnapshots(state: CaffeineState): CaffeineState {
  if (state.entryDrinkPhotoIds === undefined && state.drinkPhotoSnapshots === undefined) return state
  const entryIds = new Set(state.entries.map(entry => entry.id))
  const references = Object.fromEntries(Object.entries(state.entryDrinkPhotoIds ?? {}).filter(([id]) => entryIds.has(id)))
  const usedPhotos = new Set(Object.values(references).filter(id => id !== null))
  const photos = Object.fromEntries(Object.entries(state.drinkPhotoSnapshots ?? {}).filter(([id]) => usedPhotos.has(id)))
  const next = { ...state }
  if (Object.keys(references).length) next.entryDrinkPhotoIds = references
  else delete next.entryDrinkPhotoIds
  if (Object.keys(photos).length) next.drinkPhotoSnapshots = photos
  else delete next.drinkPhotoSnapshots
  return next
}

/** Remove an intake and reclaim archived drink metadata with no history references. */
export function deleteCaffeineEntry(state: CaffeineState, id: string): CaffeineState {
  const next = { ...state, entries: state.entries.filter(entry => entry.id !== id) }
  const referencedDrinks = new Set(next.entries.map(entry => entry.drinkId))
  if (state.retainedDrinkPhotos !== undefined) {
    const retained = Object.fromEntries(Object.entries(state.retainedDrinkPhotos).filter(([drinkId]) => referencedDrinks.has(drinkId)))
    if (Object.keys(retained).length > 0) next.retainedDrinkPhotos = retained
    else delete next.retainedDrinkPhotos
  }
  if (state.retainedDrinkCategories !== undefined) {
    const retained = Object.fromEntries(Object.entries(state.retainedDrinkCategories).filter(([drinkId]) => referencedDrinks.has(drinkId)))
    if (Object.keys(retained).length > 0) next.retainedDrinkCategories = retained
    else delete next.retainedDrinkCategories
  }
  return pruneDrinkPhotoSnapshots(next)
}
