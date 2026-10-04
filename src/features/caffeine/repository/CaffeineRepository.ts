import type { CaffeineState } from '../model/caffeine.types'

export interface CaffeineRepository {
  load(): Promise<CaffeineState>
  save(state: CaffeineState): Promise<void>
  reset(): Promise<void>
}

/** Compatible with browser Storage and asynchronous platform storage adapters. */
export interface CaffeineStorage {
  getItem(key: string): string | null | Promise<string | null>
  setItem(key: string, value: string): void | Promise<void>
  removeItem(key: string): void | Promise<void>
}
