import type { CaffeineStorage } from '../../caffeine/repository/CaffeineRepository'
import { emptyOutfit, sanitizeOutfit } from '../model/avatar'
import type { AvatarOutfit } from '../model/avatar.types'
import type { AvatarRepository } from './AvatarRepository'

// Separate from caffeine state so avatar saves cannot overwrite newer drink data.
export const AVATAR_STORAGE_KEY = 'caffeine-tracker:avatar:v1'

export class LocalAvatarRepository implements AvatarRepository {
  constructor(private readonly storage?: CaffeineStorage) {}

  private getStorage(): CaffeineStorage {
    return this.storage ?? window.localStorage
  }

  async load(): Promise<AvatarOutfit> {
    let raw: string | null
    try {
      raw = await this.getStorage().getItem(AVATAR_STORAGE_KEY)
    } catch (cause) {
      throw new Error('꾸미기 정보를 불러오지 못했어요. 다시 시도해 주세요.', { cause })
    }
    if (raw === null) return emptyOutfit()

    // Invalid avatar data must never prevent recording caffeine. Reading never
    // rewrites the stored bytes, including unknown future versions.
    try {
      const value: unknown = JSON.parse(raw)
      if (typeof value !== 'object' || value === null || Array.isArray(value)) return emptyOutfit()
      const stored = value as Record<string, unknown>
      return stored.version === 1 ? sanitizeOutfit(stored.outfit) : emptyOutfit()
    } catch {
      return emptyOutfit()
    }
  }

  async save(outfit: AvatarOutfit): Promise<void> {
    try {
      await this.getStorage().setItem(AVATAR_STORAGE_KEY, JSON.stringify({ version: 1, outfit: sanitizeOutfit(outfit) }))
    } catch (cause) {
      throw new Error('꾸미기를 저장하지 못했어요. 다시 시도해 주세요.', { cause })
    }
  }

  async reset(): Promise<void> {
    try {
      await this.getStorage().removeItem(AVATAR_STORAGE_KEY)
    } catch (cause) {
      throw new Error('꾸미기 정보를 초기화하지 못했어요. 다시 시도해 주세요.', { cause })
    }
  }
}
