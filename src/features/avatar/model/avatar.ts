import { AVATAR_CATEGORIES, AVATAR_ITEMS } from '../data/avatarCatalog'
import type { AvatarOutfit } from './avatar.types'

const itemSlots = new Map(AVATAR_ITEMS.map(item => [item.id, item.slot]))

export function emptyOutfit(): AvatarOutfit {
  return { hat: null, glasses: null, top: null, bottom: null, shoes: null, accessory: null }
}

/** A retired or misplaced item only clears its own slot. */
export function sanitizeOutfit(value: unknown): AvatarOutfit {
  const outfit = emptyOutfit()
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return outfit
  const candidate = value as Record<string, unknown>
  for (const { id: slot } of AVATAR_CATEGORIES) {
    const id = candidate[slot]
    if (typeof id === 'string' && itemSlots.get(id) === slot) outfit[slot] = id
  }
  return outfit
}

export function outfitsEqual(left: AvatarOutfit, right: AvatarOutfit): boolean {
  return AVATAR_CATEGORIES.every(({ id }) => left[id] === right[id])
}
