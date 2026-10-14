import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { AvatarRepository } from '../repository/AvatarRepository'
import { AvatarStore } from './avatarStore'

export function useAvatar(repository: AvatarRepository) {
  const store = useMemo(() => new AvatarStore(repository), [repository])
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  useEffect(() => { void store.reload() }, [store])
  return { ...state, reload: store.reload, save: store.save, reset: store.reset }
}
