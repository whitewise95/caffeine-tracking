export type AvatarSlot = 'hat' | 'glasses' | 'top' | 'bottom' | 'shoes' | 'accessory'

export type AvatarOutfit = Record<AvatarSlot, string | null>

export type AvatarItem = {
  id: string
  slot: AvatarSlot
  name: string
}
