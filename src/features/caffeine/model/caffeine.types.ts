export type DrinkIconType = 'coffee' | 'cup' | 'tea' | 'bottle' | 'bolt' | 'can'

export type DrinkCategoryId = 'coffee' | 'tea' | 'energy' | 'other'

export type CaffeineVisualLevel = 'LOW' | 'LIGHT' | 'FILLED' | 'HIGH_VISUAL'

export interface Drink {
  id: string
  categoryId: DrinkCategoryId
  name: string
  caffeineMg: number
  icon: DrinkIconType
  servingMl?: number
  sourceType: 'sample' | 'official' | 'custom'
  isCustom: boolean
}

export interface CaffeineEntry {
  id: string
  drinkId: string
  drinkName: string
  caffeineMg: number
  consumedAt: string
  icon: DrinkIconType
  sourceType?: Drink['sourceType']
}

export interface CaffeineSettings {
  halfLifeHours: number
}

export interface CaffeineState {
  version: 2
  entries: CaffeineEntry[]
  customDrinks: Drink[]
  settings: CaffeineSettings
  personalization: PersonalizationState
  /** Migration provenance only; never used for current estimates. */
  legacyHalfLifeHours?: number
}
import type { PersonalizationState } from '../../personalization/model/types'
