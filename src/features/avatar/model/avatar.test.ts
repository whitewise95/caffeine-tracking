import { describe, expect, it } from 'vitest'
import { AVATAR_CATEGORIES, AVATAR_ITEMS } from '../data/avatarCatalog'
import { emptyOutfit, outfitsEqual, sanitizeOutfit } from './avatar'

describe('avatar catalog and outfit', () => {
  it('provides six independent slots and ten unique, named items for each', () => {
    expect(AVATAR_CATEGORIES.map(category => category.id)).toEqual(['hat', 'glasses', 'top', 'bottom', 'shoes', 'accessory'])
    expect(AVATAR_ITEMS).toHaveLength(60)
    expect(new Set(AVATAR_ITEMS.map(item => item.id)).size).toBe(60)
    for (const category of AVATAR_CATEGORIES) {
      const items = AVATAR_ITEMS.filter(item => item.slot === category.id)
      expect(items).toHaveLength(10)
      expect(items.every(item => item.id.startsWith(`${item.slot}-`) && item.name.length > 0)).toBe(true)
      expect(new Set(items.map(item => item.name)).size).toBe(10)
    }
  })

  it('returns a fresh bare outfit for every request', () => {
    const first = emptyOutfit()
    first.hat = 'hat-beanie'
    expect(emptyOutfit()).toEqual({ hat: null, glasses: null, top: null, bottom: null, shoes: null, accessory: null })
  })

  it('keeps valid slots while removing unknown, wrong-slot and malformed values', () => {
    expect(sanitizeOutfit({ hat: 'hat-crown', glasses: 'hat-beanie', top: 'unknown', bottom: 4, shoes: null, accessory: 'accessory-bird', extra: 'hat-cap' }))
      .toEqual({ hat: 'hat-crown', glasses: null, top: null, bottom: null, shoes: null, accessory: 'accessory-bird' })
    expect(sanitizeOutfit({ glasses: 'glasses-cat-eye', top: 'top-zip-hoodie', bottom: 'bottom-a-line', shoes: 'shoes-mary-jane' }))
      .toEqual({ ...emptyOutfit(), glasses: 'glasses-cat-eye', top: 'top-zip-hoodie', bottom: 'bottom-a-line', shoes: 'shoes-mary-jane' })
  })

  it.each([null, undefined, '', 0, [], ['hat-beanie']])('treats malformed outfit %j as bare', value => {
    expect(sanitizeOutfit(value)).toEqual(emptyOutfit())
  })

  it('compares every slot without depending on property order or object identity', () => {
    expect(outfitsEqual(emptyOutfit(), { accessory: null, shoes: null, bottom: null, top: null, glasses: null, hat: null })).toBe(true)
    for (const item of AVATAR_ITEMS) {
      expect(outfitsEqual(emptyOutfit(), { ...emptyOutfit(), [item.slot]: item.id })).toBe(false)
    }
  })
})
