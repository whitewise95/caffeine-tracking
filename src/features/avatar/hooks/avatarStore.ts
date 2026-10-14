import { emptyOutfit, outfitsEqual, sanitizeOutfit } from '../model/avatar'
import type { AvatarOutfit } from '../model/avatar.types'
import type { AvatarRepository } from '../repository/AvatarRepository'

type AvatarSnapshot = {
  outfit: AvatarOutfit
  loaded: boolean
  loading: boolean
  busy: boolean
  error: string
}

/** Saved state only. The wardrobe owns its separate, unsaved preview. */
export class AvatarStore {
  private snapshot: AvatarSnapshot = { outfit: emptyOutfit(), loaded: false, loading: true, busy: false, error: '' }
  private readonly listeners = new Set<() => void>()
  private locked = false
  private loadSequence = 0

  constructor(private readonly repository: AvatarRepository) {}

  getSnapshot = (): AvatarSnapshot => this.snapshot

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private publish(change: Partial<AvatarSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...change }
    this.listeners.forEach(listener => listener())
  }

  reload = async (): Promise<void> => {
    if (this.locked) return
    const sequence = ++this.loadSequence
    this.publish({ loading: true, error: '' })
    try {
      const outfit = await this.repository.load()
      if (sequence === this.loadSequence) this.publish({ outfit: sanitizeOutfit(outfit), loaded: true })
    } catch (cause) {
      if (sequence === this.loadSequence) this.publish({ loaded: false, error: cause instanceof Error ? cause.message : '꾸미기 정보를 불러오지 못했어요. 다시 시도해 주세요.' })
    } finally {
      if (sequence === this.loadSequence) this.publish({ loading: false })
    }
  }

  save = async (outfit: AvatarOutfit): Promise<boolean> => {
    if (this.locked || !this.snapshot.loaded || this.snapshot.loading) return false
    const next = sanitizeOutfit(outfit)
    if (outfitsEqual(next, this.snapshot.outfit)) return true
    return this.write(() => this.repository.save(next), next)
  }

  reset = async (): Promise<boolean> => {
    if (this.locked) return false
    return this.write(() => this.repository.reset(), emptyOutfit())
  }

  private async write(operation: () => Promise<void>, outfit: AvatarOutfit): Promise<boolean> {
    // Set synchronously: two clicks before React renders still produce one write.
    this.locked = true
    ++this.loadSequence
    this.publish({ busy: true, loading: false, error: '' })
    try {
      await operation()
      this.publish({ outfit, loaded: true })
      return true
    } catch (cause) {
      this.publish({ error: cause instanceof Error ? cause.message : '꾸미기를 저장하지 못했어요. 다시 시도해 주세요.' })
      return false
    } finally {
      this.locked = false
      this.publish({ busy: false })
    }
  }
}
