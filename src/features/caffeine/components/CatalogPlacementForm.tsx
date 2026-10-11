import { useId, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react'
import type { Drink, DrinkCategory, DrinkCategoryId } from '../model/caffeine.types'

/** Explicit button alternative for users who cannot drag the catalog. */
export function CatalogPlacementForm({ categories, drinks, busy, onReorderCategories, onMoveDrink, onDone }: {
  categories: readonly DrinkCategory[]
  drinks: readonly Drink[]
  busy: boolean
  onReorderCategories: (ids: DrinkCategoryId[]) => Promise<boolean>
  onMoveDrink: (id: string, categoryId: DrinkCategoryId, beforeDrinkId?: string) => Promise<boolean>
  onDone: () => void
}) {
  const id = useId()
  const [selected, setSelected] = useState(categories[0] ? `category:${categories[0].id}` : '')
  const [destination, setDestination] = useState<DrinkCategoryId | ''>('')
  const category = categories.find(item => selected === `category:${item.id}`)
  const drink = drinks.find(item => selected === `drink:${item.id}`)
  const siblings = drink ? drinks.filter(item => item.categoryId === drink.categoryId) : categories
  const index = siblings.findIndex(item => item.id === (category?.id ?? drink?.id))
  async function finish(operation: () => Promise<boolean>) { if (await operation()) onDone() }
  function move(offset: number) {
    if (busy || index < 0 || index + offset < 0 || index + offset >= siblings.length) return
    if (category) {
      const ids = categories.map(item => item.id)
      ids.splice(index, 1)
      ids.splice(index + offset, 0, category.id)
      void finish(() => onReorderCategories(ids))
    } else if (drink) void finish(() => onMoveDrink(drink.id, drink.categoryId, siblings[index + (offset < 0 ? -1 : 2)]?.id))
  }
  return <div className="catalog-placement-form">
    <label htmlFor={`${id}-item`}>배치할 항목</label>
    <select id={`${id}-item`} value={selected} disabled={busy} onChange={event => { setSelected(event.target.value); setDestination('') }}>
      <optgroup label="카테고리">{categories.map(item => <option key={item.id} value={`category:${item.id}`}>{item.name}</option>)}</optgroup>
      {categories.map(item => <optgroup key={item.id} label={`${item.name} 음료`}>{drinks.filter(drink => drink.categoryId === item.id).map(drink => <option key={drink.id} value={`drink:${drink.id}`}>{drink.name}</option>)}</optgroup>)}
    </select>
    <div className="catalog-action-order">
      <button type="button" disabled={busy || index <= 0} onClick={() => move(-1)}>{category ? <ArrowUp size={18} aria-hidden="true" /> : <ArrowLeft size={18} aria-hidden="true" />}{category ? '위로 이동' : '앞으로 이동'}</button>
      <button type="button" disabled={busy || index < 0 || index >= siblings.length - 1} onClick={() => move(1)}>{category ? <ArrowDown size={18} aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}{category ? '아래로 이동' : '뒤로 이동'}</button>
    </div>
    {drink && <div className="catalog-action-destination">
      <label htmlFor={`${id}-destination`}>옮길 카테고리</label>
      <select id={`${id}-destination`} value={destination} disabled={busy} onChange={event => setDestination(event.target.value as DrinkCategoryId)}>
        <option value="">카테고리 선택</option>
        {categories.filter(item => item.id !== drink.categoryId).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <button type="button" className="button-secondary" disabled={busy || !destination} onClick={() => { if (destination) void finish(() => onMoveDrink(drink.id, destination)) }}>카테고리로 이동</button>
    </div>}
  </div>
}
