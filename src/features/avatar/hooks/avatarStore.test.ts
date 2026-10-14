import { describe, expect, it, vi } from 'vitest'
import { emptyOutfit } from '../model/avatar'
import type { AvatarOutfit } from '../model/avatar.types'
import type { AvatarRepository } from '../repository/AvatarRepository'
import { AvatarStore } from './avatarStore'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function repository(outfit = emptyOutfit()): AvatarRepository {
  return { load: async () => outfit, save: async () => {}, reset: async () => {} }
}

describe('avatar saved state', () => {
  it('publishes only after storage succeeds and suppresses overlapping writes', async () => {
    const pending = deferred<void>()
    const storage = repository()
    const save = vi.spyOn(storage, 'save').mockReturnValue(pending.promise)
    const store = new AvatarStore(storage)
    await store.reload()
    const next = { ...emptyOutfit(), hat: 'hat-beanie' }
    const first = store.save(next)
    expect(store.getSnapshot().busy).toBe(true)
    expect(store.getSnapshot().outfit).toEqual(emptyOutfit())
    expect(await store.save(next)).toBe(false)
    expect(await store.reset()).toBe(false)
    expect(save).toHaveBeenCalledOnce()
    next.hat = 'hat-crown'
    pending.resolve()
    expect(await first).toBe(true)
    expect(store.getSnapshot()).toMatchObject({ busy: false, loaded: true, outfit: { ...emptyOutfit(), hat: 'hat-beanie' } })
    expect(await store.save(store.getSnapshot().outfit)).toBe(true)
    expect(save).toHaveBeenCalledOnce()
  })

  it('retains saved outfit on write failure and permits a retry', async () => {
    const original = { ...emptyOutfit(), glasses: 'glasses-round' }
    const storage = repository(original)
    vi.spyOn(storage, 'save').mockRejectedValueOnce(new Error('저장 실패')).mockResolvedValue(undefined)
    const store = new AvatarStore(storage)
    await store.reload()
    const next = { ...original, hat: 'hat-crown' }
    expect(await store.save(next)).toBe(false)
    expect(store.getSnapshot()).toMatchObject({ outfit: original, error: '저장 실패', busy: false })
    expect(await store.save(next)).toBe(true)
    expect(store.getSnapshot()).toMatchObject({ outfit: next, error: '' })
  })

  it('preserves known outfit after a read failure and blocks accidental overwrite', async () => {
    const original = { ...emptyOutfit(), shoes: 'shoes-running' }
    const storage = repository(original)
    const load = vi.spyOn(storage, 'load')
    const save = vi.spyOn(storage, 'save')
    const store = new AvatarStore(storage)
    await store.reload()
    load.mockRejectedValueOnce(new Error('읽기 실패'))
    await store.reload()
    expect(store.getSnapshot()).toMatchObject({ outfit: original, loading: false, loaded: false, error: '읽기 실패' })
    expect(await store.save(emptyOutfit())).toBe(false)
    expect(save).not.toHaveBeenCalled()
    await store.reload()
    expect(store.getSnapshot()).toMatchObject({ loaded: true, error: '', outfit: original })
  })

  it('ignores a slower previous load result', async () => {
    const older = deferred<AvatarOutfit>()
    const latest = { ...emptyOutfit(), top: 'top-cardigan' }
    const storage = repository(latest)
    vi.spyOn(storage, 'load').mockReturnValueOnce(older.promise)
    const store = new AvatarStore(storage)
    const first = store.reload()
    await store.reload()
    older.resolve({ ...emptyOutfit(), top: 'top-tee' })
    await first
    expect(store.getSnapshot().outfit).toEqual(latest)
  })

  it('does not let an obsolete read failure undo a completed reset', async () => {
    const pending = deferred<AvatarOutfit>()
    const storage = repository()
    vi.spyOn(storage, 'load').mockReturnValue(pending.promise)
    const store = new AvatarStore(storage)
    const reading = store.reload()
    expect(await store.reset()).toBe(true)
    pending.reject(new Error('old read failed'))
    await reading
    expect(store.getSnapshot()).toEqual({ outfit: emptyOutfit(), loaded: true, loading: false, busy: false, error: '' })
    expect(await store.save({ ...emptyOutfit(), hat: 'hat-crown' })).toBe(true)
  })

  it('does not queue an old draft attempted during a pending save', async () => {
    const pending = deferred<void>()
    const storage = repository()
    const save = vi.spyOn(storage, 'save').mockReturnValueOnce(pending.promise).mockResolvedValue(undefined)
    const store = new AvatarStore(storage)
    await store.reload()
    const next = { ...emptyOutfit(), hat: 'hat-crown' }
    const writing = store.save(next)
    expect(await store.save(emptyOutfit())).toBe(false)
    pending.resolve()
    await writing
    await Promise.resolve()
    expect(save).toHaveBeenCalledOnce()
    expect(store.getSnapshot().outfit).toEqual(next)
    const subsequentChoice = { ...next, glasses: 'glasses-round' }
    expect(await store.save(subsequentChoice)).toBe(true)
    expect(store.getSnapshot().outfit).toEqual(subsequentChoice)
  })

  it('explicit reset can recover from failed reads and invalidates an earlier load', async () => {
    const pending = deferred<AvatarOutfit>()
    const storage = repository()
    vi.spyOn(storage, 'load').mockReturnValue(pending.promise)
    const reset = vi.spyOn(storage, 'reset')
    const store = new AvatarStore(storage)
    const loading = store.reload()
    expect(await store.save({ ...emptyOutfit(), hat: 'hat-cap' })).toBe(false)
    expect(await store.reset()).toBe(true)
    expect(reset).toHaveBeenCalledOnce()
    pending.resolve({ ...emptyOutfit(), hat: 'hat-cap' })
    await loading
    expect(store.getSnapshot()).toMatchObject({ outfit: emptyOutfit(), loaded: true, loading: false, busy: false })
  })

  it('does not clear an outfit when resetting the storage fails', async () => {
    const original = { ...emptyOutfit(), accessory: 'accessory-bow' }
    const storage = repository(original)
    vi.spyOn(storage, 'reset').mockRejectedValue(new Error('초기화 실패'))
    const store = new AvatarStore(storage)
    await store.reload()
    expect(await store.reset()).toBe(false)
    expect(store.getSnapshot()).toMatchObject({ outfit: original, loaded: true, busy: false, error: '초기화 실패' })
  })

  it('does not reload while a write is in flight', async () => {
    const pending = deferred<void>()
    const storage = repository()
    const load = vi.spyOn(storage, 'load')
    vi.spyOn(storage, 'save').mockReturnValue(pending.promise)
    const store = new AvatarStore(storage)
    await store.reload()
    const writing = store.save({ ...emptyOutfit(), hat: 'hat-beanie' })
    await store.reload()
    expect(load).toHaveBeenCalledOnce()
    pending.resolve()
    await writing
    expect(store.getSnapshot().outfit.hat).toBe('hat-beanie')
  })
})
