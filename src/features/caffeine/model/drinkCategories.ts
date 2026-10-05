import { isDrinkPhotoDataUrl } from './drinkPhoto'
import { CATEGORIES, DEFAULT_DRINKS } from '../data/defaultDrinks'
import { MAX_CAFFEINE_MG } from './caffeine'
import type { CaffeineState, CustomDrinkDraft, Drink, DrinkCategory, DrinkCategoryId } from './caffeine.types'

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

export function availableDrinks(state: Pick<CaffeineState, 'customDrinks' | 'deletedDefaultDrinkIds' | 'categoryCatalog' | 'defaultDrinkCategoryOverrides'>): Drink[] {
  const deletedIds = new Set(state.deletedDefaultDrinkIds ?? [])
  const defaults = DEFAULT_DRINKS.filter(drink => !deletedIds.has(drink.id)).map(drink => {
    const categoryId = state.defaultDrinkCategoryOverrides?.[drink.id]
    return categoryId === undefined ? drink : { ...drink, categoryId }
  })
  const drinks = [...defaults, ...state.customDrinks]
  if (state.categoryCatalog === undefined) return drinks
  const order = new Map(state.categoryCatalog.map((category, index) => [category.id, index]))
  return drinks.sort((left, right) => (order.get(left.categoryId) ?? 0) - (order.get(right.categoryId) ?? 0))
}

function withCategoryCatalog(state: CaffeineState, categories: DrinkCategory[]): CaffeineState {
  return { ...state, categoryCatalog: categories, customCategories: categories.filter(category => category.id.startsWith('custom:')) }
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

/** Move every current drink before removing its category in the same state/write. */
export function deleteDrinkCategory(state: CaffeineState, id: DrinkCategoryId, destinationId?: DrinkCategoryId): CaffeineState {
  const categories = drinkCategories(state)
  if (!categories.some(category => category.id === id)) throw new Error('카테고리를 찾을 수 없어요.')
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
  const existing = drinkCategories(state).find(category => categoryNameKey(category.name) === categoryNameKey(categoryName))
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
  if (state.customDrinks.some(drink => drink.id === id && drink.isCustom)) {
    return { ...state, customDrinks: state.customDrinks.filter(drink => drink.id !== id) }
  }
  if (!DEFAULT_DRINKS.some(drink => drink.id === id) || state.deletedDefaultDrinkIds?.includes(id)) {
    throw new Error('목록에서 음료를 찾을 수 없어요.')
  }
  return { ...state, deletedDefaultDrinkIds: [...(state.deletedDefaultDrinkIds ?? []), id] }
}
