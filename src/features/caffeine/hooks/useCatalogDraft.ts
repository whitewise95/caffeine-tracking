import { useCallback, useRef, useState } from 'react'
import { CatalogDraft, type CatalogChange } from '../model/catalogDraft'
import { addCustomDrink, availableDrinks, categoryDrinkIds, createDrinkCategory, deleteDrinkCategory, deleteDrinkFromCatalog, drinkCategories, moveDrinkInCatalog, renameDrinkCategory, reorderDrinkCategories, updateDrinkInCatalog } from '../model/drinkCategories'
import type { CaffeineState, CustomDrinkDraft, Drink, DrinkCategoryId, DrinkEditDraft } from '../model/caffeine.types'

export function useCatalogDraft(onCommit: (change: CatalogChange) => Promise<boolean>) {
  const session = useRef<CatalogDraft | null>(null)
  const [state, setState] = useState<CaffeineState | null>(null)
  const [busy, setBusy] = useState(false)
  const saving = useRef(false)
  const [error, setError] = useState('')

  const begin = useCallback((source: CaffeineState) => {
    if (session.current || saving.current) return
    session.current = new CatalogDraft(source)
    setState(source)
    setError('')
  }, [])
  const discard = useCallback(() => {
    session.current = null
    setState(null)
    setError('')
  }, [])
  function reset() {
    if (saving.current || !session.current) return
    session.current.reset()
    setState(session.current.state)
    setError('')
  }
  async function stage(change: CatalogChange) {
    if (saving.current || !session.current) return false
    try {
      session.current.stage(change)
      setState(session.current.state)
      setError('')
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '편집 내용을 확인해 주세요.')
      return false
    }
  }
  async function finish() {
    const draft = session.current
    if (!draft || saving.current) return false
    if (!draft.changed) { discard(); return true }
    saving.current = true
    setBusy(true)
    setError('')
    try {
      const saved = await onCommit(draft.snapshot())
      if (session.current === draft) {
        if (saved) discard()
        else setError('편집 내용을 저장하지 못했어요. 완료를 눌러 다시 시도해 주세요.')
      }
      return saved
    } catch {
      if (session.current === draft) setError('편집 내용을 저장하지 못했어요. 완료를 눌러 다시 시도해 주세요.')
      return false
    } finally {
      saving.current = false
      setBusy(false)
    }
  }
  async function createDrink(input: CustomDrinkDraft): Promise<Drink | null> {
    const ids = { drinkId: crypto.randomUUID(), categoryId: `custom:${crypto.randomUUID()}` as const }
    const saved = await stage(state => addCustomDrink(state, input, ids).state)
    return saved && session.current ? availableDrinks(session.current.state).find(drink => drink.id === ids.drinkId) ?? null : null
  }
  const categories = state ? drinkCategories(state) : null
  const entryCounts = state && categories ? Object.fromEntries(categories.map(category => {
    const ids = categoryDrinkIds(state, category.id)
    return [category.id, state.entries.filter(entry => ids.has(entry.drinkId)).length]
  })) : null
  return {
    active: state !== null, begin, discard, reset, finish, busy, error, clearError: () => setError(''),
    changed: session.current?.changed ?? false,
    categories, drinks: state ? availableDrinks(state) : null, entryCounts,
    createDrink,
    onCreateCategory: (name: string) => { const id = `custom:${crypto.randomUUID()}` as const; return stage(state => createDrinkCategory(state, name, id)) },
    onRenameCategory: (id: DrinkCategoryId, name: string) => stage(state => renameDrinkCategory(state, id, name)),
    onDeleteCategory: (id: DrinkCategoryId, destination?: DrinkCategoryId) => stage(state => deleteDrinkCategory(state, id, destination)),
    onForceDeleteCategory: (id: DrinkCategoryId) => stage(state => deleteDrinkCategory(state, id, undefined, 'force')),
    onReorderCategories: (ids: DrinkCategoryId[]) => stage(state => reorderDrinkCategories(state, ids)),
    onMoveDrink: (id: string, category: DrinkCategoryId, before?: string) => stage(state => moveDrinkInCatalog(state, id, category, before)),
    onUpdateDrink: (id: string, input: DrinkEditDraft) => stage(state => updateDrinkInCatalog(state, id, input)),
    onDeleteDrink: (id: string) => stage(state => deleteDrinkFromCatalog(state, id)),
  }
}
