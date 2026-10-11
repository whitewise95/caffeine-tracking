import { isDrinkPhotoDataUrl, pruneDrinkPhotoSnapshots, snapshotEntryDrinkPhotos } from './drinkPhoto'
import { CATEGORIES, DEFAULT_DRINKS } from '../data/defaultDrinks'
import { MAX_CAFFEINE_MG } from './caffeine'
import { DRINK_ICON_OPTIONS } from '../data/drinkIcons'
import type { CaffeineState, CustomDrinkDraft, Drink, DrinkCategory, DrinkCategoryId, DrinkEditDraft } from './caffeine.types'

export const MAX_CATEGORY_NAME_LENGTH = 30

/** Compare text, ignoring whitespace while retaining meaningful punctuation. */
export function categoryNameKey(name: string): string {
  return name.normalize('NFC').replace(/[\s\u200b]/gu, '')
}

export function isValidCategoryName(name: string): boolean {
  return categoryNameKey(name).length > 0 && name.trim().length <= MAX_CATEGORY_NAME_LENGTH
}

export function drinkCategories(state: Pick<CaffeineState, 'customDrinks' | 'customCategories' | 'categoryCatalog'>): DrinkCategory[] {
  if (state.categoryCatalog !== undefined) return state.categoryCatalog
  // Keep previously saved custom drinks in the retired category accessible.
  const legacyCategories: DrinkCategory[] = state.customDrinks.some(drink => drink.categoryId === 'misc')
    ? [{ id: 'misc', name: '기타' }] : []
  return [...CATEGORIES, ...legacyCategories, ...state.customCategories]
}

export function availableDrinks(state: Pick<CaffeineState, 'customDrinks' | 'customCategories' | 'deletedDefaultDrinkIds' | 'categoryCatalog' | 'defaultDrinkCategoryOverrides' | 'defaultDrinkDetailsOverrides' | 'drinkOrder'>): Drink[] {
  const deletedIds = new Set(state.deletedDefaultDrinkIds ?? [])
  const defaults = DEFAULT_DRINKS.filter(drink => !deletedIds.has(drink.id)).map(drink => {
    const categoryId = state.defaultDrinkCategoryOverrides?.[drink.id]
    const details = state.defaultDrinkDetailsOverrides?.[drink.id]
    return categoryId === undefined && details === undefined ? drink : { ...drink, ...(categoryId !== undefined ? { categoryId } : {}), ...(details ? { ...details, sourceType: 'custom' as const } : {}) }
  })
  const drinks = [...defaults, ...state.customDrinks]
  if (state.categoryCatalog === undefined && state.drinkOrder === undefined) return drinks
  const categories = drinkCategories(state)
  const categoryOrder = new Map(categories.map((category, index) => [category.id, index]))
  const drinkOrder = new Map((state.drinkOrder ?? []).map((id, index) => [id, index]))
  return drinks.sort((left, right) =>
    (categoryOrder.get(left.categoryId) ?? categories.length) - (categoryOrder.get(right.categoryId) ?? categories.length)
    || (drinkOrder.get(left.id) ?? drinkOrder.size) - (drinkOrder.get(right.id) ?? drinkOrder.size))
}

/** Edit catalog defaults without rewriting existing intake snapshots or placement. */
export function updateDrinkInCatalog(state: CaffeineState, id: string, input: DrinkEditDraft): CaffeineState {
  const drinks = availableDrinks(state)
  const source = drinks.find(drink => drink.id === id)
  if (!source) throw new Error('목록에서 음료를 찾을 수 없어요.')
  const name = input.name.normalize('NFC').trim()
  if (!name || name.length > 30) throw new Error('음료 이름을 1~30자로 입력해 주세요.')
  if (drinks.some(drink => drink.id !== id && drink.categoryId === source.categoryId && drink.name.normalize('NFC') === name)) throw new Error('같은 카테고리에 이미 있는 이름이에요. 다른 이름을 입력해 주세요.')
  if (!DRINK_ICON_OPTIONS.some(option => option.icon === input.icon)) throw new Error('음료 아이콘을 다시 선택해 주세요.')
  if (!Number.isInteger(input.caffeineMg) || input.caffeineMg < 0 || input.caffeineMg > MAX_CAFFEINE_MG) throw new Error(`카페인량을 0~${MAX_CAFFEINE_MG} 사이의 정수로 입력해 주세요.`)
  if (input.photoDataUrl !== undefined && !isDrinkPhotoDataUrl(input.photoDataUrl)) throw new Error('사진의 형식이나 용량을 확인해 주세요.')
  const details: DrinkEditDraft = { name, icon: input.icon, caffeineMg: input.caffeineMg, ...(input.photoDataUrl ? { photoDataUrl: input.photoDataUrl } : {}) }
  const previous = input.photoDataUrl === source.photoDataUrl ? state
    : snapshotEntryDrinkPhotos(state, state.entries.filter(entry => entry.drinkId === id), source.photoDataUrl)
  return source.isCustom
    ? { ...previous, customDrinks: state.customDrinks.map(drink => drink.id === id ? { ...drink, ...details, photoDataUrl: details.photoDataUrl } : drink) }
    : { ...previous, defaultDrinkDetailsOverrides: { ...state.defaultDrinkDetailsOverrides, [id]: details } }
}

function withCategoryCatalog(state: CaffeineState, categories: DrinkCategory[]): CaffeineState {
  return { ...state, categoryCatalog: categories, customCategories: categories.filter(category => category.id.startsWith('custom:')) }
}

/** Move one visible drink before a destination drink, or append it to that category. */
export function moveDrinkInCatalog(state: CaffeineState, id: string, categoryId: DrinkCategoryId, beforeDrinkId?: string): CaffeineState {
  const categories = drinkCategories(state)
  if (!categories.some(category => category.id === categoryId)) throw new Error('옮길 카테고리를 찾을 수 없어요. 목록에서 다시 선택해 주세요.')
  const drinks = availableDrinks(state)
  const drink = drinks.find(item => item.id === id)
  if (!drink) throw new Error('목록에서 음료를 찾을 수 없어요.')
  if (beforeDrinkId !== undefined && !drinks.some(item => item.id === beforeDrinkId && item.categoryId === categoryId)) {
    throw new Error('옮길 위치가 바뀌었어요. 목록에서 다시 선택해 주세요.')
  }
  if (beforeDrinkId === id) return state

  const remaining = drinks.filter(item => item.id !== id)
  const destination = remaining.filter(item => item.categoryId === categoryId).map(item => item.id)
  destination.splice(beforeDrinkId === undefined ? destination.length : destination.indexOf(beforeDrinkId), 0, id)
  return withCategoryCatalog({
    ...state,
    drinkOrder: categories.flatMap(category => category.id === categoryId ? destination : remaining.filter(item => item.categoryId === category.id).map(item => item.id)),
    ...(drink.isCustom
      ? { customDrinks: state.customDrinks.map(item => item.id === id ? { ...item, categoryId } : item) }
      : { defaultDrinkCategoryOverrides: { ...state.defaultDrinkCategoryOverrides, [id]: categoryId } }),
  }, categories)
}

function validatedCategoryName(categories: DrinkCategory[], name: string, currentId?: DrinkCategoryId): string {
  const normalized = name.normalize('NFC').trim()
  if (!isValidCategoryName(normalized)) throw new Error(`카테고리를 1~${MAX_CATEGORY_NAME_LENGTH}자로 입력해 주세요.`)
  if (categories.some(category => category.id !== currentId && categoryNameKey(category.name) === categoryNameKey(normalized))) {
    throw new Error('이미 있는 카테고리 이름이에요. 다른 이름을 입력해 주세요.')
  }
  return normalized
}

export function createDrinkCategory(state: CaffeineState, name: string, id: Extract<DrinkCategoryId, `custom:${string}`>): CaffeineState {
  const categories = drinkCategories(state)
  const normalized = validatedCategoryName(categories, name)
  if (!id.startsWith('custom:') || !categoryNameKey(id.slice(7)) || categories.some(category => category.id === id)) throw new Error('새 카테고리를 만들 수 없어요. 다시 시도해 주세요.')
  return withCategoryCatalog(state, [...categories, { id, name: normalized }])
}

export function renameDrinkCategory(state: CaffeineState, id: DrinkCategoryId, name: string): CaffeineState {
  const categories = drinkCategories(state)
  if (!categories.some(category => category.id === id)) throw new Error('카테고리를 찾을 수 없어요.')
  const normalized = validatedCategoryName(categories, name, id)
  return withCategoryCatalog(state, categories.map(category => category.id === id ? { ...category, name: normalized } : category))
}

/** Include hidden defaults and removed custom drinks whose ownership was retained. */
export function categoryDrinkIds(state: CaffeineState, id: DrinkCategoryId): Set<string> {
  const assignments = new Map(Object.entries(state.retainedDrinkCategories ?? {}))
  for (const drink of DEFAULT_DRINKS) assignments.set(drink.id, state.defaultDrinkCategoryOverrides?.[drink.id] ?? drink.categoryId)
  for (const drink of state.customDrinks) assignments.set(drink.id, drink.categoryId)
  return new Set([...assignments].filter(([, categoryId]) => categoryId === id).map(([drinkId]) => drinkId))
}

/** Category deletion, including its optional cascade, is one state/write. */
export function deleteDrinkCategory(state: CaffeineState, id: DrinkCategoryId, destinationId?: DrinkCategoryId, mode: 'move' | 'force' = 'move'): CaffeineState {
  const categories = drinkCategories(state)
  if (!categories.some(category => category.id === id)) throw new Error('카테고리를 찾을 수 없어요.')
  if (mode === 'force') {
    const ids = categoryDrinkIds(state, id)
    const overrides = Object.fromEntries(Object.entries(state.defaultDrinkCategoryOverrides ?? {}).filter(([drinkId]) => !ids.has(drinkId)))
    return pruneDrinkPhotoSnapshots(withCategoryCatalog({
      ...state,
      entries: state.entries.filter(entry => !ids.has(entry.drinkId)),
      customDrinks: state.customDrinks.filter(drink => !ids.has(drink.id)),
      deletedDefaultDrinkIds: [...new Set([...(state.deletedDefaultDrinkIds ?? []), ...DEFAULT_DRINKS.filter(drink => ids.has(drink.id)).map(drink => drink.id)])],
      defaultDrinkCategoryOverrides: overrides,
      ...(state.drinkOrder !== undefined ? { drinkOrder: state.drinkOrder.filter(drinkId => !ids.has(drinkId)) } : {}),
      ...(state.retainedDrinkPhotos ? { retainedDrinkPhotos: Object.fromEntries(Object.entries(state.retainedDrinkPhotos).filter(([drinkId]) => !ids.has(drinkId))) } : {}),
      ...(state.retainedDrinkCategories ? { retainedDrinkCategories: Object.fromEntries(Object.entries(state.retainedDrinkCategories).filter(([drinkId]) => !ids.has(drinkId))) } : {}),
    }, categories.filter(category => category.id !== id)))
  }
  if (destinationId !== undefined && (destinationId === id || !categories.some(category => category.id === destinationId))) throw new Error('옮길 카테고리를 다시 선택해 주세요.')
  if (destinationId === undefined && availableDrinks(state).some(drink => drink.categoryId === id)) throw new Error('음료를 옮길 카테고리를 선택해 주세요.')
  const overrides = { ...state.defaultDrinkCategoryOverrides }
  for (const drink of DEFAULT_DRINKS) {
    if ((overrides[drink.id] ?? drink.categoryId) !== id) continue
    if (destinationId !== undefined) overrides[drink.id] = destinationId
    // Only hidden drinks can reach this branch; keep them hidden without a dangling override.
    else delete overrides[drink.id]
  }
  return withCategoryCatalog({
    ...state,
    customDrinks: state.customDrinks.map(drink => drink.categoryId === id && destinationId !== undefined ? { ...drink, categoryId: destinationId } : drink),
    defaultDrinkCategoryOverrides: overrides,
    ...(state.retainedDrinkCategories && destinationId !== undefined ? { retainedDrinkCategories: Object.fromEntries(Object.entries(state.retainedDrinkCategories).map(([drinkId, categoryId]) => [drinkId, categoryId === id ? destinationId : categoryId])) } : {}),
  }, categories.filter(category => category.id !== id))
}

export function reorderDrinkCategories(state: CaffeineState, ids: DrinkCategoryId[]): CaffeineState {
  const categories = drinkCategories(state)
  const byId = new Map(categories.map(category => [category.id, category]))
  if (ids.length !== categories.length || new Set(ids).size !== ids.length || ids.some(id => !byId.has(id))) throw new Error('카테고리 순서를 확인해 주세요.')
  return withCategoryCatalog(state, ids.map(id => byId.get(id)!))
}

/** Category creation and drink creation are committed as one repository write. */
export function addCustomDrink(state: CaffeineState, input: CustomDrinkDraft, ids: { drinkId: string; categoryId: Extract<DrinkCategoryId, `custom:${string}`> }): { state: CaffeineState; drink: Drink } {
  const categoryName = input.categoryName.normalize('NFC').trim()
  if (!isValidCategoryName(categoryName)) throw new Error(`카테고리를 1~${MAX_CATEGORY_NAME_LENGTH}자로 입력해 주세요.`)
  const name = input.name.trim()
  if (!name || name.length > 30) throw new Error('음료 이름을 1~30자로 입력해 주세요.')
  if (!Number.isFinite(input.caffeineMg) || input.caffeineMg < 0 || input.caffeineMg > MAX_CAFFEINE_MG) throw new Error(`카페인량을 0~${MAX_CAFFEINE_MG}mg 사이로 입력해 주세요.`)
  if (input.photoDataUrl !== undefined && !isDrinkPhotoDataUrl(input.photoDataUrl)) throw new Error('사진의 형식이나 용량을 확인해 주세요.')
  const existing = drinkCategories(state).find(category => input.categoryId ? category.id === input.categoryId : categoryNameKey(category.name) === categoryNameKey(categoryName))
  if (input.categoryId && !existing) throw new Error('선택한 카테고리를 찾을 수 없어요. 음료 목록에서 다시 추가해 주세요.')
  const category: DrinkCategory = existing ?? { id: ids.categoryId, name: categoryName }
  if (availableDrinks(state).some(drink => drink.categoryId === category.id && drink.name === name)) throw new Error('같은 카테고리에 이미 있는 이름이에요. 다른 이름을 입력해 주세요.')
  const drink: Drink = { id: ids.drinkId, categoryId: category.id, name, caffeineMg: input.caffeineMg, icon: input.icon, ...(input.photoDataUrl ? { photoDataUrl: input.photoDataUrl } : {}), ...(input.servingMl !== undefined ? { servingMl: input.servingMl } : {}), isCustom: true, sourceType: 'custom' }
  const next = { ...state, customCategories: existing ? state.customCategories : [...state.customCategories, category], customDrinks: [...state.customDrinks, drink] }
  return {
    drink,
    state: !existing && state.categoryCatalog !== undefined ? withCategoryCatalog(next, [...state.categoryCatalog, category]) : next,
  }
}

/** Intake records contain their own name, dose and icon and survive removal. */
export function deleteDrinkFromCatalog(state: CaffeineState, id: string): CaffeineState {
  const customDrink = state.customDrinks.find(drink => drink.id === id && drink.isCustom)
  if (customDrink) {
    return {
      ...state,
      customDrinks: state.customDrinks.filter(drink => drink.id !== id),
      ...(state.drinkOrder !== undefined ? { drinkOrder: state.drinkOrder.filter(drinkId => drinkId !== id) } : {}),
      ...(state.entries.some(entry => entry.drinkId === id) ? { retainedDrinkCategories: { ...state.retainedDrinkCategories, [id]: customDrink.categoryId } } : {}),
      ...(customDrink.photoDataUrl && state.entries.some(entry => entry.drinkId === id)
        ? { retainedDrinkPhotos: { ...state.retainedDrinkPhotos, [id]: customDrink.photoDataUrl } } : {}),
    }
  }
  if (!DEFAULT_DRINKS.some(drink => drink.id === id) || state.deletedDefaultDrinkIds?.includes(id)) {
    throw new Error('목록에서 음료를 찾을 수 없어요.')
  }
  return {
    ...state,
    deletedDefaultDrinkIds: [...(state.deletedDefaultDrinkIds ?? []), id],
    ...(state.drinkOrder !== undefined ? { drinkOrder: state.drinkOrder.filter(drinkId => drinkId !== id) } : {}),
  }
}
