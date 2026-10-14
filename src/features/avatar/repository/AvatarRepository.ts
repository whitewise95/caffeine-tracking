import type { AvatarOutfit } from '../model/avatar.types'

export interface AvatarRepository {
  load(): Promise<AvatarOutfit>
  save(outfit: AvatarOutfit): Promise<void>
  reset(): Promise<void>
}
