import { createInitialState, DEFAULT_CAFFEINE_HALF_LIFE_HOURS, MAX_CAFFEINE_MG } from '../model/caffeine'
import type { CaffeineEntry, CaffeineState, Drink } from '../model/caffeine.types'
import type { CaffeineRepository, CaffeineStorage } from './CaffeineRepository'
import { isPersonalizationState, createPersonalizationState } from '../../personalization/model'

export const CAFFEINE_STORAGE_KEY = 'caffeine-tracker:state:v1'

const DRINK_ICONS = new Set(['coffee', 'cup', 'tea', 'bottle', 'bolt', 'can'])
const DRINK_CATEGORIES = new Set(['coffee', 'tea', 'energy', 'other'])

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
    && DRINK_CATEGORIES.has(value.categoryId)
    && typeof value.icon === 'string'
    && DRINK_ICONS.has(value.icon)
    && value.isCustom === true
    && value.sourceType === 'custom'
    && (value.servingMl === undefined || (typeof value.servingMl === 'number' && Number.isFinite(value.servingMl) && value.servingMl > 0))
}

function hasUniqueIds(values: readonly { id: string }[]): boolean {
  return new Set(values.map((value) => value.id)).size === values.length
}

type LegacyState = Omit<CaffeineState, 'version' | 'personalization'> & { version: 1 }

function assertState(value: unknown): asserts value is CaffeineState | LegacyState {
  if (!isObject(value)
    || (value.version !== 1 && value.version !== 2)
    || !Array.isArray(value.entries)
    || !value.entries.every(isEntry)
    || !hasUniqueIds(value.entries)
    || !Array.isArray(value.customDrinks)
    || !value.customDrinks.every(isCustomDrink)
    || !hasUniqueIds(value.customDrinks)
    || !isObject(value.settings)
    || typeof value.settings.halfLifeHours !== 'number'
    || !Number.isFinite(value.settings.halfLifeHours)
    || value.settings.halfLifeHours <= 0
    || (value.version === 2 && (value.settings.halfLifeHours !== DEFAULT_CAFFEINE_HALF_LIFE_HOURS || !isPersonalizationState(value.personalization)))
    || (value.legacyHalfLifeHours !== undefined && (typeof value.legacyHalfLifeHours !== 'number' || !Number.isFinite(value.legacyHalfLifeHours) || value.legacyHalfLifeHours <= 0))) {
    throw new Error('저장된 기록의 형식을 확인할 수 없어요. 데이터는 그대로 보관하고 있어요.')
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
    assertState(parsed)
    if (parsed.version === 1) {
      return {
        ...parsed,
        version: 2,
        settings: { halfLifeHours: DEFAULT_CAFFEINE_HALF_LIFE_HOURS },
        legacyHalfLifeHours: parsed.settings.halfLifeHours,
        personalization: createPersonalizationState(),
      }
    }
    return parsed
  }

  async save(state: CaffeineState): Promise<void> {
    assertState(state)
    if (state.version !== 2) throw new Error('지원하지 않는 저장 형식이에요.')
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
