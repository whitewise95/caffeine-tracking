export type DrinkIconType = 'coffee' | 'cup' | 'tea' | 'bottle' | 'bolt' | 'can'

export type BuiltinDrinkCategoryId = 'coffee' | 'tea' | 'energy' | 'other' | 'misc'
export type DrinkCategoryId = BuiltinDrinkCategoryId | `custom:${string}`

export interface DrinkCategory {
  id: DrinkCategoryId
  name: string
}

export type CaffeineVisualLevel = 'LOW' | 'LIGHT' | 'FILLED' | 'HIGH_VISUAL'

export interface Drink {
  id: string
  categoryId: DrinkCategoryId
  name: string
  caffeineMg: number
  icon: DrinkIconType
  photoDataUrl?: string
  servingMl?: number
  sourceType: 'sample' | 'official' | 'custom'
  isCustom: boolean
}

export type CustomDrinkDraft = Omit<Drink, 'id' | 'isCustom' | 'sourceType' | 'categoryId'> & { categoryName: string }

export interface CaffeineIntakeTiming {
  /** Finish time for a slow drink, or the single consumption time otherwise. */
  consumedAt: string
  /** Start time of an optional uniform intake interval, strictly before consumedAt. */
  startedAt?: string
}

export interface CaffeineEntry extends CaffeineIntakeTiming {
  id: string
  drinkId: string
  drinkName: string
  caffeineMg: number
  icon: DrinkIconType
  sourceType?: Drink['sourceType']
}

export type AppTheme = 'light' | 'dark'

export interface CaffeineSettings {
  halfLifeHours: number
  /** Absent for existing users until they choose an appearance on this device. */
  theme?: AppTheme
}

export interface CaffeineState {
  version: 4
  entries: CaffeineEntry[]
  customDrinks: Drink[]
  customCategories: DrinkCategory[]
  /** Authoritative category names and order after the first category edit. */
  categoryCatalog?: DrinkCategory[]
  /** Stable default drink IDs whose category was changed by a category move. */
  defaultDrinkCategoryOverrides?: Record<string, DrinkCategoryId>
  /** Default drinks removed from this device's catalog; historical entries remain. */
  deletedDefaultDrinkIds?: string[]
  settings: CaffeineSettings
  /** Opaque archive of retired feedback; never used by the app. */
  legacyPersonalization?: unknown
  /** Migration provenance only; never used for current estimates. */
  legacyHalfLifeHours?: number
}
