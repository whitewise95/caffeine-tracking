import { isDrinkPhotoDataUrl } from '../model/drinkPhoto'
import { createInitialState, DEFAULT_CAFFEINE_HALF_LIFE_HOURS, MAX_CAFFEINE_MG } from '../model/caffeine'
import type { CaffeineEntry, CaffeineState, Drink, DrinkCategory } from '../model/caffeine.types'
import { categoryNameKey, drinkCategories, isValidCategoryName } from '../model/drinkCategories'
import type { CaffeineRepository, CaffeineStorage } from './CaffeineRepository'
import { CATEGORIES, DEFAULT_DRINKS } from '../data/defaultDrinks'

export const CAFFEINE_STORAGE_KEY = 'caffeine-tracker:state:v1'

const DRINK_ICONS = new Set(['coffee', 'cup', 'tea', 'bottle', 'bolt', 'can'])
const BUILTIN_CATEGORY_IDS = new Set([...CATEGORIES.map(category => category.id), 'misc'])
const DEFAULT_DRINK_IDS = new Set(DEFAULT_DRINKS.map(drink => drink.id))
// Accepted only when reading records saved before the fixed default changed.
const PREVIOUS_FIXED_HALF_LIFE_HOURS = 5

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isCaffeineMg(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_CAFFEINE_MG
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false
  if (!Number.isFinite(Date.parse(value))) return false

  // Date.parse rolls impossible dates such as February 30 into the next month.
  const calendarDate = value.slice(0, 10)
  const parsedDay = new Date(`${calendarDate}T00:00:00.000Z`)
  return Number.isFinite(parsedDay.getTime()) && parsedDay.toISOString().slice(0, 10) === calendarDate
}

function isEntry(value: unknown): value is CaffeineEntry {
  return isObject(value)
    && isText(value.id)
    && isText(value.drinkId)
    && isText(value.drinkName)
    && isCaffeineMg(value.caffeineMg)
    && isIsoTimestamp(value.consumedAt)
    && (value.startedAt === undefined || (isIsoTimestamp(value.startedAt) && Date.parse(value.startedAt) < Date.parse(value.consumedAt)))
    && typeof value.icon === 'string'
    && DRINK_ICONS.has(value.icon)
    && (value.sourceType === undefined || ['sample', 'official', 'custom'].includes(String(value.sourceType)))
}

function isCustomDrink(value: unknown): value is Drink {
  return isObject(value)
    && isText(value.id)
    && isText(value.name)
    && isCaffeineMg(value.caffeineMg)
    && typeof value.categoryId === 'string'
    && isText(value.categoryId)
    && typeof value.icon === 'string'
    && DRINK_ICONS.has(value.icon)
    && (value.photoDataUrl === undefined || isDrinkPhotoDataUrl(value.photoDataUrl))
    && value.isCustom === true
    && value.sourceType === 'custom'
    && (value.servingMl === undefined || (typeof value.servingMl === 'number' && Number.isFinite(value.servingMl) && value.servingMl > 0))
}

function hasUniqueIds(values: readonly { id: string }[]): boolean {
  return new Set(values.map((value) => value.id)).size === values.length
}

function isCustomCategory(value: unknown): value is DrinkCategory {
  return isObject(value) && isText(value.id) && value.id.startsWith('custom:') && categoryNameKey(value.id.slice(7)).length > 0
    && typeof value.name === 'string' && isValidCategoryName(value.name)
}

function isCategory(value: unknown): value is DrinkCategory {
  return isCustomCategory(value) || (isObject(value) && typeof value.id === 'string' && BUILTIN_CATEGORY_IDS.has(value.id)
    && typeof value.name === 'string' && isValidCategoryName(value.name))
}

type StoredState = Omit<CaffeineState, 'version' | 'customCategories'> & { version: 1 | 2 | 3 | 4; customCategories?: DrinkCategory[]; personalization?: unknown }

function assertState(value: unknown, allowStoredMigrations = false): asserts value is StoredState {
  if (!isObject(value)
    || (value.version !== 1 && value.version !== 2 && value.version !== 3 && value.version !== 4)
    || !Array.isArray(value.entries)
    || !value.entries.every(isEntry)
    || !hasUniqueIds(value.entries)
    || !Array.isArray(value.customDrinks)
    || !value.customDrinks.every(isCustomDrink)
    || !hasUniqueIds(value.customDrinks)
    || (value.deletedDefaultDrinkIds !== undefined && (!Array.isArray(value.deletedDefaultDrinkIds)
      || !value.deletedDefaultDrinkIds.every(isText)
      || new Set(value.deletedDefaultDrinkIds).size !== value.deletedDefaultDrinkIds.length))
    || (value.version === 4 && (!Array.isArray(value.customCategories) || !value.customCategories.every(isCustomCategory) || !hasUniqueIds(value.customCategories)))
    || !isObject(value.settings)
    || typeof value.settings.halfLifeHours !== 'number'
    || !Number.isFinite(value.settings.halfLifeHours)
    || value.settings.halfLifeHours <= 0
    || (value.version !== 1
      && value.settings.halfLifeHours !== DEFAULT_CAFFEINE_HALF_LIFE_HOURS
      && !(allowStoredMigrations && value.settings.halfLifeHours === PREVIOUS_FIXED_HALF_LIFE_HOURS))
    || (value.legacyHalfLifeHours !== undefined && (typeof value.legacyHalfLifeHours !== 'number' || !Number.isFinite(value.legacyHalfLifeHours) || value.legacyHalfLifeHours <= 0))) {
    throw new Error('저장된 기록의 형식을 확인할 수 없어요. 데이터는 그대로 보관하고 있어요.')
  }
  const catalog = value.categoryCatalog
  if (catalog !== undefined) {
    if (value.version !== 4 || !Array.isArray(catalog) || !catalog.every(isCategory) || !hasUniqueIds(catalog)) {
      throw new Error('저장된 카테고리의 형식을 확인할 수 없어요. 데이터는 그대로 보관하고 있어요.')
    }
    const customCatalog = catalog.filter(category => category.id.startsWith('custom:'))
    const customCategories = value.customCategories as DrinkCategory[]
    if (customCatalog.length !== customCategories.length || customCatalog.some((category, index) => category.id !== customCategories[index].id || category.name !== customCategories[index].name)) {
      throw new Error('저장된 카테고리의 형식을 확인할 수 없어요. 데이터는 그대로 보관하고 있어요.')
    }
  }
  const overrides = value.defaultDrinkCategoryOverrides
  if (overrides !== undefined && (catalog === undefined || !isObject(overrides)
    || !Object.entries(overrides).every(([id, categoryId]) => DEFAULT_DRINK_IDS.has(id) && typeof categoryId === 'string' && (catalog as DrinkCategory[]).some(category => category.id === categoryId)))) {
    throw new Error('저장된 음료 분류를 확인할 수 없어요. 데이터는 그대로 보관하고 있어요.')
  }
  const categories = drinkCategories({ customDrinks: value.customDrinks, customCategories: value.version === 4 ? value.customCategories as DrinkCategory[] : [], ...(catalog !== undefined ? { categoryCatalog: catalog as DrinkCategory[] } : {}) })
  const ids = new Set(categories.map(category => category.id))
  const nameCategories = allowStoredMigrations && catalog === undefined ? categories.filter(category => !['energy', 'other', 'misc'].includes(category.id)) : categories
  const names = nameCategories.map(category => categoryNameKey(category.name))
  if (new Set(names).size !== names.length || !value.customDrinks.every(drink => ids.has(drink.categoryId))) {
    throw new Error('저장된 카테고리의 형식을 확인할 수 없어요. 데이터는 그대로 보관하고 있어요.')
  }
  if (catalog !== undefined) {
    const deletedIds = new Set(value.deletedDefaultDrinkIds as string[] | undefined)
    const defaultOverrides = overrides as CaffeineState['defaultDrinkCategoryOverrides']
    if (DEFAULT_DRINKS.some(drink => !deletedIds.has(drink.id) && !ids.has(defaultOverrides?.[drink.id] ?? drink.categoryId))) {
      throw new Error('저장된 음료 분류를 확인할 수 없어요. 데이터는 그대로 보관하고 있어요.')
    }
  }
}

export class LocalCaffeineRepository implements CaffeineRepository {
  private readonly storage?: CaffeineStorage

  constructor(storage?: CaffeineStorage) {
    this.storage = storage
  }

  private getStorage(): CaffeineStorage {
    return this.storage ?? window.localStorage
  }

  async load(): Promise<CaffeineState> {
    let raw: string | null
    try {
      raw = await this.getStorage().getItem(CAFFEINE_STORAGE_KEY)
    } catch (cause) {
      throw new Error('기록을 불러오지 못했어요. 저장소 접근을 확인해 주세요.', { cause })
    }

    if (raw === null) return createInitialState()

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch (cause) {
      throw new Error('저장된 기록을 읽을 수 없어요. 데이터는 그대로 보관하고 있어요.', { cause })
    }
    assertState(parsed, true)
    const originalCategories = parsed.version === 4 ? parsed.customCategories! : []
    const builtinCategories = drinkCategories({ customDrinks: parsed.customDrinks, customCategories: [] })
    const categoryAliases = new Map(parsed.categoryCatalog !== undefined ? [] : originalCategories.flatMap(category => {
      const builtin = builtinCategories.find(item => categoryNameKey(item.name) === categoryNameKey(category.name))
      return builtin ? [[category.id, builtin.id] as const] : []
    }))
    // Retired feedback is archived without validation or interpretation. Invalid
    // feedback must not prevent access to otherwise valid drink records.
    return {
      version: 4,
      entries: parsed.entries,
      customDrinks: parsed.customDrinks.map(drink => categoryAliases.has(drink.categoryId) ? { ...drink, categoryId: categoryAliases.get(drink.categoryId)! } : drink),
      customCategories: originalCategories.filter(category => !categoryAliases.has(category.id)),
      ...(parsed.categoryCatalog !== undefined ? { categoryCatalog: parsed.categoryCatalog } : {}),
      ...(parsed.defaultDrinkCategoryOverrides !== undefined ? { defaultDrinkCategoryOverrides: parsed.defaultDrinkCategoryOverrides } : {}),
      ...(parsed.deletedDefaultDrinkIds !== undefined ? { deletedDefaultDrinkIds: parsed.deletedDefaultDrinkIds } : {}),
      settings: { halfLifeHours: DEFAULT_CAFFEINE_HALF_LIFE_HOURS },
      ...(parsed.version === 1 ? { legacyHalfLifeHours: parsed.settings.halfLifeHours } : parsed.legacyHalfLifeHours !== undefined ? { legacyHalfLifeHours: parsed.legacyHalfLifeHours } : {}),
      ...(parsed.legacyPersonalization !== undefined ? { legacyPersonalization: parsed.legacyPersonalization } : parsed.personalization !== undefined ? { legacyPersonalization: parsed.personalization } : {}),
    }
  }

  async save(state: CaffeineState): Promise<void> {
    assertState(state)
    if (state.version !== 4) throw new Error('지원하지 않는 저장 형식이에요.')
    try {
      await this.getStorage().setItem(CAFFEINE_STORAGE_KEY, JSON.stringify(state))
    } catch (cause) {
      throw new Error('기록을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.', { cause })
    }
  }

  async reset(): Promise<void> {
    try {
      await this.getStorage().removeItem(CAFFEINE_STORAGE_KEY)
    } catch (cause) {
      throw new Error('데이터를 초기화하지 못했어요. 다시 시도해 주세요.', { cause })
    }
  }
}
