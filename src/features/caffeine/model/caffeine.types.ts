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

export type CustomDrinkDraft = Omit<Drink, 'id' | 'isCustom' | 'sourceType' | 'categoryId'> & { categoryName: string; categoryId?: DrinkCategoryId }
export type DrinkEditDraft = Pick<Drink, 'name' | 'caffeineMg' | 'icon' | 'photoDataUrl'>

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
  /** Optional memo for this intake, up to 100 Unicode characters. */
  note?: string
}

/** Legacy stored preference, retained for data compatibility; the UI is dark only. */
export type AppTheme = 'light' | 'dark'

export interface CaffeineSettings {
  halfLifeHours: number
  /** Local planned bedtime (HH:mm), shared by Home and Reports. */
  bedtime?: string
  /** User opt-in for device tilt; native sensor permission is separate. */
  tiltAnimation?: boolean
  /** Absent for existing users until they choose an appearance on this device. */
  theme?: AppTheme
}

export interface DrinkPhotoHistory {
  /** Explicit null preserves the original icon for an intake with no photo. */
  entryDrinkPhotoIds?: Record<string, string | null>
  /** Thumbnails shared by intake snapshots; each photo is stored only once. */
  drinkPhotoSnapshots?: Record<string, string>
  /** Legacy photos of removed drinks, while intake records reference them. */
  retainedDrinkPhotos?: Record<string, string>
}

export interface CaffeineState extends DrinkPhotoHistory {
  version: 4
  entries: CaffeineEntry[]
  customDrinks: Drink[]
  /** Last category of removed custom drinks, while their history exists. */
  retainedDrinkCategories?: Record<string, DrinkCategoryId>
  customCategories: DrinkCategory[]
  /** Authoritative category names and order after the first category edit. */
  categoryCatalog?: DrinkCategory[]
  /** Stable default drink IDs whose category was changed by a category move. */
  defaultDrinkCategoryOverrides?: Record<string, DrinkCategoryId>
  /** User-edited details of built-in drinks; IDs, membership and history remain stable. */
  defaultDrinkDetailsOverrides?: Record<string, DrinkEditDraft>
  /** Default drinks removed from this device's catalog; historical entries remain. */
  deletedDefaultDrinkIds?: string[]
  /** Stable drink IDs in display order within each category; new IDs follow saved IDs. */
  drinkOrder?: string[]
  settings: CaffeineSettings
  /** Opaque archive of retired feedback; never used by the app. */
  legacyPersonalization?: unknown
  /** Migration provenance only; never used for current estimates. */
  legacyHalfLifeHours?: number
}
